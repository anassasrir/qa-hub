import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { syncSonar } from "./syncSonar";
import { inferTestCategory, TestCategory } from "./utils";
import { VisualDiffItem } from "./parseVisual";

const appRootDir = path.resolve(__dirname, "..");

interface GitLabPipeline {
  id: number;
  ref: string;
  sha?: string;
  created_at: string;
  status: string;
  name?: string;
}

interface GitLabJob {
  id: number;
  name: string;
  status: string;
  artifacts_file?: {
    filename: string;
    size: number;
  };
}

interface PlaywrightAttachment {
  name: string;
  contentType: string;
  path: string;
}

interface PlaywrightStep {
  title: string;
  duration: number;
  error?: {
    message: string;
    stack: string;
  };
  steps?: PlaywrightStep[];
}

interface PlaywrightTestResult {
  status: string;
  duration: number;
  error?: {
    message: string;
    stack: string;
  };
  attachments?: PlaywrightAttachment[];
  steps?: PlaywrightStep[];
}

interface PlaywrightTest {
  projectName: string;
  status: string;
  results: PlaywrightTestResult[];
}

interface PlaywrightSpec {
  title: string;
  file: string;
  tests: PlaywrightTest[];
}

interface PlaywrightSuite {
  title: string;
  specs?: PlaywrightSpec[];
  suites?: PlaywrightSuite[];
}

interface PlaywrightResults {
  suites: PlaywrightSuite[];
  metadata?: {
    testProject?: string;
    jobId?: string;
    runTimestamp?: string;
  };
  stats?: {
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
    duration: number;
  };
}

interface IngestedResult {
  status: string;
  duration: number;
  error: { message: string; stack: string } | null;
  attachments: { name: string; contentType: string; path: string }[];
  steps?: PlaywrightStep[];
}

interface IngestedTest {
  title: string;
  suite: string;
  status: string;
  duration: number;
  file: string;
  project: string;
  results: IngestedResult[];
  reportUrl?: string;
  category?: TestCategory;
}

/**
 * Recherche tous les fichiers correspondant à un motif dans un dossier
 */
function findFilesRecursive(
  dir: string,
  fileNamePattern: string | RegExp,
): string[] {
  if (!fs.existsSync(dir)) return [];
  const results: string[] = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      results.push(...findFilesRecursive(fullPath, fileNamePattern));
    } else {
      if (typeof fileNamePattern === "string") {
        if (file === fileNamePattern) results.push(fullPath);
      } else if (fileNamePattern.test(file)) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

/**
 * Supprime un dossier et son contenu de manière récursive
 */
function deleteFolderRecursive(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

/**
 * Nettoyage agressif des fichiers inutiles pour le dashboard
 */
function cleanupJobArtifacts(jobDir: string, keepVideos = false) {
  if (!fs.existsSync(jobDir)) return;

  const htmlReportDir = path.join(jobDir, "playwright-report");
  if (fs.existsSync(htmlReportDir)) deleteFolderRecursive(htmlReportDir);

  const scanAndClean = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        scanAndClean(fullPath);
        if (fs.readdirSync(fullPath).length === 0) fs.rmdirSync(fullPath);
      } else {
        const ext = path.extname(file).toLowerCase();
        // On garde toujours les JSON et les images
        const allowedExts = [".json", ".png"];
        // On ne garde les vidéos que si explicitement demandé
        if (keepVideos) {
          allowedExts.push(".webm", ".mp4");
        }

        if (!allowedExts.includes(ext)) {
          fs.unlinkSync(fullPath);
        }
      }
    });
  };
  scanAndClean(jobDir);
}

/**
 * Vérifie si un artefact est valide (existe et n'est pas vide)
 */
function isValidAttachment(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stats = fs.statSync(filePath);
    return stats.size > 0;
  } catch {
    return false;
  }
}

/**
 * Ingestion des artefacts Playwright locaux (pour le run en cours dans la CI)
 */
async function ingestLocalArtifacts() {
  const CI_PIPELINE_ID = process.env.CI_PIPELINE_ID;
  if (!process.env.CI || !CI_PIPELINE_ID) return;

  const artifactBaseDir = path.resolve(appRootDir, "../../artifact");
  if (!fs.existsSync(artifactBaseDir)) {
    console.log("ℹ️ No local artifacts found to ingest.");
    return;
  }

  const runDir = path.resolve(appRootDir, `public/runs/${CI_PIPELINE_ID}`);
  console.log(`📦 Ingesting local artifacts for Pipeline ${CI_PIPELINE_ID}...`);

  const testsMap = new Map<string, IngestedTest>();
  const mergedStats: Record<string, number> = {
    expected: 0,
    unexpected: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
  };
  let hasData = false;

  const folders = fs.readdirSync(artifactBaseDir);
  for (const folder of folders) {
    const jobDir = path.join(artifactBaseDir, folder);
    if (!fs.lstatSync(jobDir).isDirectory()) continue;

    const resultsFiles = findFilesRecursive(jobDir, /^results.*\.json$/);

    for (const resultsPath of resultsFiles) {
      if (path.basename(resultsPath) === "latest-results.json") continue;

      try {
        hasData = true;
        const rawContent = fs.readFileSync(resultsPath, "utf8");
        const content = JSON.parse(rawContent) as PlaywrightResults;
        const jobId = content.metadata?.jobId;
        const runTimestamp = content.metadata?.runTimestamp || folder;
        const reportUrl = jobId
          ? `https://anatec.gitlab.io/-/frontend/qa/wesave-test-qa/-/jobs/${jobId}/artifacts/artifact/${runTimestamp}/playwright-report/index.html`
          : undefined;

        const businessProject =
          content.metadata?.testProject ||
          path
            .basename(resultsPath)
            .match(/results-(test-([^-]+)-.*)\.json/)?.[2] ||
          "";

        const destJobDir = path.join(runDir, folder);
        if (!fs.existsSync(destJobDir))
          fs.mkdirSync(destJobDir, { recursive: true });

        const copyRecursive = (src: string, dest: string) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          fs.readdirSync(src).forEach((file) => {
            const s = path.join(src, file);
            const d = path.join(dest, file);
            if (fs.lstatSync(s).isDirectory()) copyRecursive(s, d);
            else fs.copyFileSync(s, d);
          });
        };
        copyRecursive(jobDir, destJobDir);
        cleanupJobArtifacts(destJobDir, true);

        const extractTests = (suites: PlaywrightSuite[], parentTitle = "") => {
          suites?.forEach((suite: PlaywrightSuite) => {
            const currentSuiteTitle = suite.title || parentTitle;
            suite.specs?.forEach((spec: PlaywrightSpec) => {
              spec.tests?.forEach((test: PlaywrightTest) => {
                const results = test.results || [];
                const formattedResults: IngestedResult[] = results.map(
                  (res: PlaywrightTestResult) => {
                    const retryAttachments =
                      res.attachments
                        ?.map((att: PlaywrightAttachment) => {
                          let attPath = att.path;
                          if (attPath) {
                            const fileName = path.basename(attPath);
                            const parts = attPath.split(/[\\/]/);
                            const testResultsIdx =
                              parts.indexOf("test-results");
                            if (testResultsIdx !== -1) {
                              attPath = path.join(
                                folder,
                                ...parts.slice(testResultsIdx),
                              );
                            } else {
                              attPath = path.join(folder, fileName);
                            }
                          }
                          return { ...att, path: attPath };
                        })
                        .filter((att) => {
                          if (!att.path) return false;
                          const fullPath = path.join(runDir, att.path);
                          return isValidAttachment(fullPath);
                        }) || [];

                    return {
                      status: res.status,
                      duration: res.duration || 0,
                      error: res.error
                        ? { message: res.error.message, stack: res.error.stack }
                        : null,
                      attachments: retryAttachments,
                      steps: res.steps,
                    };
                  },
                );

                let status =
                  test.status ||
                  (results.length > 0
                    ? results[results.length - 1].status
                    : "unknown");
                if (status === "expected") status = "passed";
                if (status === "unexpected") status = "failed";

                const finalFile =
                  businessProject && !spec.file.includes(businessProject)
                    ? `${businessProject}/${spec.file}`
                    : spec.file;

                const testKey = `${currentSuiteTitle} > ${spec.title} [${test.projectName}] [${businessProject}]`;
                if (testsMap.has(testKey)) {
                  const existing = testsMap.get(testKey)!;
                  existing.results = [...existing.results, ...formattedResults];
                  if (reportUrl) {
                    existing.reportUrl = reportUrl;
                  }
                  if (
                    status === "passed" &&
                    (existing.status === "failed" ||
                      existing.status === "unexpected")
                  )
                    existing.status = "flaky";
                  else if (
                    (status === "failed" || status === "unexpected") &&
                    existing.status === "passed"
                  )
                    existing.status = "flaky";
                } else {
                  testsMap.set(testKey, {
                    title: spec.title,
                    suite: currentSuiteTitle,
                    status: status,
                    duration: results.reduce(
                      (acc: number, r: PlaywrightTestResult) =>
                        acc + (r.duration || 0),
                      0,
                    ),
                    file: finalFile,
                    project: test.projectName,
                    results: formattedResults,
                    reportUrl,
                  });
                }
              });
            });
            if (suite.suites) extractTests(suite.suites, currentSuiteTitle);
          });
        };
        extractTests(content.suites);

        if (content.stats) {
          mergedStats.expected += content.stats.expected || 0;
          mergedStats.unexpected += content.stats.unexpected || 0;
          mergedStats.skipped += content.stats.skipped || 0;
          mergedStats.flaky += content.stats.flaky || 0;
          mergedStats.duration += content.stats.duration || 0;
        }
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`   ❌ Error ingesting local job ${folder}: ${message}`);
      }
    }
  }

  if (hasData) {
    const allTests = Array.from(testsMap.values());
    const rawEnv = (process.env.INFISICAL_ENV || "staging").toLowerCase();
    const finalData = {
      id: `CI-${CI_PIPELINE_ID}`,
      date: new Date().toISOString(),
      branch: process.env.CI_COMMIT_REF_NAME || "main",
      environment: rawEnv.includes("dev") ? "dev" : "staging",
      stats: { ...mergedStats, total: allTests.length },
      tests: allTests,
    };
    if (!fs.existsSync(runDir)) fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, "results.json"),
      JSON.stringify(finalData, null, 2),
    );
    console.log(
      `🚀 Current Pipeline ${CI_PIPELINE_ID} ingested successfully with ${allTests.length} tests.`,
    );
  }
}

/**
 * Parse ESLint results
 */
export function parseEslint(filePath: string) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let errors = 0;
    let warnings = 0;
    if (Array.isArray(content)) {
      content.forEach((r: { errorCount?: number; warningCount?: number }) => {
        errors += r.errorCount || 0;
        warnings += r.warningCount || 0;
      });
      return { errors, warnings };
    } else if (content && typeof content === "object") {
      return {
        errors:
          content.errors !== undefined
            ? content.errors
            : content.errorCount || 0,
        warnings:
          content.warnings !== undefined
            ? content.warnings
            : content.warningCount || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Coverage summary
 */
export function parseCoverage(
  filePath: string,
): Record<string, unknown> | null {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (content.total && content.total.lines) {
      return {
        percentage: content.total.lines.pct,
        details: {
          Statements: content.total.statements?.pct || 0,
          Branches: content.total.branches?.pct || 0,
          Functions: content.total.functions?.pct || 0,
          Lines: content.total.lines?.pct || 0,
        },
      };
    }
    if (content.percentage !== undefined) {
      return { percentage: content.percentage, details: content.details || {} };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse NPM Audit results
 */
export function parseAudit(filePath: string): Record<string, unknown> | null {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const vulnerabilities =
      content.metadata?.vulnerabilities || content.vulnerabilities;
    const dependencies =
      content.metadata?.dependencies?.total ||
      content.metadata?.dependencies ||
      content.totalDependencies ||
      0;

    if (vulnerabilities) {
      // On tente d'extraire la liste détaillée si elle est présente (advisories ou déjà formatée)
      let vulnerabilitiesList = content.vulnerabilitiesList || [];

      const advisories = content.advisories;
      if (advisories && Object.keys(advisories).length > 0) {
        vulnerabilitiesList = (Object.values(advisories) as Array<{
          severity: string;
          title: string;
          module_name: string;
          vulnerable_versions: string;
          patched_versions: string;
          url: string;
        }>).map(
          (advisory) => ({
            severity: advisory.severity,
            title: advisory.title,
            package: advisory.module_name,
            vulnerableVersion: advisory.vulnerable_versions,
            patchedVersion: advisory.patched_versions,
            link: advisory.url,
          }),
        );
      }

      return {
        vulnerabilities: {
          low: vulnerabilities.low || 0,
          moderate: vulnerabilities.moderate || 0,
          high: vulnerabilities.high || 0,
          critical: vulnerabilities.critical || 0,
        },
        vulnerabilitiesList,
        totalDependencies:
          typeof dependencies === "number"
            ? dependencies
            : dependencies.total || 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse Typecheck results
 */
export function parseTypecheck(
  filePath: string,
): Record<string, unknown> | null {
  try {
    const rawContent = fs.readFileSync(filePath, "utf8");
    try {
      const content = JSON.parse(rawContent);
      return {
        errors:
          content.errors !== undefined
            ? content.errors
            : content.errorCount !== undefined
              ? content.errorCount
              : 0,
      };
    } catch {
      const errorMatch = rawContent.match(/Found (\d+) error/);
      if (errorMatch) return { errors: parseInt(errorMatch[1], 10) };
      if (rawContent.includes("error TS")) {
        const errorCount = rawContent
          .split("\n")
          .filter((l) => l.includes("error TS")).length;
        return { errors: errorCount };
      }
      return { errors: 0 };
    }
  } catch {
    return null;
  }
}

/**
 * Traite un fichier de métrique et met à jour le fichier destination avec historique
 */
function processQualityFile(
  projectDataDir: string,
  sourceFilePath: string,
  fileName: string,
  label: string,
  parser: (path: string) => Record<string, unknown> | null,
  timestamp: string,
) {
  try {
    const res = parser(sourceFilePath);
    if (!res) return;

    let targetFileName = fileName
      .replace("-results", "")
      .replace("-summary", "");
    if (targetFileName === "audit-prod.json") targetFileName = "auditProd.json";
    if (targetFileName === "audit-dev.json") targetFileName = "auditDev.json";

    const filePath = path.join(projectDataDir, targetFileName);
    let history: { timestamp: string }[] = [];

    if (fs.existsSync(filePath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (existing.error && sourceFilePath === filePath) return;
        history = existing.history || [];
      } catch {}
    }

    if (!history.find((h) => h.timestamp === timestamp)) {
      history.push({ timestamp, ...res });
    }

    fs.writeFileSync(
      filePath,
      JSON.stringify({ label, timestamp, ...res, history }, null, 2),
    );
    console.log(
      `     ✅ Updated ${targetFileName} (History: ${history.length} entries)`,
    );
  } catch (err) {
    console.error(`     ❌ Error processing ${fileName}:`, err);
  }
}

interface Project {
  id: string;
  projectId: string;
  url: string;
  branch: string;
  coverageJob: string;
}

/**
 * Ingestion des données de qualité locales (pour le run en cours)
 */
async function ingestLocalQualityData() {
  const projectDataDir = path.resolve(appRootDir, "data/wesave-test-qa");
  if (!fs.existsSync(projectDataDir)) {
    fs.mkdirSync(projectDataDir, { recursive: true });
  }

  const timestamp =
    process.env.CI_PIPELINE_CREATED_AT || new Date().toISOString();
  console.log(`📊 Checking for local quality metrics in ${projectDataDir}...`);

  const metrics = [
    { file: "eslint-results.json", label: "ESLint", parser: parseEslint },
    {
      file: "vuetsclint-results.json",
      label: "Vue TSC Lint",
      parser: parseEslint,
    },
    {
      file: "coverage-summary.json",
      label: "Couverture",
      parser: parseCoverage,
    },
    { file: "audit-prod.json", label: "Audit Prod", parser: parseAudit },
    { file: "audit-dev.json", label: "Audit Dev", parser: parseAudit },
    { file: "typecheck.json", label: "Typage", parser: parseTypecheck },
  ];

  let found = 0;
  for (const m of metrics) {
    const filePath = path.join(projectDataDir, m.file);
    if (fs.existsSync(filePath)) {
      processQualityFile(
        projectDataDir,
        filePath,
        m.file,
        m.label,
        m.parser,
        timestamp,
      );
      found++;
    } else {
      const dashboardFile = m.file
        .replace("-results", "")
        .replace("-summary", "");
      let targetFile = dashboardFile;
      if (dashboardFile === "audit-prod.json") targetFile = "auditProd.json";
      if (dashboardFile === "audit-dev.json") targetFile = "auditDev.json";

      const dashboardPath = path.join(projectDataDir, targetFile);
      if (fs.existsSync(dashboardPath)) {
        try {
          const content = JSON.parse(fs.readFileSync(dashboardPath, "utf-8"));
          if (!content.error) {
            processQualityFile(
              projectDataDir,
              dashboardPath,
              m.file,
              m.label,
              m.parser,
              content.timestamp || timestamp,
            );
            found++;
          }
        } catch {}
      }
    }
  }
  if (found === 0) console.log("ℹ️ No local quality metrics found to ingest.");
}

/**
 * Synchronise les données de qualité pour tous les projets via GitLab API
 */
export async function syncQualityData(api: AxiosInstance) {
  const projectsPath = path.resolve(__dirname, "projects.json");
  let projects: Project[] = [];

  try {
    projects = JSON.parse(fs.readFileSync(projectsPath, "utf-8"));
  } catch (err) {
    console.error("❌ Could not read projects.json:", err);
    return;
  }

  console.log(`🔍 Syncing Quality Metrics for ${projects.length} projects...`);

  for (const p of projects) {
    if (!p.projectId) continue;

    try {
      const currentRef = process.env.CI_COMMIT_REF_NAME || p.branch || "main";
      console.log(
        `   - Project ${p.id}: Fetching pipelines for ${currentRef}...`,
      );

      const { data: pipelines } = await api.get<GitLabPipeline[]>(
        `/projects/${p.projectId}/pipelines`,
        {
          params: { per_page: 20, ref: currentRef },
        },
      );

      if (pipelines.length === 0 && currentRef !== "main") {
        console.log(`     ℹ️ No pipelines on ${currentRef}, trying main...`);
        const { data: mainPipelines } = await api.get<GitLabPipeline[]>(
          `/projects/${p.projectId}/pipelines`,
          {
            params: { per_page: 20, ref: "main" },
          },
        );
        pipelines.push(...mainPipelines);
      }

      if (pipelines.length === 0) {
        console.log(`     ⚠️ No pipelines found for project ${p.id}`);
        continue;
      }

      const sortedPipelines = [...pipelines].reverse();

      for (const pipeline of sortedPipelines) {
        const { data: jobs } = await api.get<GitLabJob[]>(
          `/projects/${p.projectId}/pipelines/${pipeline.id}/jobs`,
        );

        const projectDataDir = path.resolve(appRootDir, `data/${p.id}`);
        if (!fs.existsSync(projectDataDir))
          fs.mkdirSync(projectDataDir, { recursive: true });

        const qualityJobs = jobs.filter((job) => {
          if (
            !job.artifacts_file ||
            (job.status !== "success" && job.status !== "failed")
          )
            return false;
          const name = job.name.toLowerCase();
          return (
            name.includes("lint") ||
            name.includes("test") ||
            name.includes("coverage") ||
            name.includes("audit") ||
            name.includes("quality") ||
            name.includes("typecheck") ||
            name.includes("tsc")
          );
        });

        if (qualityJobs.length === 0) continue;

        console.log(
          `     📦 Pipeline ${pipeline.id} (${pipeline.status}): Found ${qualityJobs.length} potential quality jobs.`,
        );

        for (const job of qualityJobs) {
          console.log(
            `       📥 Downloading artifacts from: ${job.name} (${job.id})...`,
          );
          const extractDir = path.join(appRootDir, `temp-quality-${job.id}`);
          try {
            const response = await api.get(
              `/projects/${p.projectId}/jobs/${job.id}/artifacts`,
              { responseType: "arraybuffer" },
            );
            const zip = new AdmZip(Buffer.from(response.data as ArrayBuffer));
            if (!fs.existsSync(extractDir))
              fs.mkdirSync(extractDir, { recursive: true });
            zip.extractAllTo(extractDir, true);

            const timestamp = pipeline.created_at;
            const metrics = [
              {
                file: "eslint-results.json",
                fallback: "eslint.json",
                label: "ESLint",
                parser: parseEslint,
              },
              {
                file: "vuetsclint-results.json",
                fallback: "vuetsclint.json",
                label: "Vue TSC Lint",
                parser: parseEslint,
              },
              {
                file: "coverage-summary.json",
                fallback: "coverage.json",
                label: "Couverture",
                parser: parseCoverage,
              },
              {
                file: "audit-prod.json",
                fallback: "auditProd.json",
                label: "Audit Prod",
                parser: parseAudit,
              },
              {
                file: "audit-dev.json",
                fallback: "auditDev.json",
                label: "Audit Dev",
                parser: parseAudit,
              },
              {
                file: "typecheck.json",
                label: "Typage",
                parser: parseTypecheck,
              },
            ];

            for (const m of metrics) {
              let files = findFilesRecursive(extractDir, m.file);
              if (files.length === 0 && m.fallback)
                files = findFilesRecursive(extractDir, m.fallback);

              if (files.length > 0) {
                processQualityFile(
                  projectDataDir,
                  files[0],
                  m.file,
                  m.label,
                  m.parser,
                  timestamp,
                );
              }
            }
          } catch {
            console.warn(
              `       ⚠️ Failed to process artifacts for job ${job.id}`,
            );
          } finally {
            if (fs.existsSync(extractDir)) deleteFolderRecursive(extractDir);
          }
        }
      }
    } catch {
      console.error(`   ❌ Error syncing quality for project ${p.id}`);
    }
  }
  console.log("✅ Quality metrics synchronization complete.");
}

/**
 * Extrait et synchronise les données d'un run visuel vers data/visual-runs et public/visual-runs
 */
function extractAndSaveVisualRun(
  pipeline: GitLabPipeline,
  job: GitLabJob,
  jobDir: string,
  resultsFilePath?: string,
) {
  if (!resultsFilePath || !fs.existsSync(resultsFilePath)) return;

  try {
    const raw = fs.readFileSync(resultsFilePath, "utf8");
    const resultsData = JSON.parse(raw);
    const suites = resultsData.suites || [];

    const visualDataDir = path.resolve(process.cwd(), "data/visual-runs");
    const visualPublicDir = path.resolve(
      process.cwd(),
      `public/visual-runs/${pipeline.id}/images`,
    );
    fs.mkdirSync(visualDataDir, { recursive: true });
    fs.mkdirSync(visualPublicDir, { recursive: true });

    const diffItems: VisualDiffItem[] = [];
    const snapshotMap = new Map<string, VisualDiffItem>();
    let itemIndex = 1;

    const findImageInJobDir = (fileName: string) => {
      const clean = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = findFilesRecursive(jobDir, new RegExp(clean + "$"));
      return matches.length > 0 ? matches[0] : null;
    };

    const resolveAttachFile = (attach: { path?: string } | null | undefined) => {
      if (!attach || !attach.path) return null;
      const cand1 = path.resolve(jobDir, attach.path);
      if (fs.existsSync(cand1)) return cand1;
      if (fs.existsSync(attach.path)) return attach.path;
      const base = path.basename(attach.path);
      const found = findImageInJobDir(base);
      if (found && fs.existsSync(found)) return found;
      return null;
    };

    interface SuiteNode {
      title?: string;
      file?: string;
      suites?: SuiteNode[];
      specs?: Array<{
        title?: string;
        file?: string;
        tests?: Array<{
          projectName?: string;
          results?: Array<{
            status?: string;
            errors?: Array<{ message?: string }>;
            error?: { message?: string };
            attachments?: Array<{ name?: string; path?: string }>;
          }>;
        }>;
      }>;
    }

    const traverseSuites = (currentSuites: SuiteNode[]) => {
      for (const suite of currentSuites) {
        if (suite.suites && suite.suites.length) {
          traverseSuites(suite.suites);
        }
        if (suite.specs && suite.specs.length) {
          for (const spec of suite.specs) {
            const file = spec.file || suite.file || "";
            for (const test of spec.tests || []) {
              for (const res of test.results || []) {
                const isFail =
                  res.status === "failed" || res.status === "unexpected";
                const errors =
                  res.errors && res.errors.length > 0
                    ? res.errors
                    : res.error
                    ? [res.error]
                    : [];
                if (!isFail && errors.length === 0) continue;

                const attachments = res.attachments || [];

                for (const err of errors) {
                  const msg = err.message || "";
                  const isVisual =
                    msg.includes("Screenshot comparison failed") ||
                    msg.includes("toHaveScreenshot") ||
                    msg.includes("pixels");

                  if (isVisual) {
                    const snapshotMatch =
                      msg.match(/Snapshot:\s*([^\s\r\n]+)/) ||
                      msg.match(/([^\s\r\n'"]+\.png)/i);

                    const expDimMatch = msg.match(
                      /Expected an image (\d+px by \d+px)/i,
                    );
                    const recDimMatch = msg.match(/received (\d+px by \d+px)/i);
                    const pixelsMatch = msg.match(/(\d+)\s+pixels/i);
                    const ratioMatch = msg.match(/ratio\s+([0-9.]+)/i);

                    const snapshot = snapshotMatch ? snapshotMatch[1] : null;
                    const key = `${file}::${spec.title}::${snapshot}`;
                    if (snapshot && snapshotMap.has(key)) continue;

                    const expectedDim = expDimMatch ? expDimMatch[1] : null;
                    const receivedDim = recDimMatch ? recDimMatch[1] : null;
                    const diffPixels = pixelsMatch
                      ? parseInt(pixelsMatch[1], 10)
                      : null;
                    const diffRatio = ratioMatch
                      ? parseFloat(ratioMatch[1])
                      : null;

                    let deltaHeight = null;
                    if (expectedDim && receivedDim) {
                      const h1 = parseInt(expectedDim.split("by")[1], 10);
                      const h2 = parseInt(receivedDim.split("by")[1], 10);
                      deltaHeight = Math.abs(h1 - h2);
                    }

                    let category = "Ajustement Cosmétique Localisé";
                    let explanation = "Différence visuelle constatée.";
                    if (diffRatio && diffRatio > 0.4) {
                      category = "Refonte Modale / Drawer (Impact Majeur)";
                      explanation = `Composant d'overlay ou drawer complètement restructuré (différence de ${(diffRatio * 100).toFixed(0)}%).`;
                    } else if (
                      deltaHeight &&
                      deltaHeight > 8 &&
                      (diffRatio || 0) <= 0.15
                    ) {
                      category = "Décalage Vertical / Hauteur (Layout Shift)";
                      explanation = `Hauteur modifiée causant un décalage vertical.`;
                    } else if ((diffRatio || 0) <= 0.05) {
                      category = "Ajustement Cosmétique Localisé";
                      explanation = `Variations subtiles de design.`;
                    }

                    const baseName = snapshot
                      ? snapshot.replace(/\.png$/i, "")
                      : `diff-${itemIndex}`;
                    const leafName = baseName.split("/").pop() || baseName;
                    const cleanName = baseName.replace(/[\/\\]/g, "__");
                    const unaccentedBaseName = baseName
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");
                    const unaccentedLeafName = leafName
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "");

                    const destExpected = path.join(
                      visualPublicDir,
                      `${cleanName}-expected.png`,
                    );
                    const destActual = path.join(
                      visualPublicDir,
                      `${cleanName}-actual.png`,
                    );
                    const destDiff = path.join(
                      visualPublicDir,
                      `${cleanName}-diff.png`,
                    );

                    // 1. Chercher la baseline locale
                    const localBaselineCandidates = [
                      path.resolve(
                        process.cwd(),
                        `../../packages/playwright-tests/screenshots/tpbp/${baseName}-chrome.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `../../packages/playwright-tests/screenshots/tpbp/${unaccentedBaseName}-chrome.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `../../packages/playwright-tests/screenshots/tpbp/${baseName}.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `../../packages/playwright-tests/screenshots/tpbp/${unaccentedBaseName}.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `packages/playwright-tests/screenshots/tpbp/${baseName}-chrome.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `packages/playwright-tests/screenshots/tpbp/${unaccentedBaseName}-chrome.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `packages/playwright-tests/screenshots/tpbp/${baseName}.png`,
                      ),
                      path.resolve(
                        process.cwd(),
                        `packages/playwright-tests/screenshots/tpbp/${unaccentedBaseName}.png`,
                      ),
                    ];
                    for (const candidate of localBaselineCandidates) {
                      if (fs.existsSync(candidate)) {
                        fs.copyFileSync(candidate, destExpected);
                        break;
                      }
                    }

                    const matchesSnapshotAttach = (
                      a: { name?: string; path?: string } | null | undefined,
                      type: "actual" | "diff" | "expected",
                    ) => {
                      if (!a) return false;
                      const name = a.name || "";
                      const aPath = a.path || "";
                      return (
                        name === `${baseName}-${type}.png` ||
                        name === `${leafName}-${type}.png` ||
                        name === `${unaccentedLeafName}-${type}.png` ||
                        name.includes(`${baseName}-${type}`) ||
                        name.includes(`${leafName}-${type}`) ||
                        name.includes(`${unaccentedLeafName}-${type}`) ||
                        aPath.includes(`${baseName}-${type}`) ||
                        aPath.includes(`${leafName}-${type}`) ||
                        aPath.includes(`${unaccentedLeafName}-${type}`) ||
                        (type === "expected" &&
                          (name.includes(`${leafName}-chrome`) ||
                            name.includes(`${unaccentedLeafName}-chrome`) ||
                            aPath.includes(`${leafName}-chrome`) ||
                            aPath.includes(`${unaccentedLeafName}-chrome`)))
                      );
                    };

                    // 2. Chercher la capture actual
                    const actAttach = attachments.find(
                      (a: { name?: string; path?: string }) =>
                        matchesSnapshotAttach(a, "actual"),
                    );
                    if (actAttach) {
                      const found = resolveAttachFile(actAttach);
                      if (found) fs.copyFileSync(found, destActual);
                    }

                    // 3. Chercher la capture diff
                    const diffAttach = attachments.find(
                      (a: { name?: string; path?: string }) =>
                        matchesSnapshotAttach(a, "diff"),
                    );
                    if (diffAttach) {
                      const found = resolveAttachFile(diffAttach);
                      if (found) fs.copyFileSync(found, destDiff);
                    }

                    // 4. Si baseline locale introuvable, chercher dans les artefacts
                    if (!fs.existsSync(destExpected)) {
                      const expAttach = attachments.find(
                        (a: { name?: string; path?: string }) =>
                          matchesSnapshotAttach(a, "expected"),
                      );
                      if (expAttach) {
                        const found = resolveAttachFile(expAttach);
                        if (found) fs.copyFileSync(found, destExpected);
                      }
                    }

                    const item = {
                      id: `diff-${itemIndex++}`,
                      file,
                      specTitle: spec.title || "",
                      testStatus: res.status || "failed",
                      snapshot,
                      expectedDim,
                      receivedDim,
                      deltaHeight,
                      diffPixels,
                      diffRatio,
                      diffPercent:
                        diffRatio !== null
                          ? `${(diffRatio * 100).toFixed(1)}%`
                          : null,
                      category,
                      explanation,
                      expectedImageRelPath: fs.existsSync(destExpected)
                        ? `/visual-runs/${pipeline.id}/images/${cleanName}-expected.png`
                        : undefined,
                      actualImageRelPath: fs.existsSync(destActual)
                        ? `/visual-runs/${pipeline.id}/images/${cleanName}-actual.png`
                        : undefined,
                      diffImageRelPath: fs.existsSync(destDiff)
                        ? `/visual-runs/${pipeline.id}/images/${cleanName}-diff.png`
                        : undefined,
                    };

                    if (snapshot) snapshotMap.set(key, item);
                    diffItems.push(item);
                  } else {
                    const key = `${file}::${spec.title}::non-visual`;
                    if (snapshotMap.has(key)) continue;

                    const item = {
                      id: `diff-${itemIndex++}`,
                      file,
                      specTitle: spec.title || "",
                      testStatus: res.status || "failed",
                      snapshot: null,
                      expectedDim: null,
                      receivedDim: null,
                      deltaHeight: null,
                      diffPixels: null,
                      diffRatio: null,
                      diffPercent: null,
                      category: "Erreur Fonctionnelle / Timeout",
                      explanation: msg.split("\n").slice(0, 2).join(" "),
                      rawError: msg.split("\n")[0],
                    };
                    snapshotMap.set(key, item);
                    diffItems.push(item);
                  }
                }
              }
            }
          }
        }
      }
    };

    traverseSuites(suites);

    if (diffItems.length > 0) {
      const visualOnly = diffItems.filter((i) => i.snapshot);
      const avgDiffRatio = visualOnly.length
        ? visualOnly.reduce((acc, i) => acc + (i.diffRatio || 0), 0) /
          visualOnly.length
        : 0;
      const maxDiffRatio = visualOnly.length
        ? Math.max(...visualOnly.map((i) => i.diffRatio || 0))
        : 0;

      const categoriesCount: Record<string, number> = {};
      diffItems.forEach((item) => {
        categoriesCount[item.category] =
          (categoriesCount[item.category] || 0) + 1;
      });

      const visualRunData = {
        pipelineId: pipeline.id.toString(),
        jobId: job.id.toString(),
        branch: pipeline.ref,
        commitHash: pipeline.sha ? pipeline.sha.substring(0, 7) : "unknown",
        commitSubject: pipeline.name || "Visual regression run",
        runTimestamp: pipeline.created_at,
        environment: "tpbp-visual",
        project: "tpbp",
        stats: {
          total: diffItems.length,
          failed: diffItems.filter(
            (i) =>
              i.testStatus === "failed" || i.testStatus === "unexpected",
          ).length,
          avgDiffRatio,
          maxDiffRatio,
          categories: categoriesCount,
        },
        items: diffItems,
      };

      const targetJsonPath = path.join(visualDataDir, `${pipeline.id}.json`);
      fs.writeFileSync(
        targetJsonPath,
        JSON.stringify(visualRunData, null, 2),
      );
      console.log(
        `   📸 Synced Visual Testing Run in data/visual-runs/${pipeline.id}.json (${diffItems.length} diffs)`,
      );
    }
  } catch (err) {
    console.warn(
      `   ⚠️ Failed to extract visual run for pipeline ${pipeline.id}:`,
      err,
    );
  }
}

export const ALLOWED_BRANCHES = new Set([
  "main",
  "test/TD-1867-visual-tests-dev-isDesignSystemDisabled",
  "test/TD-1866-visual-tests-dev3-tailwind4",
  "test/TD-1867-visual-tests-dev-isDesignSystemEnabled",
]);

export async function syncGitlab() {
  await ingestLocalArtifacts();
  await ingestLocalQualityData();

  const GITLAB_URL = process.env.GITLAB_URL || "https://gitlab.com";
  const TOKEN = process.env.GITLAB_TOKEN;

  let PROJECT_ID = process.env.GITLAB_PROJECT_ID;
  if (!PROJECT_ID) {
    try {
      const projectsPath = path.resolve(__dirname, "projects.json");
      const projects: Project[] = JSON.parse(
        fs.readFileSync(projectsPath, "utf-8"),
      );
      const tmsProject = projects.find(
        (p: Project) => p.id === "wesave-test-qa",
      );
      if (tmsProject) PROJECT_ID = tmsProject.projectId;
    } catch {}
  } else {
    const match = PROJECT_ID.match(/\d+/);
    if (match) PROJECT_ID = match[0];
  }

  if (!PROJECT_ID || !TOKEN) {
    console.error(
      "❌ GITLAB_PROJECT_ID or GITLAB_TOKEN is missing. Skipping history sync.",
    );
    return;
  }

  const api = axios.create({
    baseURL: `${GITLAB_URL}/api/v4`,
    headers: { "PRIVATE-TOKEN": TOKEN },
  });

  try {
    const QUOTA_PER_CATEGORY = 20;
    const MAX_PIPELINES_TO_SCAN = 300;
    const quotas = new Map<string, number>();

    // Projets et environnements attendus
    const TARGET_PROJECTS = [
      "wse",
      "tpbp",
      "b4b",
      "tms",
      "advisory",
    ];
    const TARGET_ENVS = ["staging", "dev"];

    console.log(
      `🔍 Syncing History with Quotas: ${QUOTA_PER_CATEGORY} runs per project/env...`,
    );

    let page = 1;
    let totalScanned = 0;
    let allQuotasFull = false;

    while (totalScanned < MAX_PIPELINES_TO_SCAN && !allQuotasFull) {
      const { data: pipelines } = await api.get<GitLabPipeline[]>(
        `/projects/${PROJECT_ID}/pipelines`,
        {
          params: {
            per_page: 100,
            page: page,
            scope: "finished",
            // Retirons status: "success" pour avoir tout l'historique (y compris les échecs)
          },
        },
      );

      if (!pipelines || pipelines.length === 0) break;

      for (const pipeline of pipelines) {
        totalScanned++;

        const branch = pipeline.ref || "main";
        if (!ALLOWED_BRANCHES.has(branch)) {
          continue;
        }

        // Identification du projet et de l'environnement
        let project = "unknown";
        let environment = "staging";

        if (pipeline.name) {
          const nameParts = pipeline.name.split("|").map((s) => s.trim());
          if (nameParts.length >= 2) project = nameParts[1].toLowerCase();

          const envPart =
            nameParts.length >= 3 ? nameParts[2].toLowerCase() : "";
          if (envPart.includes("dev")) environment = "dev";
          else if (envPart.includes("staging")) environment = "staging";

          if (
            pipeline.name.toLowerCase().includes("tpbp-visual") ||
            (nameParts.length >= 3 &&
              nameParts[2].toLowerCase().includes("tpbp-visual"))
          ) {
            project = "tpbp";
            environment = "staging";
          }
        }

        // Si le nom du pipeline n'est pas explicite (vieux pipelines), on tente d'inférer via les jobs plus tard
        // Mais pour les quotas, on a besoin d'une clé
        const quotaKey = `${project}:${environment}`;
        const currentCount = quotas.get(quotaKey) || 0;

        if (currentCount >= QUOTA_PER_CATEGORY && project !== "unknown") {
          continue; // Quota atteint pour cette catégorie
        }

        const runDir = path.resolve(
          process.cwd(),
          `public/runs/${pipeline.id}`,
        );
        const resultsJsonPath = path.join(runDir, "results.json");

        // Si le fichier existe déjà, on compte juste le quota
        if (fs.existsSync(resultsJsonPath)) {
          try {
            const existingData = JSON.parse(
              fs.readFileSync(resultsJsonPath, "utf-8"),
            );
            const actualProject = existingData.project || project;
            const actualEnv = existingData.environment || environment;
            quotas.set(
              `${actualProject}:${actualEnv}`,
              (quotas.get(`${actualProject}:${actualEnv}`) || 0) + 1,
            );
            continue;
          } catch {}
        }

        console.log(
          `📦 Syncing Pipeline ${pipeline.id} (${project} | ${environment})...`,
        );

        const { data: jobs } = await api.get<GitLabJob[]>(
          `/projects/${PROJECT_ID}/pipelines/${pipeline.id}/jobs`,
        );

        const testsMap = new Map<string, IngestedTest>();
        const mergedStats: Record<string, number> = {
          expected: 0,
          unexpected: 0,
          skipped: 0,
          flaky: 0,
          duration: 0,
        };
        let hasData = false;
        let inferredProject = project;

        for (const job of jobs) {
          if (!job.artifacts_file) continue;
          if (job.status !== "success" && job.status !== "failed") continue;
          if (job.name === "pages" || !job.name.startsWith("test-")) continue;

          const jobProjectMatch = job.name.match(/test-([^-]+)-.*/);
          let businessProjectFromJob = jobProjectMatch
            ? jobProjectMatch[1]
            : "";
          if (job.name.includes("tpbp-visual")) {
            businessProjectFromJob = "tpbp";
          }
          if (
            (inferredProject === "unknown" || inferredProject === "tpbp") &&
            businessProjectFromJob === "tpbp"
          ) {
            inferredProject = "tpbp";
          }

          const jobDir = path.join(runDir, job.id.toString());
          if (!fs.existsSync(jobDir)) {
            try {
              const response = await api.get(
                `/projects/${PROJECT_ID}/jobs/${job.id}/artifacts`,
                { responseType: "arraybuffer" },
              );
              const zip = new AdmZip(Buffer.from(response.data as ArrayBuffer));
              fs.mkdirSync(jobDir, { recursive: true });
              zip.extractAllTo(jobDir, true);
              cleanupJobArtifacts(jobDir, true);
            } catch {
              console.warn(
                `   ⚠️ Failed to download artifacts for job ${job.id}`,
              );
              continue;
            }
          }

          const jobResultsFiles = findFilesRecursive(
            jobDir,
            /^results.*\.json$/,
          );

          if (
            (businessProjectFromJob === "tpbp" ||
              job.name.includes("tpbp-visual") ||
              job.name.includes("test-tpbp-visual")) &&
            job.name.includes("visual") &&
            jobResultsFiles.length > 0
          ) {
            extractAndSaveVisualRun(
              pipeline,
              job,
              jobDir,
              jobResultsFiles[0],
            );
          }

          for (const jobResultsPath of jobResultsFiles) {
            try {
              hasData = true;
              const jobResultsDir = path.dirname(jobResultsPath);
              const relativeToJobDir = path.relative(jobDir, jobResultsDir);
              const rawContent = fs.readFileSync(jobResultsPath, "utf8");
              const content = JSON.parse(rawContent) as PlaywrightResults;
              const finalBusinessProject =
                content.metadata?.testProject || businessProjectFromJob;

              const relativeParts = relativeToJobDir.split(/[\\/]/);
              const timestampFolder =
                content.metadata?.runTimestamp ||
                (relativeParts[0] === "artifact"
                  ? relativeParts[1]
                  : relativeParts[0] || "");
              const historyReportUrl = `https://anatec.gitlab.io/-/frontend/qa/wesave-test-qa/-/jobs/${job.id}/artifacts/artifact/${timestampFolder}/playwright-report/index.html`;

              const extractTests = (
                suites: PlaywrightSuite[],
                parentTitle = "",
              ) => {
                suites?.forEach((suite: PlaywrightSuite) => {
                  const currentSuiteTitle = suite.title || parentTitle;
                  suite.specs?.forEach((spec: PlaywrightSpec) => {
                    spec.tests?.forEach((test: PlaywrightTest) => {
                      const results = test.results || [];
                      const formattedResults: IngestedResult[] = results.map(
                        (res: PlaywrightTestResult) => {
                          const retryAttachments =
                            res.attachments
                              ?.map((att: PlaywrightAttachment) => {
                                let attPath = att.path;
                                if (attPath) {
                                  const parts = attPath.split(/[\\/]/);
                                  const testResultsIdx =
                                    parts.indexOf("test-results");
                                  if (testResultsIdx !== -1) {
                                    attPath = path.join(
                                      job.id.toString(),
                                      relativeToJobDir,
                                      ...parts.slice(testResultsIdx + 1),
                                    );
                                  } else {
                                    attPath = path.join(
                                      job.id.toString(),
                                      relativeToJobDir,
                                      parts[parts.length - 1],
                                    );
                                  }
                                }
                                return { ...att, path: attPath };
                              })
                              .filter(
                                (att) =>
                                  att.path &&
                                  isValidAttachment(
                                    path.join(runDir, att.path),
                                  ),
                              ) || [];
                          return {
                            status: res.status,
                            duration: res.duration || 0,
                            error: res.error
                              ? {
                                  message: res.error.message,
                                  stack: res.error.stack,
                                }
                              : null,
                            attachments: retryAttachments,
                            steps: res.steps,
                          };
                        },
                      );
                      let status =
                        test.status ||
                        (results.length > 0
                          ? results[results.length - 1].status
                          : "unknown");
                      if (status === "expected") status = "passed";
                      if (status === "unexpected") status = "failed";
                      const finalFile =
                        finalBusinessProject &&
                        !spec.file.includes(finalBusinessProject)
                          ? `${finalBusinessProject}/${spec.file}`
                          : spec.file;
                      const testKey = `${currentSuiteTitle} > ${spec.title} [${test.projectName}] [${finalBusinessProject}]`;
                      if (testsMap.has(testKey)) {
                        const existing = testsMap.get(testKey)!;
                        existing.results = [
                          ...existing.results,
                          ...formattedResults,
                        ];
                        if (historyReportUrl) {
                          existing.reportUrl = historyReportUrl;
                        }
                        if (
                          (status === "passed" &&
                            (existing.status === "failed" ||
                              existing.status === "unexpected")) ||
                          ((status === "failed" || status === "unexpected") &&
                            existing.status === "passed")
                        )
                          existing.status = "flaky";
                      } else {
                        testsMap.set(testKey, {
                          title: spec.title,
                          suite: currentSuiteTitle,
                          status: status,
                          duration: results.reduce(
                            (acc: number, r: PlaywrightTestResult) =>
                              acc + (r.duration || 0),
                            0,
                          ),
                          file: finalFile,
                          project: test.projectName,
                          category: inferTestCategory(finalFile, spec.title),
                          results: formattedResults,
                          reportUrl: historyReportUrl,
                        });
                      }
                    });
                  });
                  if (suite.suites)
                    extractTests(suite.suites, currentSuiteTitle);
                });
              };
              extractTests(content.suites);
              if (content.stats) {
                mergedStats.expected += content.stats.expected || 0;
                mergedStats.unexpected += content.stats.unexpected || 0;
                mergedStats.skipped += content.stats.skipped || 0;
                mergedStats.flaky += content.stats.flaky || 0;
                mergedStats.duration += content.stats.duration || 0;
              }
            } catch {
              // ignore
            }
          }
        }

        if (hasData) {
          const allTests = Array.from(testsMap.values());
          const finalData = {
            id: `CI-${pipeline.id}`,
            date: pipeline.created_at,
            project: inferredProject,
            branch: pipeline.ref,
            environment: environment,
            stats: { ...mergedStats, total: allTests.length },
            tests: allTests,
          };
          if (!fs.existsSync(runDir)) fs.mkdirSync(runDir, { recursive: true });
          fs.writeFileSync(resultsJsonPath, JSON.stringify(finalData, null, 2));

          // Mise à jour du quota
          quotas.set(
            `${inferredProject}:${environment}`,
            (quotas.get(`${inferredProject}:${environment}`) || 0) + 1,
          );
        }
      }

      // Vérification si tous les quotas sont pleins
      let complete = true;
      for (const p of TARGET_PROJECTS) {
        for (const e of TARGET_ENVS) {
          if ((quotas.get(`${p}:${e}`) || 0) < QUOTA_PER_CATEGORY) {
            complete = false;
            break;
          }
        }
        if (!complete) break;
      }
      allQuotasFull = complete;

      page++;
      if (pipelines.length < 100) break;
    }

    console.log("📊 Sync summary by category:");
    quotas.forEach((count, key) => console.log(`   - ${key}: ${count} runs`));
  } catch (err) {
    console.error("❌ Global history sync error:", err);
  }

  if (process.argv.includes("--no-quality")) {
    console.log("⏭️ Skipping Quality Metrics synchronization.");
  } else {
    await syncQualityData(api);
    await syncSonar();
  }
}

export {
  findFilesRecursive,
  cleanupJobArtifacts,
  ingestLocalArtifacts,
  extractAndSaveVisualRun,
};

if (process.env.NODE_ENV !== "test") {
  syncGitlab();
}
