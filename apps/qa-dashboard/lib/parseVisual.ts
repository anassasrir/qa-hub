import fs from "fs";
import path from "path";

export interface VisualDiffItem {
  id: string;
  file: string;
  specTitle: string;
  testStatus: string;
  snapshot: string | null;
  expectedDim: string | null;
  receivedDim: string | null;
  deltaHeight: number | null;
  diffPixels: number | null;
  diffRatio: number | null;
  diffPercent: string | null;
  category: string;
  explanation: string;
  expectedImageRelPath?: string;
  actualImageRelPath?: string;
  diffImageRelPath?: string;
  rawError?: string;
}

export interface VisualRunData {
  pipelineId: string;
  jobId: string;
  branch: string;
  commitHash: string;
  commitSubject: string;
  runTimestamp: string;
  environment: string;
  project: string;
  testCount?: number;
  totalTests?: number;
  passedCount?: number;
  failedCount?: number;
  stats: {
    total: number;
    failed: number;
    avgDiffRatio: number;
    maxDiffRatio: number;
    categories: Record<string, number>;
  };
  items: VisualDiffItem[];
}

function resolveRunResults(
  pipelineId: string,
): { totalTests: number; passedCount: number; failedCount: number } | null {
  const candidates = [
    path.resolve(process.cwd(), "public/runs", pipelineId, "results.json"),
    path.resolve(process.cwd(), "apps/tms/public/runs", pipelineId, "results.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const raw = fs.readFileSync(c, "utf-8");
        const json = JSON.parse(raw);
        if (json && Array.isArray(json.tests)) {
          const visualTests = json.tests.filter(
            (t: { file?: string; suite?: string }) =>
              (t.file &&
                (t.file.includes("visual") ||
                  t.file.includes("specs/tpbp/visual"))) ||
              (t.suite && t.suite.toLowerCase().includes("visuel")),
          );
          if (visualTests.length > 0) {
            const failed = visualTests.filter(
              (t: { status?: string }) =>
                t.status === "failed" || t.status === "unexpected",
            ).length;
            const passed = visualTests.filter(
              (t: { status?: string }) =>
                t.status === "passed" || t.status === "expected",
            ).length;
            return {
              totalTests: visualTests.length,
              passedCount: passed,
              failedCount: failed,
            };
          }
        }
      } catch {
        // ignore
      }
    }
  }
  return null;
}

export function getAllVisualRuns(): VisualRunData[] {
  let visualRunsDir = path.resolve(process.cwd(), "data/visual-runs");
  if (!fs.existsSync(visualRunsDir)) {
    const fallback = path.resolve(process.cwd(), "apps/tms/data/visual-runs");
    if (fs.existsSync(fallback)) {
      visualRunsDir = fallback;
    } else {
      return [];
    }
  }

  const files = fs
    .readdirSync(visualRunsDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => b.localeCompare(a)); // Descending

  const runs: VisualRunData[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(visualRunsDir, file);
      const raw = fs.readFileSync(fullPath, "utf-8");
      const data = JSON.parse(raw) as VisualRunData;
      if (data && data.pipelineId && Array.isArray(data.items)) {
        const resultStats = resolveRunResults(data.pipelineId);
        if (resultStats) {
          data.totalTests = resultStats.totalTests;
          data.passedCount = resultStats.passedCount;
          data.failedCount = resultStats.failedCount;
          data.testCount = resultStats.totalTests;
        } else {
          const failedSpecsCount = new Set(
            data.items.map((i) => i.specTitle || i.file).filter(Boolean),
          ).size;
          const defaultTotal =
            data.project === "tpbp" || data.environment?.includes("tpbp")
              ? 12
              : Math.max(12, failedSpecsCount);
          data.totalTests = data.totalTests || defaultTotal;
          data.failedCount = data.failedCount ?? failedSpecsCount;
          data.passedCount =
            data.passedCount ?? Math.max(0, data.totalTests - data.failedCount);
          data.testCount = data.totalTests;
        }
        runs.push(data);
      }
    } catch (e) {
      console.error(`Failed to parse visual run ${file}:`, e);
    }
  }

  return runs;
}

export function getVisualRunById(id?: string): VisualRunData | null {
  const all = getAllVisualRuns();
  if (all.length === 0) return null;
  if (!id) return all[0];
  return all.find((r) => r.pipelineId === id || r.jobId === id) || all[0];
}
