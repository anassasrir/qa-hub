import fs from "fs";
import path from "path";
import {
  RunData,
  TestData,
  TestResult,
  PlaywrightJson,
  PlaywrightSuite,
  inferTestCategory,
} from "./utils";

export { getAllRuns, parsePlaywrightJson };

/**
 * Lit tous les runs disponibles (locaux et CI)
 */
function getAllRuns(): RunData[] {
  const allRuns: RunData[] = [];

  try {
    // 1. Lire les artefacts locaux (artifact/*) uniquement si on n'est pas en CI
    if (!process.env.CI) {
      let artifactPath = path.resolve(process.cwd(), "../../artifact");
      if (!fs.existsSync(artifactPath)) {
        const rootCand = path.resolve(process.cwd(), "artifact");
        if (fs.existsSync(rootCand)) artifactPath = rootCand;
      }
      if (fs.existsSync(artifactPath)) {
        const localFolders = fs
          .readdirSync(artifactPath)
          .filter((f) => fs.lstatSync(path.join(artifactPath, f)).isDirectory());

        localFolders.forEach((folder) => {
          const filePath = path.join(artifactPath, folder, "test-results", "results.json");
          if (fs.existsSync(filePath)) {
            try {
              const run = parsePlaywrightJson(filePath, `Local Run - ${folder}`, folder);
              if (run) allRuns.push(run);
            } catch (e) {
              console.error(`Failed to parse local run ${folder}:`, e);
            }
          }
        });
      }
    }

    // 2. Lire les runs de la CI (public/runs/*)
    let ciPath = path.resolve(process.cwd(), "public/runs");
    if (!fs.existsSync(ciPath)) {
      const fallback = path.resolve(process.cwd(), "apps/tms/public/runs");
      if (fs.existsSync(fallback)) {
        ciPath = fallback;
      }
    }
    if (fs.existsSync(ciPath)) {
      const ciFolders = fs.readdirSync(ciPath);
      ciFolders.forEach((folder) => {
        const savedResultsPath = path.join(ciPath, folder, "results.json");
        
        if (fs.existsSync(savedResultsPath)) {
          try {
            const content = JSON.parse(fs.readFileSync(savedResultsPath, "utf8")) as RunData;
            if (!content || !content.id || !Array.isArray(content.tests)) {
              return;
            }

            content.id = content.id.startsWith("CI-") ? `CI Run - ${content.id.replace("CI-", "")}` : content.id;
            content.branch =
              content.branch || (content as { ref?: string }).ref || undefined;
            
            // Normalize or Infer environment
            const rawEnv = (content.environment || "").toLowerCase();
            const idLower = content.id.toLowerCase();
            const dateLower = (content.date || "").toLowerCase();

            if (rawEnv.includes("staging") || idLower.includes("staging") || dateLower.includes("staging")) {
              content.environment = "staging";
            } else if (rawEnv.includes("dev") || idLower.includes("dev") || dateLower.includes("dev")) {
              content.environment = "dev";
            } else {
              // Scan tests for environment-specific URLs or labels
              const contentString = JSON.stringify(content.tests).toLowerCase();
              if (contentString.includes("-staging") || contentString.includes(".staging") || contentString.includes("/staging")) {
                content.environment = "staging";
              } else if (contentString.includes("-dev") || contentString.includes(".dev") || contentString.includes("/dev")) {
                content.environment = "dev";
              } else {
                content.environment = "staging"; // Default
              }
            }
            
            // On s'assure que les chemins des attachements sont corrects et que la catégorie est renseignée
            content.tests.forEach((test) => {
              if (!test) return;

              if (!test.category) {
                test.category = inferTestCategory(test.file, test.title);
              }
              if (test.project === "tpbp-visual") {
                test.project = "tpbp";
              }
              
              // Unifier la structure : on s'assure que results existe
              if (!test.results && test.status) {
                test.results = [{
                  status: test.status,
                  duration: 0,
                  error: null,
                  attachments: []
                }];
              }

              test.results?.forEach((res: TestResult) => {
                res.attachments?.forEach((att) => {
                  if (att && att.path) {
                    let webPath = att.path;
                    if (webPath.startsWith("/builds/")) {
                      const testResultsMatch = webPath.match(/test-results\/(.+)$/);
                      if (testResultsMatch) {
                        webPath = `/runs/${folder}/test-results/${testResultsMatch[1]}`;
                      }
                    } else if (!webPath.startsWith("/")) {
                      webPath = `/runs/${folder}/${webPath}`;
                    }
                    att.path = webPath;
                  }
                });
              });
            });

            if (content.project === "tpbp-visual") {
              content.project = "tpbp";
            }
            
            allRuns.push(content);
          } catch (e) {
            console.error(`Failed to parse CI run ${folder}:`, e);
          }
        }
      });
    }

    if (allRuns.length === 0) {
      let baselinePath = path.resolve(process.cwd(), "data/latest-results.json");
      if (!fs.existsSync(baselinePath)) {
        const alt = path.resolve(process.cwd(), "apps/qa-dashboard/data/latest-results.json");
        if (fs.existsSync(alt)) baselinePath = alt;
      }
      if (fs.existsSync(baselinePath)) {
        const fallbackRun = parsePlaywrightJson(baselinePath, "Baseline Run", new Date().toISOString());
        if (fallbackRun) allRuns.push(fallbackRun);
      }
    }
  } catch (globalError) {
    console.error("Global error in getAllRuns:", globalError);
  }

  return allRuns
    .filter((run) => {
      // En CI, on ne veut JAMAIS voir de "Local Run"
      if (process.env.CI && run.id.toLowerCase().includes("local run")) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
}

/**
 * Parse un fichier JSON généré par Playwright
 */
function parsePlaywrightJson(filePath: string, id: string, date: string): RunData | null {
  try {
    const rawData = fs.readFileSync(filePath, "utf8");
    const content = JSON.parse(rawData) as PlaywrightJson;
    if (!content || !content.suites) return null;

    const rawProject = content.config?.projects?.[0]?.name || "N/A";
    const project = rawProject === "tpbp-visual" ? "tpbp" : rawProject;
    const allTests: TestData[] = [];

    const recursiveExtract = (suites: PlaywrightSuite[], parentTitle = "") => {
      suites?.forEach((suite) => {
        if (!suite) return;
        const currentSuiteTitle = suite.title || parentTitle;
        suite.specs?.forEach((spec) => {
          if (!spec || !Array.isArray(spec.tests)) return;
          spec.tests.forEach((test) => {
            const results = test.results || [];
            const formattedResults: TestResult[] = results.map((res) => {
              const retryAttachments = res.attachments?.map((att) => {
                let webPath = att.path;
                if (webPath) {
                  const artifactMatch = webPath.match(/artifact\/(.+)$/);
                  if (artifactMatch) {
                    webPath = `/artifacts/${artifactMatch[1]}`;
                  } else {
                    const ciMatch = webPath.match(/data\/runs\/(.+)$/);
                    if (ciMatch) {
                      webPath = `/runs/${ciMatch[1]}`;
                    }
                  }
                }
                return { 
                  name: att.name,
                  contentType: att.contentType,
                  path: webPath || "" 
                };
              }) || [];

              return {
                status: res.status,
                duration: res.duration || 0,
                error: res.error ? {
                  message: res.error.message,
                  stack: res.error.stack,
                } : null,
                attachments: retryAttachments,
                steps: res.steps
              };
            });

            let status = test.status || (results.length > 0 ? results[results.length - 1].status : "unknown");
            if (status === "expected") status = "passed";
            if (status === "unexpected") status = "failed";

            const rawTestProject = test.projectName || project;
            const normalizedProject =
              rawTestProject === "tpbp-visual" ? "tpbp" : rawTestProject;
            const category = inferTestCategory(spec.file, spec.title);

            allTests.push({
              title: spec.title || "Untitled",
              suite: currentSuiteTitle,
              status: status,
              duration: Array.isArray(results) ? results.reduce((acc: number, r) => acc + (r.duration || 0), 0) : 0,
              file: spec.file || "unknown",
              project: normalizedProject,
              category,
              results: formattedResults
            });
          });
        });
        if (suite.suites) recursiveExtract(suite.suites, currentSuiteTitle);
      });
    };
    recursiveExtract(content.suites);

    return {
      id,
      date,
      project,
      stats: {
        total: content.stats ? (Number(content.stats.expected || 0) + Number(content.stats.unexpected || 0) + Number(content.stats.skipped || 0) + Number(content.stats.flaky || 0)) : allTests.length,
        expected: content.stats?.expected ?? allTests.filter((t) => ["passed", "expected"].includes(t.status)).length,
        unexpected: content.stats?.unexpected ?? allTests.filter((t) => ["failed", "unexpected"].includes(t.status)).length,
        skipped: content.stats?.skipped ?? allTests.filter((t) => t.status === "skipped").length,
        flaky: content.stats?.flaky ?? allTests.filter((t) => t.status === "flaky").length,
        duration: content.stats?.duration || 0,
      },
      tests: allTests,
    };
  } catch (e) {
    console.error(`Error in parsePlaywrightJson for ${filePath}:`, e);
    return null;
  }
}
