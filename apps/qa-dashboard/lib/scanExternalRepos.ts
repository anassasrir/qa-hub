import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import axios from "axios";
import { syncSonar } from "./syncSonar";

const GITLAB_URL = process.env.GITLAB_URL || "https://gitlab.com";
const ROOT_DIR = path.resolve(__dirname, "../../..");
const DATA_DIR = path.resolve(ROOT_DIR, "apps/tms/data");
const TEMP_DIR = path.join(os.tmpdir(), "wesave-scans-" + Date.now());

export interface Project {
  id: string;
  projectId: string;
  url: string;
  branch: string;
  coverageJob: string;
}

export interface GitLabJob {
  id: number;
  name: string;
  ref: string;
  status: string;
  created_at: string;
  coverage?: number;
}

// Configuration chargée dynamiquement
const projectsPath = path.resolve(__dirname, "projects.json");
export const projects: Project[] = JSON.parse(
  fs.readFileSync(projectsPath, "utf-8"),
);

/**
 * Calcule la tendance entre une ancienne et une nouvelle valeur
 */
function calculateTrend(
  oldVal: number | undefined,
  newVal: number,
  lowerIsBetter: boolean = false,
) {
  if (oldVal === undefined || oldVal === newVal) return null;

  const diff = newVal - oldVal;
  const direction = diff > 0 ? "up" : "down";

  // Si lowerIsBetter est vrai (ex: ESLint), alors direction "down" est "good"
  const isGood = lowerIsBetter ? diff < 0 : diff > 0;

  return {
    difference: Number(diff.toFixed(2)),
    direction,
    isGood,
  };
}

/**
 * Lit un fichier JSON de data existant s'il existe
 */
function getExistingData(project: string, fileName: string) {
  const filePath = path.join(DATA_DIR, project, fileName);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

interface HistoryItem {
  timestamp: string;
  errors?: number;
  warnings?: number;
  vulnerabilities?: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  percentage?: number;
}

export function formatLint(
  rawText: string | null,
  label: string,
  projectId: string,
) {
  const existing = getExistingData(projectId, "eslint.json");
  const history: HistoryItem[] = existing?.history || [];

  if (rawText === null) {
    return JSON.stringify({ label, history, error: "Scan failed" }, null, 2);
  }

  let errors = 0;
  let warnings = 0;
  const messagesList: {
    file: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    severity: "error" | "warning";
  }[] = [];

  try {
    const results = JSON.parse(rawText);
    if (Array.isArray(results)) {
      results.forEach((file: { 
        errorCount?: number; 
        warningCount?: number; 
        messages?: { 
          line: number; 
          column: number; 
          message: string; 
          ruleId: string; 
          severity: number 
        }[]; 
        filePath: string 
      }) => {
        errors += file.errorCount || 0;
        warnings += file.warningCount || 0;

        if (file.messages && Array.isArray(file.messages)) {
          file.messages.forEach((msg) => {
            messagesList.push({
              file: file.filePath.split("/").slice(-3).join("/"), // Short path
              line: msg.line,
              column: msg.column,
              message: msg.message,
              ruleId: msg.ruleId,
              severity: msg.severity === 2 ? "error" : "warning",
            });
          });
        }
      });
    } else if (results && typeof results === "object") {
      errors = results.errors || results.errorCount || 0;
      warnings = results.warnings || results.warningCount || 0;
    }
  } catch {
    const lines = rawText.split("\n");
    for (const line of lines) {
      if (line.toLowerCase().includes("error")) errors++;
      if (line.toLowerCase().includes("warning")) warnings++;
    }
  }

  const trend = calculateTrend(existing?.errors, errors, true);
  const timestamp = new Date().toISOString();

  if (
    !history.find(
      (h: HistoryItem) =>
        h.timestamp?.split("T")[0] === timestamp.split("T")[0],
    )
  ) {
    history.push({ timestamp, errors, warnings });
  }

  return JSON.stringify(
    {
      label,
      timestamp,
      errors,
      warnings,
      messagesList: messagesList.slice(0, 100), // Limit to top 100 to keep JSON small
      trend,
      history,
    },
    null,
    2,
  );
}

export function formatTypecheck(
  rawText: string | null,
  label: string,
  projectId: string,
) {
  const existing = getExistingData(projectId, "typecheck.json");
  const history: HistoryItem[] = existing?.history || [];

  if (rawText === null) {
    return JSON.stringify({ label, history, error: "Scan failed" }, null, 2);
  }

  let errors = 0;
  // Basic text parsing for tsc output
  const errorMatch = rawText.match(/Found (\d+) error/);
  if (errorMatch) {
    errors = parseInt(errorMatch[1], 10);
  } else if (rawText.includes("error TS")) {
    errors = rawText.split("\n").filter((l) => l.includes("error TS")).length;
  }

  const trend = calculateTrend(existing?.errors, errors, true);
  const timestamp = new Date().toISOString();

  if (
    !history.find(
      (h: HistoryItem) =>
        h.timestamp?.split("T")[0] === timestamp.split("T")[0],
    )
  ) {
    history.push({ timestamp, errors });
  }

  return JSON.stringify(
    {
      label,
      timestamp,
      errors,
      trend,
      history,
    },
    null,
    2,
  );
}

export function formatAudit(
  rawJson: string | null,
  label: string,
  projectId: string,
  fileName: string,
) {
  if (rawJson === null) {
    return JSON.stringify({ label, error: "Scan failed" }, null, 2);
  }
  try {
    const content = JSON.parse(rawJson);

    // Si le JSON contient une erreur explicite (format pnpm)
    if (content.error) {
      const errorMsg =
        content.error.message || content.error.summary || "Audit error";
      const errorCode = content.error.code ? ` (${content.error.code})` : "";
      return JSON.stringify(
        { label, error: `${errorMsg}${errorCode}` },
        null,
        2,
      );
    }

    const vulnerabilities =
      content.metadata?.vulnerabilities || content.vulnerabilities;

    // Si pas de vulnérabilités trouvées dans un contexte d'erreur potentielle
    if (
      !vulnerabilities ||
      (Object.keys(vulnerabilities).length === 0 &&
        content.metadata?.totalDependencies === 0)
    ) {
      return JSON.stringify({ label, error: "Incomplete report" }, null, 2);
    }

    const critical = vulnerabilities.critical || 0;
    const high = vulnerabilities.high || 0;

    const existing = getExistingData(projectId, fileName);
    const totalRisk = critical + high;
    const oldRisk =
      (existing?.vulnerabilities?.critical || 0) +
      (existing?.vulnerabilities?.high || 0);
    const trend = calculateTrend(oldRisk, totalRisk, true);

    const vulnerabilitiesList: {
      severity: string;
      title: string;
      package: string;
      vulnerableVersion: string;
      patchedVersion: string;
      link: string;
    }[] = [];

    interface PnpmAdvisory {
      severity: string;
      title: string;
      module_name: string;
      vulnerable_versions: string;
      patched_versions: string;
      url: string;
    }

    const advisories = content.advisories as
      | Record<string, PnpmAdvisory>
      | undefined;
    if (advisories) {
      Object.values(advisories).forEach((advisory) => {
        vulnerabilitiesList.push({
          severity: advisory.severity,
          title: advisory.title,
          package: advisory.module_name,
          vulnerableVersion: advisory.vulnerable_versions,
          patchedVersion: advisory.patched_versions,
          link: advisory.url,
        });
      });
    }

    const timestamp = new Date().toISOString();
    const history: HistoryItem[] = existing?.history || [];
    if (
      !history.find(
        (h: HistoryItem) =>
          h.timestamp?.split("T")[0] === timestamp.split("T")[0],
      )
    ) {
      history.push({
        timestamp,
        vulnerabilities: {
          low: vulnerabilities.low || 0,
          moderate: vulnerabilities.moderate || 0,
          high,
          critical,
        },
      });
    }

    const result = {
      label: label,
      timestamp,
      vulnerabilities: {
        low: vulnerabilities.low || 0,
        moderate: vulnerabilities.moderate || 0,
        high: high,
        critical: critical,
      },
      vulnerabilitiesList,
      totalDependencies: content.metadata?.totalDependencies || 0,
      trend,
      history,
    };
    return JSON.stringify(result, null, 2);
  } catch {
    return JSON.stringify({ label: label, error: "Format error" }, null, 2);
  }
}

/**
 * Parse le tableau de couverture depuis le texte brut du log GitLab
 */
export function parseCoverageFromLog(logText: string) {
  // 1. Formats standard (Istanbul/Vitest summary) : "Lines : 73.69%" ou "Lines | 73.69%"
  const linesRegex = /Lines\s+[:|]\s+([\d.]+)%/i;
  const statementsRegex = /Statements\s+[:|]\s+([\d.]+)%/i;
  const branchesRegex = /Branches\s+[:|]\s+([\d.]+)%/i;
  const functionsRegex = /Functions\s+[:|]\s+([\d.]+)%/i;

  // 2. Formats alternatifs (SimpleCov/Ruby, etc.) : "Line Coverage: 79.53%" ou "LOC (79.53%) covered"
  const altLinesRegex = /(?:Line\s+Coverage|LOC)\s*(?::|\()?\s*([\d.]+)%/i;

  // 3. Format Tableau Istanbul (All files | % Stmts | % Branch | % Funcs | % Lines)
  const istanbulTableRegex =
    /All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/i;

  // 4. Format Python Coverage (TOTAL 3970 680 83%)
  const pythonCoverageRegex = /TOTAL\s+\d+\s+\d+\s+([\d.]+)%/i;

  const statementsMatch = logText.match(statementsRegex);
  const linesMatch = logText.match(linesRegex);
  const branchesMatch = logText.match(branchesRegex);
  const functionsMatch = logText.match(functionsRegex);
  const pythonMatch = logText.match(pythonCoverageRegex);

  let percentage = 0;
  let details = { Statements: 0, Branches: 0, Functions: 0, Lines: 0 };

  // Si le format summary échoue, on tente les autres formats
  if (!linesMatch && !statementsMatch) {
    if (pythonMatch) {
      percentage = parseFloat(pythonMatch[1]);
      details = {
        Statements: percentage,
        Branches: 0,
        Functions: 0,
        Lines: percentage,
      };
    } else {
      const tableMatch = logText.match(istanbulTableRegex);
      if (tableMatch) {
        // Priorité aux Statements (index 1) au lieu des Lines (index 4)
        percentage = parseFloat(tableMatch[1]);
        details = {
          Statements: percentage,
          Branches: parseFloat(tableMatch[2]),
          Functions: parseFloat(tableMatch[3]),
          Lines: parseFloat(tableMatch[4]),
        };
      } else {
        // Sinon on tente le format alternatif (Ruby/SimpleCov)
        const altMatch = logText.match(altLinesRegex);
        if (altMatch) {
          percentage = parseFloat(altMatch[1]);
          details = {
            Statements: percentage,
            Branches: 0,
            Functions: 0,
            Lines: percentage,
          };
        }
      }
    }
  } else {
    // On privilégie Statements si disponible, sinon Lines
    percentage = parseFloat(statementsMatch?.[1] || linesMatch?.[1] || "0");
    details = {
      Statements: percentage,
      Branches: parseFloat(branchesMatch?.[1] || "0"),
      Functions: parseFloat(functionsMatch?.[1] || "0"),
      Lines: parseFloat(linesMatch?.[1] || "0"),
    };
  }

  if (percentage === 0 && !linesMatch && !statementsMatch && !pythonMatch)
    return null;

  return {
    label: "Couverture",
    percentage,
    details,
  };
}

export async function fetchCoverage(project: Project) {
  if (!project.projectId || !project.coverageJob) return;

  const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
  const scanDays = parseInt(process.env.SCAN_DAYS || "2", 10);
  console.log(
    `   - Fetching coverage history (${scanDays} days) for: ${project.coverageJob}...`,
  );

  const api = axios.create({
    baseURL: GITLAB_URL + "/api/v4",
    headers: { "PRIVATE-TOKEN": GITLAB_TOKEN },
  });

  try {
    let allJobs: GitLabJob[] = [];
    let page = 1;
    let hasMore = true;
    const agoDate = new Date();
    agoDate.setDate(agoDate.getDate() - scanDays);

    // Pagination logic
    while (hasMore) {
      const { data: jobs } = await api.get<GitLabJob[]>(
        "/projects/" + project.projectId + "/jobs",
        {
          params: { scope: "success", per_page: 100, page },
        },
      );

      if (jobs.length === 0) {
        hasMore = false;
        break;
      }

      let relevantInPage = jobs.filter(
        (j) =>
          j.name === project.coverageJob &&
          (j.ref === project.branch || j.ref === "main"),
      );

      // Si on ne trouve rien sur la branche configurée, on regarde partout
      if (relevantInPage.length === 0) {
        relevantInPage = jobs.filter((j) => j.name === project.coverageJob);
        if (relevantInPage.length > 0) {
          console.log(
            `     ℹ️ Found ${relevantInPage.length} jobs on other branches (e.g., ${relevantInPage[0].ref})...`,
          );
        }
      }

      allJobs = [...allJobs, ...relevantInPage];

      // Check if we reached the date limit in the current page
      const oldestJobInPage = new Date(jobs[jobs.length - 1].created_at);
      if (oldestJobInPage < agoDate) {
        hasMore = false;
      } else {
        page++;
      }

      // Safety limit for initial scan to avoid too many API calls
      if (page > 15) hasMore = false;
    }

    const filteredJobs = allJobs
      .filter((j) => new Date(j.created_at) > agoDate)
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    if (filteredJobs.length === 0) {
      console.log("     ⚠️  No successful job found in the requested period.");
      return;
    }

    const existingData = getExistingData(project.id, "coverage.json");
    const history: HistoryItem[] = existingData?.history || [];
    const existingTimestamps = new Set(history.map((h) => h.timestamp));

    console.log(
      `     📊 Normalizing history (found ${filteredJobs.length} potential jobs)...`,
    );

    let latestParsedCoverage: { percentage: number; details: unknown } | null =
      null;

    // On limite le parsing de logs à 20 pour ne pas saturer l'API
    const jobsToParse = filteredJobs.slice(-20);

    for (const job of filteredJobs) {
      if (existingTimestamps.has(job.created_at)) continue;

      // On ne parse les logs que pour les plus récents, sinon on prend la valeur GitLab
      const shouldParseLog = jobsToParse.some((j) => j.id === job.id);

      if (shouldParseLog) {
        try {
          const { data: logText } = await api.get<string>(
            "/projects/" + project.projectId + "/jobs/" + job.id + "/trace",
          );
          const parsed = parseCoverageFromLog(logText);
          if (parsed) {
            latestParsedCoverage = parsed;
            history.push({
              timestamp: job.created_at,
              percentage: parsed.percentage,
            });
            continue;
          }
        } catch {
          // ignore log error
        }
      }

      // Fallback GitLab coverage
      if (job.coverage !== undefined && job.coverage !== null) {
        history.push({
          timestamp: job.created_at,
          percentage: job.coverage,
        });
      }
    }

    // On s'assure que c'est trié et limité
    history.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const latestJob = filteredJobs[filteredJobs.length - 1];
    const finalLatest = latestParsedCoverage || {
      percentage: history[history.length - 1]?.percentage || 0,
      details: existingData?.details || {},
    };

    const trend = calculateTrend(
      existingData?.percentage,
      finalLatest.percentage,
      false,
    );

    const result = {
      label: "Couverture",
      percentage: finalLatest.percentage,
      details: finalLatest.details,
      trend,
      timestamp: latestJob.created_at,
      history,
    };

    const projectDataDir = path.join(DATA_DIR, project.id);
    fs.writeFileSync(
      path.join(projectDataDir, "coverage.json"),
      JSON.stringify(result, null, 2),
    );
    console.log(
      `     ✅ Coverage updated: ${result.percentage}% (History points: ${history.length})`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("     ❌ API Error: " + message);
  }
}

export async function scanProject(project: Project) {
  const projectTempDir = path.join(TEMP_DIR, project.id);
  const projectDataDir = path.join(DATA_DIR, project.id);
  const branch = project.branch || "main";
  const GITLAB_TOKEN = process.env.GITLAB_TOKEN;

  if (!fs.existsSync(projectDataDir))
    fs.mkdirSync(projectDataDir, { recursive: true });

  console.log("\n🔍 Project: " + project.id);

  // Skip clone/audit/lint for current repo (handled by CI and syncGitlab)
  if (project.id === "wesave-test-qa") {
    console.log("   - Skipping local scan (Current repo, handled by syncGitlab).");
    await fetchCoverage(project);
    return;
  }

  try {
    // Audit & Lint (Skipped if SCAN_DAYS > 7 to speed up deep history scan)
    const scanDays = parseInt(process.env.SCAN_DAYS || "2", 10);
    if (scanDays <= 7) {
      if (fs.existsSync(projectTempDir))
        fs.rmSync(projectTempDir, { recursive: true, force: true });
      fs.mkdirSync(projectTempDir, { recursive: true });
      const authUrl = project.url.replace(
        "https://",
        "https://oauth2:" + GITLAB_TOKEN + "@",
      );
      console.log("   - Cloning branch " + branch + "...");
      execSync(
        "git clone --depth 1 -b " +
          branch +
          " " +
          authUrl +
          " " +
          projectTempDir,
        { stdio: "ignore" },
      );

      const runAudit = (args: string) => {
        try {
          const output = execSync("pnpm audit --json " + args, {
            cwd: projectTempDir,
            env: { ...process.env, PNPM_HOME: os.tmpdir() },
            stdio: "pipe",
            maxBuffer: 100 * 1024 * 1024,
          }).toString();
          return output;
        } catch (e: unknown) {
          const error = e as { stdout?: Buffer; status?: number };
          const output = error.stdout ? error.stdout.toString() : "";
          if (output.trim().startsWith("{") || output.trim().startsWith("["))
            return output;
          return null;
        }
      };

      console.log("   - Auditing...");
      fs.writeFileSync(
        path.join(projectDataDir, "auditProd.json"),
        formatAudit(
          runAudit("--prod"),
          "Audit Prod",
          project.id,
          "auditProd.json",
        ),
      );
      fs.writeFileSync(
        path.join(projectDataDir, "auditDev.json"),
        formatAudit(
          runAudit("--dev"),
          "Audit Dev",
          project.id,
          "auditDev.json",
        ),
      );

      const runLint = () => {
        try {
          console.log("   - Installing dependencies for linting...");
          execSync("pnpm install --ignore-scripts --no-frozen-lockfile", {
            cwd: projectTempDir,
            env: { ...process.env, PNPM_HOME: os.tmpdir() },
            stdio: "ignore",
          });
          console.log("   - Running ESLint...");
          return execSync("npx eslint . --format json", {
            cwd: projectTempDir,
            env: {
              ...process.env,
              PNPM_HOME: os.tmpdir(),
              NODE_OPTIONS: "--max-old-space-size=4096",
            },
            stdio: "pipe",
            maxBuffer: 100 * 1024 * 1024,
          }).toString();
        } catch (e: unknown) {
          const error = e as { stdout?: Buffer; status?: number };
          const output = error.stdout ? error.stdout.toString() : "";
          if (output.trim().startsWith("[") || output.trim().startsWith("{"))
            return output;
          return null;
        }
      };

      console.log("   - Linting...");
      fs.writeFileSync(
        path.join(projectDataDir, "eslint.json"),
        formatLint(runLint(), "ESLint", project.id),
      );

      const runTypecheck = () => {
        try {
          console.log("   - Running Typecheck...");
          return execSync("npx tsc --noEmit --pretty false", {
            cwd: projectTempDir,
            env: { ...process.env, PNPM_HOME: os.tmpdir() },
            stdio: "pipe",
          }).toString();
        } catch (e: unknown) {
          const error = e as { stdout?: Buffer; status?: number };
          return error.stdout ? error.stdout.toString() : "";
        }
      };

      console.log("   - Typechecking...");
      fs.writeFileSync(
        path.join(projectDataDir, "typecheck.json"),
        formatTypecheck(runTypecheck(), "Typage", project.id),
      );
    } else {
      console.log("   - Skipping Clone/Audit/Lint for deep history scan...");
    }

    await fetchCoverage(project);

    console.log("   ✨ Project completed.");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("   ❌ Failed: " + message);
  } finally {
    if (fs.existsSync(projectTempDir))
      fs.rmSync(projectTempDir, { recursive: true, force: true });
  }
}

export async function main() {
  const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
  if (!GITLAB_TOKEN) {
    console.error("❌ GITLAB_TOKEN missing");
    process.exit(1);
  }

  const targetProjectId = process.env.PROJECT_ID;
  const filteredProjects = targetProjectId
    ? projects.filter((p) => p.id === targetProjectId)
    : projects;

  if (targetProjectId && filteredProjects.length === 0) {
    console.error(
      `❌ Project '${targetProjectId}' not found in configuration.`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
  try {
    for (const project of filteredProjects) await scanProject(project);

    console.log("\n📡 Synchronizing SonarCloud data...");
    await syncSonar();
  } finally {
    if (fs.existsSync(TEMP_DIR))
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

if (process.env.NODE_ENV !== "test") {
  main();
}
