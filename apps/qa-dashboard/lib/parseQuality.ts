import fs from "fs";
import path from "path";

export type MetricTrend = {
  difference: number;
  direction: "up" | "down";
  isGood: boolean;
};

export type QualityMetric = {
  label: string;
  value: string;
  status: "passed" | "failed" | "warning" | "unknown";
  warnings?: number;
  errors?: number;
  vulnerabilities?:
    | number
    | {
        low: number;
        moderate: number;
        high: number;
        critical: number;
      };
  totalDependencies?: number;
  details?: Record<string, number | string>;
  messagesList?: Array<{
    file: string;
    line: number;
    column: number;
    message: string;
    ruleId: string;
    severity: "error" | "warning";
  }>;
  trend?: MetricTrend;
  timestamp?: string;
  history?: Array<{
    timestamp: string;
    value?: string | number;
    percentage?: number;
    errors?: number;
    warnings?: number;
    vulnerabilities?: {
      low: number;
      moderate: number;
      high: number;
      critical: number;
    };
  }>;
};

export type TestQualityMetric = QualityMetric & {
  percentage?: number;
  details: {
    Statements: number;
    Branches: number;
    Functions: number;
    Lines: number;
  };
};

export type LintQualityMetric = QualityMetric & {
  label: string;
  warnings: number;
  errors: number;
};

export type Vulnerability = {
  severity: string;
  title: string;
  package: string;
  vulnerableVersion: string;
  patchedVersion: string;
  link: string;
};
export type AuditQualityMetric = Omit<QualityMetric, "vulnerabilities"> & {
  vulnerabilities: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  totalDependencies: number;
  vulnerabilitiesList?: Vulnerability[];
};

export interface ProjectQuality {
  id: string;
  label: string;
  type: "frontend" | "backend" | "other";
  metrics: {
    eslint: LintQualityMetric;
    vuetsclint: LintQualityMetric;
    coverage: TestQualityMetric;
    auditProd: AuditQualityMetric;
    auditDev: AuditQualityMetric;
    typecheck: QualityMetric;
    sonar: QualityMetric;
  };
  lastUpdate: string;
}

export function formatMetric(
  type: string,
  metric: Record<string, unknown>,
): {
  value: string;
  status: QualityMetric["status"];
  totalDependencies?: number;
  details?: Record<string, number | string>;
  trend?: MetricTrend;
  vulnerabilitiesList?: Vulnerability[];
} {
  const trend = metric.trend as MetricTrend | undefined;

  switch (type) {
    case "sonar": {
      if (metric.status === undefined) {
        return { value: "N/A", status: "unknown" };
      }
      return {
        value: (metric.value as string) || (metric.status === "passed" ? "Passed" : "Failed"),
        status: metric.status as QualityMetric["status"],
        details: metric.details as Record<string, number | string>,
        trend,
      };
    }
    case "eslint":
    case "vuetsclint": {
      if (metric.errors === undefined && metric.warnings === undefined) {
        return { value: "N/A", status: "unknown" };
      }
      const errors = (metric.errors as number) || 0;
      const warnings = (metric.warnings as number) || 0;
      return {
        value: `${errors} err, ${warnings} warn`,
        status: errors > 0 ? "failed" : warnings > 0 ? "warning" : "passed",
        details: {
          Erreurs: errors,
          Warnings: warnings,
        },
        trend,
      };
    }
    case "coverage": {
      if (metric.percentage === undefined || metric.percentage === null) {
        return { value: "N/A", status: "unknown" };
      }
      const percentage = (metric.percentage as number) || 0;
      // Seuils (KPIs) : < 50% = failed, 50-75% = warning, >= 75% = passed
      return {
        value: `${percentage}%`,
        status:
          percentage < 50 ? "failed" : percentage < 75 ? "warning" : "passed",
        details: metric.details as Record<string, number>,
        trend,
      };
    }

    case "audit":
    case "auditProd":
    case "auditDev": {
      const isDev = type === "auditDev";

      if (
        metric.vulnerabilities === undefined &&
        metric.totalDependencies === undefined &&
        metric.dependencies === undefined
      ) {
        return { value: "N/A", status: "unknown" };
      }
      // Handle both single number and detailed object
      let total = 0;
      const vuln = metric.vulnerabilities as number | Record<string, number>;
      let details = metric.details as Record<string, number>;

      if (typeof vuln === "number") {
        total = vuln;
      } else if (typeof vuln === "object" && vuln !== null) {
        total =
          (vuln.low || 0) +
          (vuln.moderate || 0) +
          (vuln.high || 0) +
          (vuln.critical || 0);
        // Map lowercase keys from JSON to capitalized keys for UI
        if (!details) {
          details = {
            Critical: vuln.critical || 0,
            High: vuln.high || 0,
            Moderate: vuln.moderate || 0,
            Low: vuln.low || 0,
          };
        }
      } else if (metric.details) {
        total = Object.values(metric.details as Record<string, number>).reduce(
          (a, b) => a + b,
          0,
        );
      }

      const vulnObj =
        typeof vuln === "object" && vuln !== null
          ? (vuln as Record<string, number>)
          : null;

      const hasCriticalOrHigh =
        (vulnObj?.critical || 0) > 0 ||
        (vulnObj?.high || 0) > 0 ||
        (details?.Critical || 0) > 0 ||
        (details?.High || 0) > 0;

      const hasModerate =
        (vulnObj?.moderate || 0) > 0 || (details?.Moderate || 0) > 0;

      let status: QualityMetric["status"] = "passed";
      if (hasCriticalOrHigh) {
        // Les vulnérabilités de développement n'impactent plus le voyant "Santé Sécurité" global.
        status = isDev ? "warning" : "failed";
      } else if (hasModerate) {
        status = "warning";
      }

      const totalDependencies =
        (metric.totalDependencies as number) ||
        (metric.dependencies as number) ||
        0;

      const criticalCount =
        (vulnObj?.critical as number) || (details?.Critical as number) || 0;
      const highCount =
        (vulnObj?.high as number) || (details?.High as number) || 0;

      let value = `${total} vuln.`;
      if (total > 0 && (criticalCount > 0 || highCount > 0)) {
        const parts = [];
        if (criticalCount > 0) parts.push(`${criticalCount} crit.`);
        if (highCount > 0) parts.push(`${highCount} high`);
        value = `${total} (${parts.join(" ")})`;
      }

      const vulnerabilitiesList = metric.vulnerabilitiesList as
        | Vulnerability[]
        | undefined;

      return {
        value,
        status: total > 0 ? status : "passed",
        totalDependencies,
        details,
        trend,
        vulnerabilitiesList,
      };
    }
    case "typecheck": {
      if (metric.errors === undefined || metric.errors === null) {
        return { value: "N/A", status: "unknown" };
      }
      const errors = (metric.errors as number) || 0;
      return {
        value: errors > 0 ? "Erreurs détectées" : "0 erreurs",
        status: errors > 0 ? "failed" : "passed",
        trend,
      };
    }
    default:
      return { value: "N/A", status: "unknown", trend };
  }
}

function getRegisteredProjects(): { id: string; label: string; folder: string }[] {
  try {
    let registryPath = path.resolve(process.cwd(), "lib/projects-registry.json");
    if (!fs.existsSync(registryPath)) {
      const alt = path.resolve(process.cwd(), "apps/qa-dashboard/lib/projects-registry.json");
      if (fs.existsSync(alt)) registryPath = alt;
    }
    if (fs.existsSync(registryPath)) {
      const raw = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
      return raw
        .filter((p: { id: string }) => p.id !== "all")
        .map((p: { id: string; label: string }) => ({
          id: p.id,
          label: p.label || p.id,
          folder: p.id,
        }));
    }
  } catch (err) {
    console.error("Error reading projects-registry:", err);
  }
  return [];
}

const METRIC_FILES = {
  eslint: "eslint.json",
  vuetsclint: "vuetsclint.json",
  coverage: "coverage.json",
  auditProd: "auditProd.json",
  auditDev: "auditDev.json",
  typecheck: "typecheck.json",
  sonar: "sonar.json",
};

const METRIC_LABELS: Record<string, string> = {
  eslint: "ESLint",
  vuetsclint: "Vue ESLint",
  coverage: "Couverture",
  auditProd: "Audit Prod",
  auditDev: "Audit Dev",
  typecheck: "TypeScript",
  sonar: "Sonar",
};

export function getQualityData(): ProjectQuality[] {
  let dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    const alt = path.join(process.cwd(), "apps/qa-dashboard/data");
    if (fs.existsSync(alt)) dataDir = alt;
  }

  const projects = getRegisteredProjects();

  return projects.map((project) => {
    const projectDir = path.join(dataDir, project.folder);
    const metrics: Record<string, unknown> = {};
    let latestMtime = 0;

    for (const [key, fileName] of Object.entries(METRIC_FILES)) {
      const filePath = path.join(projectDir, fileName);
      let metricData: Record<string, unknown> = { label: METRIC_LABELS[key] };

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const parsed = JSON.parse(content);
          metricData = { ...metricData, ...parsed };

          const stats = fs.statSync(filePath);
          if (stats.mtimeMs > latestMtime) {
            latestMtime = stats.mtimeMs;
          }
        } catch (error) {
          console.error(`Error parsing ${filePath}:`, error);
        }
      }

      const {
        value,
        status,
        totalDependencies,
        details,
        trend,
        vulnerabilitiesList,
      } = formatMetric(key, metricData);

      metrics[key] = {
        ...metricData,
        value,
        status,
        ...(totalDependencies !== undefined ? { totalDependencies } : {}),
        ...(details !== undefined ? { details } : {}),
        ...(vulnerabilitiesList !== undefined ? { vulnerabilitiesList } : {}),
        trend,
      };
    }

    let type: "frontend" | "backend" | "other" = "other";
    if (project.id.includes("-frontend")) type = "frontend";
    else if (project.id.includes("-backend")) type = "backend";
    else if (project.id === "tms" || project.id.includes("-blog"))
      type = "frontend";

    return {
      id: project.id,
      label: project.label,
      type,
      metrics: metrics as ProjectQuality["metrics"],
      lastUpdate:
        latestMtime > 0
          ? new Date(latestMtime).toISOString()
          : new Date().toISOString(),
    };
  });
}
