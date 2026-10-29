"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  ShieldCheck,
  Activity,
  FileCode,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Info,
  Search,
  RotateCcw,
  Layout,
  Server,
  Layers,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

const KPI_CONFIG = [
  { id: "eslint", label: "Linter" },
  { id: "vuetsclint", label: "Vue Lint" },
  { id: "auditProd", label: "Sécu Prod" },
  { id: "auditDev", label: "Sécu Dev" },
  { id: "coverage", label: "Couverture" },
  { id: "typecheck", label: "Typage" },
  { id: "sonar", label: "Sonar" },
];
import { THEME } from "../../lib/utils";
import {
  ProjectQuality,
  QualityMetric,
  MetricTrend,
  Vulnerability,
} from "../../lib/parseQuality";
import ProjectSelector from "../../components/ProjectSelector";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceArea,
} from "recharts";

interface QualityClientProps {
  projects: ProjectQuality[];
}

function TrendBadge({ trend }: { trend?: MetricTrend }) {
  if (!trend) return null;

  // Support both 'direction' and 'status' (legacy/fallback)
  const direction =
    trend.direction || (trend as unknown as { status?: "up" | "down" }).status;
  const diff =
    typeof trend.difference === "string"
      ? parseFloat(trend.difference)
      : trend.difference;

  if (diff === 0 || isNaN(diff)) return null;

  const Icon = direction === "up" ? TrendingUp : TrendingDown;
  const color = trend.isGood ? THEME.colors.passed : THEME.colors.failed;
  const bgColor = trend.isGood
    ? `${THEME.colors.passed}15`
    : `${THEME.colors.failed}15`;

  return (
    <div
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-tighter"
      style={{ backgroundColor: bgColor, color }}
    >
      <Icon size={10} strokeWidth={3} />
      {diff > 0 ? "+" : ""}
      {diff}
    </div>
  );
}

const PROJECT_COMPONENTS_MAP: Record<string, string[]> = {
  "demo-ecommerce": ["demo-ecommerce"],
};

function getParentProjectId(componentId: string): string {
  for (const [projectId, components] of Object.entries(
    PROJECT_COMPONENTS_MAP,
  )) {
    if (components.includes(componentId)) {
      return projectId;
    }
  }
  return componentId;
}

const RATING_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  A: { bg: "#f0fdf44d", border: "#dcfce7", text: "#15803d" }, // green-50 @ 30%, green-100, green-700
  B: { bg: "#f7fee74d", border: "#ecfccb", text: "#4d7c0f" }, // lime-50 @ 30%, lime-100, lime-700
  C: { bg: "#fffbeb4d", border: "#fef3c7", text: "#a16207" }, // amber-50 @ 30%, amber-100, amber-700
  D: { bg: "#fff7ed4d", border: "#ffedd5", text: "#c2410c" }, // orange-50 @ 30%, orange-100, orange-700
  E: { bg: "#fef2f24d", border: "#fee2e2", text: "#b91c1c" }, // red-50 @ 30%, red-100, red-700
};

const PROJECT_SONAR_MAP: Record<string, string> = {
  "savings-frontend": "anatec_savings-frontend",
  "savings-backend": "anatec_savings-backend",
  "lclmp-frontend": "anatec_tpbp-front",
  "wealth-advisory-backend": "anatec_welearn-back",
  "wealth-algo-service": "anatec_algo-service",
  "advisory-frontend": "anatec_advisory-frontend",
  tms: "anatec_wesave-test-qa",
};

function SonarRatingCircle({
  rating,
  label,
}: {
  rating?: string | number;
  label: string;
}) {
  const displayRating = rating?.toString() || "-";
  const style = RATING_STYLES[displayRating];
  const isAvailable =
    displayRating !== "-" && displayRating !== "N/A" && !!style;

  return (
    <Tooltip
      label={`${label}${isAvailable ? `: ${displayRating}` : " (Non disponible)"}`}
      position="top"
    >
      <div
        className={`w-full h-5 rounded-md flex items-center justify-center text-[7px] font-black shadow-sm transition-all border ${isAvailable ? "text-[9px]" : "bg-slate-50 border-slate-100 text-slate-400 opacity-60"}`}
        style={{
          backgroundColor: isAvailable ? style.bg : undefined,
          borderColor: isAvailable ? style.border : undefined,
          color: isAvailable ? style.text : undefined,
        }}
      >
        {isAvailable ? displayRating : "N/A"}
      </div>
    </Tooltip>
  );
}

function SonarRatings({
  metrics,
  projectId,
  isLinkable = false,
}: {
  metrics: ProjectQuality["metrics"];
  projectId: string;
  isLinkable?: boolean;
}) {
  const sonar = metrics.sonar;
  const details = sonar?.details || {};
  const sonarId = PROJECT_SONAR_MAP[projectId] || `anatec_${projectId}`;
  const sonarUrl = `https://sonarcloud.io/project/overview?id=${sonarId}`;

  const containerClassName = `flex items-start p-2 rounded-xl border transition-all relative group/cell mt-2 w-full ${
    isLinkable
      ? "bg-slate-50/50 border-slate-100 opacity-80 hover:bg-blue-50/50 hover:border-blue-300 hover:shadow-sm cursor-pointer"
      : "bg-slate-50/50 border-slate-100 opacity-80 cursor-default"
  }`;

  const content = (
    <div className="flex flex-col w-full">
      <div
        className={`text-[8px] font-black uppercase tracking-tight truncate leading-tight mb-1.5 transition-colors flex items-center gap-1 ml-1 ${
          isLinkable
            ? "text-slate-400 group-hover/cell:text-blue-600"
            : "text-slate-400"
        }`}
      >
        Sonar
        {isLinkable && (
          <ExternalLink
            size={8}
            className="opacity-0 group-hover/cell:opacity-100 transition-opacity"
          />
        )}
      </div>
      <div className="grid grid-cols-4 gap-1 w-full">
        <SonarRatingCircle rating={details["Security"]} label="Security" />
        <SonarRatingCircle
          rating={details["Reliability"]}
          label="Reliability"
        />
        <SonarRatingCircle
          rating={details["Maintainability"]}
          label="Maintainability"
        />
        <SonarRatingCircle
          rating={details["Security Review"]}
          label="Hotspots Reviewed"
        />
      </div>
    </div>
  );

  if (isLinkable) {
    return (
      <a
        href={sonarUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={containerClassName}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }

  return <div className={containerClassName}>{content}</div>;
}

const METRICS = [
  {
    id: "eslint" as const,
    label: "Linter",
    icon: FileCode,
    threshold: "0 erreur attendue",
  },
  {
    id: "vuetsclint" as const,
    label: "Vue Lint",
    icon: FileCode,
    threshold: "0 erreur attendue",
  },
  {
    id: "auditProd" as const,
    label: "Sécurité Prod",
    icon: ShieldCheck,
    threshold: "0 Critical/High",
  },
  {
    id: "auditDev" as const,
    label: "Sécurité Dev",
    icon: ShieldCheck,
    threshold: "0 Critical/High",
  },
  {
    id: "coverage" as const,
    label: "Couverture",
    icon: Activity,
    threshold: ">= 75% requis",
  },
  {
    id: "typecheck" as const,
    label: "Typage",
    icon: AlertCircle,
    threshold: "0 erreur attendue",
  },
];

const QUALITY_STATUS_CONFIG = [
  {
    id: "passed",
    label: "Stable",
    icon: CheckCircle2,
    color: THEME.colors.passed,
  },
  {
    id: "warning",
    label: "Attention",
    icon: AlertCircle,
    color: THEME.colors.flaky,
  },
  { id: "failed", label: "Échec", icon: XCircle, color: THEME.colors.failed },
  {
    id: "unknown",
    label: "Inconnu",
    icon: MinusCircle,
    color: THEME.colors.skipped,
  },
];

const PROJECT_TYPE_CONFIG = [
  { id: "frontend", label: "Frontend", icon: Layout },
  { id: "backend", label: "Backend", icon: Server },
  { id: "other", label: "Autres", icon: Layers },
];

function Tooltip({
  children,
  label,
  position = "top",
}: {
  children: React.ReactNode;
  label: string;
  position?: "top" | "bottom";
}) {
  return (
    <div className="group/tooltip relative inline-block">
      {children}
      <div
        className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-100 z-[100]`}
      >
        {label}
      </div>
    </div>
  );
}

const SEVERITY_WEIGHT: Record<string, number> = {
  critical: 4,
  high: 3,
  moderate: 2,
  low: 1,
};

function SortIndicator({
  field,
  sortField,
  sortDirection,
}: {
  field: string;
  sortField: string | null;
  sortDirection: "asc" | "desc";
}) {
  if (sortField !== field)
    return <ArrowUpDown size={12} className="text-slate-300" />;
  return sortDirection === "asc" ? (
    <ChevronUp size={12} className="text-blue-500" />
  ) : (
    <ChevronDown size={12} className="text-blue-500" />
  );
}

function HistoryChart({
  metric,
  metricId,
}: {
  metric: QualityMetric;
  metricId: string;
}) {
  if (!metric.history || metric.history.length === 0) return null;

  if (metric.history.length === 1) {
    return (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mt-6 flex flex-col items-center justify-center text-center py-12">
        <Clock size={32} className="text-slate-200 mb-3" />
        <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest">
          Historique en cours de constitution
        </h4>
        <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
          Les données historiques apparaîtront ici dès que de nouveaux scans seront effectués.
        </p>
      </div>
    );
  }

  interface DailyHistoryData {
    date: string;
    value: number;
    fullDate: string;
    timestamp: number;
  }

  const dailyDataMap = new Map<string, DailyHistoryData>();

  metric.history.forEach((h) => {
    let value = 0;
    if (metricId === "coverage") value = h.percentage || 0;
    else if (metricId === "eslint" || metricId === "vuetsclint")
      value = (h.errors || 0) + (h.warnings || 0);
    else if (metricId.startsWith("audit")) {
      const vuln = h.vulnerabilities as Record<string, number>;
      value = vuln
        ? (vuln.critical || 0) +
          (vuln.high || 0) +
          (vuln.moderate || 0) +
          (vuln.low || 0)
        : 0;
    }

    const dateObj = new Date(h.timestamp);
    const dateKey = dateObj.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
    });

    dailyDataMap.set(dateKey, {
      date: dateKey,
      value,
      fullDate: dateObj.toLocaleString("fr-FR"),
      timestamp: dateObj.getTime(),
    });
  });

  const data = Array.from(dailyDataMap.values()).sort(
    (a, b) => a.timestamp - b.timestamp,
  );

  const isCoverage = metricId === "coverage";
  const lineColor = isCoverage ? THEME.colors.passed : THEME.colors.failed;

  return (
    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-64 mt-6">
      <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Activity size={16} className="text-blue-500" />
        Évolution historique
      </h4>
      <div className="w-full h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            {isCoverage && (
              <>
                <ReferenceArea
                  y1={0}
                  y2={50}
                  fill="#fee2e2"
                  fillOpacity={0.5}
                />
                <ReferenceArea
                  y1={50}
                  y2={75}
                  fill="#fef9c3"
                  fillOpacity={0.5}
                />
                <ReferenceArea
                  y1={75}
                  y2={100}
                  fill="#dcfce7"
                  fillOpacity={0.5}
                />
              </>
            )}
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              dy={10}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#64748b" }}
              domain={isCoverage ? [0, 100] : ["auto", "auto"]}
              unit={isCoverage ? "%" : ""}
            />
            <RechartsTooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              }}
              labelStyle={{
                fontSize: "10px",
                color: "#64748b",
                marginBottom: "4px",
              }}
              itemStyle={{ fontSize: "12px", fontWeight: "bold" }}
              labelFormatter={(_, payload) =>
                payload[0]?.payload.fullDate || ""
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0, fill: lineColor }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function DetailsModal({
  isOpen,
  onClose,
  metricId,
  project,
}: {
  isOpen: boolean;
  onClose: () => void;
  metricId: string;
  project: ProjectQuality;
}) {
  const [vulnSearch, setVulnSearch] = useState("");
  const [sortField, setSortField] = useState<string>("severity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const metric = project.metrics[metricId as keyof ProjectQuality["metrics"]];
  const Icon = METRICS.find((m) => m.id === metricId)?.icon || Info;

  const isAudit = metricId === "auditProd" || metricId === "auditDev";
  const isLint = metricId === "eslint" || metricId === "vuetsclint";

  const vulnerabilitiesList = useMemo(() => {
    const m = metric as unknown as { vulnerabilitiesList?: Vulnerability[] };
    return isAudit && m && "vulnerabilitiesList" in m
      ? m.vulnerabilitiesList || []
      : [];
  }, [isAudit, metric]);

  const messagesList = useMemo(() => {
    const m = metric as unknown as {
      messagesList?: Array<{
        file: string;
        line: number;
        column: number;
        message: string;
        ruleId: string;
        severity: "error" | "warning";
      }>;
    };
    return isLint && m && "messagesList" in m ? m.messagesList || [] : [];
  }, [isLint, metric]);

  const showAuditTable =
    isAudit &&
    Array.isArray(vulnerabilitiesList) &&
    vulnerabilitiesList.length > 0;

  const showLintTable =
    isLint &&
    Array.isArray(messagesList) &&
    messagesList.length > 0;

  const filteredAndSortedVulns = useMemo(() => {
    let result = [...vulnerabilitiesList];

    if (vulnSearch) {
      const term = vulnSearch.toLowerCase();
      result = result.filter(
        (v) =>
          (v.package || "").toLowerCase().includes(term) ||
          (v.title || "").toLowerCase().includes(term),
      );
    }

    if (sortField && isAudit) {
      result.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortField === "severity") {
          valA = SEVERITY_WEIGHT[(a.severity || "").toLowerCase()] || 0;
          valB = SEVERITY_WEIGHT[(b.severity || "").toLowerCase()] || 0;
        } else {
          valA = (a[sortField as keyof Vulnerability] || "")
            .toString()
            .toLowerCase();
          valB = (b[sortField as keyof Vulnerability] || "")
            .toString()
            .toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [vulnerabilitiesList, vulnSearch, sortField, sortDirection, isAudit]);

  const filteredAndSortedLints = useMemo(() => {
    let result = [...messagesList];

    if (vulnSearch) {
      const term = vulnSearch.toLowerCase();
      result = result.filter(
        (m) =>
          (m.file || "").toLowerCase().includes(term) ||
          (m.message || "").toLowerCase().includes(term) ||
          (m.ruleId || "").toLowerCase().includes(term),
      );
    }

    if (sortField && isLint) {
      result.sort((a, b) => {
        let valA: string | number = "";
        let valB: string | number = "";

        if (sortField === "severity") {
          valA = a.severity === "error" ? 2 : 1;
          valB = b.severity === "error" ? 2 : 1;
        } else {
          valA = (a[sortField as keyof typeof messagesList[0]] || "")
            .toString()
            .toLowerCase();
          valB = (b[sortField as keyof typeof messagesList[0]] || "")
            .toString()
            .toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [messagesList, vulnSearch, sortField, sortDirection, isLint]);

  if (!isOpen) return null;

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const showTable = showAuditTable || showLintTable;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`bg-white rounded-[32px] w-full ${showTable ? "max-w-6xl" : "max-w-2xl"} shadow-2xl relative overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col max-h-[90vh]`}
      >
        <div className="p-8 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
                style={{
                  backgroundColor:
                    metric.status === "passed"
                      ? THEME.colors.passed
                      : metric.status === "failed"
                        ? THEME.colors.failed
                        : metric.status === "warning"
                          ? THEME.colors.flaky
                          : THEME.colors.skipped,
                }}
              >
                <Icon size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Détails {metric.label}
                </h3>
                <p className="text-sm text-slate-500">{project.label}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Valeur Actuelle
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {metric.value}
                  </span>
                  <TrendBadge trend={metric.trend} />
                </div>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Seuil (KPI)
                </span>
                <span className="text-sm font-bold text-slate-600">
                  {METRICS.find((m) => m.id === metricId)?.threshold}
                </span>
              </div>
            </div>

            {showAuditTable ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck size={18} className="text-blue-500" />
                    Liste des vulnérabilités
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">
                      {filteredAndSortedVulns.length}
                    </span>
                  </h4>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer par package ou titre..."
                      className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={vulnSearch}
                      onChange={(e) => setVulnSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-auto flex-1 min-h-0 border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th
                          className="py-3 px-4 w-32 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleSort("severity")}
                        >
                          <div className="flex items-center gap-2">
                            Séverité{" "}
                            <SortIndicator
                              field="severity"
                              sortField={sortField}
                              sortDirection={sortDirection}
                            />
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleSort("package")}
                        >
                          <div className="flex items-center gap-2">
                            Package{" "}
                            <SortIndicator
                              field="package"
                              sortField={sortField}
                              sortDirection={sortDirection}
                            />
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 w-1/3 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            Titre{" "}
                            <SortIndicator
                              field="title"
                              sortField={sortField}
                              sortDirection={sortDirection}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-4 w-48">Versions</th>
                        <th className="py-3 px-4 text-center w-24">Infos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedVulns.length > 0 ? (
                        filteredAndSortedVulns.map((vuln, idx: number) => {
                          const severity = (vuln.severity || "").toLowerCase();
                          let colors = {
                            main: THEME.colors.passed,
                            bg: `${THEME.colors.passed}15`,
                            border: `${THEME.colors.passed}30`,
                          };

                          if (severity === "critical" || severity === "high") {
                            colors = {
                              main: THEME.colors.failed,
                              bg: `${THEME.colors.failed}15`,
                              border: `${THEME.colors.failed}30`,
                            };
                          } else if (severity === "moderate") {
                            colors = {
                              main: THEME.colors.flaky,
                              bg: `${THEME.colors.flaky}15`,
                              border: `${THEME.colors.flaky}30`,
                            };
                          } else if (severity === "low") {
                            colors = {
                              main: THEME.colors.passed,
                              bg: `${THEME.colors.passed}15`,
                              border: `${THEME.colors.passed}30`,
                            };
                          }

                          return (
                            <tr
                              key={idx}
                              className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <span
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center border shadow-sm"
                                  style={{
                                    backgroundColor: colors.bg,
                                    color: colors.main,
                                    borderColor: colors.border,
                                  }}
                                >
                                  {vuln.severity}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono text-xs font-bold text-slate-700">
                                {vuln.package}
                              </td>
                              <td className="py-4 px-4 text-sm text-slate-900 font-medium">
                                {vuln.title}
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                                  <span
                                    className="font-bold"
                                    style={{ color: THEME.colors.failed }}
                                  >
                                    {vuln.vulnerableVersion}
                                  </span>
                                  <span className="text-slate-300">&rarr;</span>
                                  <span
                                    className="font-bold"
                                    style={{ color: THEME.colors.passed }}
                                  >
                                    {vuln.patchedVersion || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-center">
                                {vuln.link ? (
                                  <a
                                    href={vuln.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center p-2 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors"
                                    title="Plus d'infos"
                                  >
                                    <ExternalLink size={16} />
                                  </a>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="py-12 text-center text-slate-400 italic text-sm"
                          >
                            Aucune vulnérabilité ne correspond à votre
                            recherche.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : showLintTable ? (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col h-[500px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileCode size={18} className="text-blue-500" />
                    Détails des problèmes de Linting
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px] font-black">
                      {filteredAndSortedLints.length}
                    </span>
                  </h4>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrer par fichier ou message..."
                      className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium w-full md:w-64 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                      value={vulnSearch}
                      onChange={(e) => setVulnSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-auto flex-1 min-h-0 border border-slate-100 rounded-xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                      <tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th
                          className="py-3 px-4 w-32 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleSort("severity")}
                        >
                          <div className="flex items-center gap-2">
                            Type{" "}
                            <SortIndicator
                              field="severity"
                              sortField={sortField}
                              sortDirection={sortDirection}
                            />
                          </div>
                        </th>
                        <th
                          className="py-3 px-4 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => toggleSort("file")}
                        >
                          <div className="flex items-center gap-2">
                            Fichier{" "}
                            <SortIndicator
                              field="file"
                              sortField={sortField}
                              sortDirection={sortDirection}
                            />
                          </div>
                        </th>
                        <th className="py-3 px-4 w-1/2">Message</th>
                        <th className="py-3 px-4">Règle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedLints.map((msg, idx: number) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center border shadow-sm ${
                                msg.severity === "error"
                                  ? "bg-red-50 text-red-700 border-red-100"
                                  : "bg-orange-50 text-orange-700 border-orange-100"
                              }`}
                            >
                              {msg.severity}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-mono text-[10px] font-bold text-slate-700 break-all">
                            {msg.file}:{msg.line}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-900 font-medium">
                            {msg.message}
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                              {msg.ruleId}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Info size={16} className="text-blue-500" />
                  Analyse détaillée
                </h4>
                {metric.details ? (
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(metric.details).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex justify-between items-center py-2 border-b border-slate-200/50"
                      >
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {key}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-900">
                          {val}
                          {metricId === "coverage" ? "%" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-sm text-slate-400 italic">
                      Aucun détail supplémentaire disponible pour le moment. Les
                      journaux complets seront bientôt intégrés.
                    </p>
                  </div>
                )}
              </div>
            )}

            <HistoryChart metric={metric} metricId={metricId} />

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  value,
  status,
  showLabel = false,
  label = "",
  details,
  variant = "default",
  metricId,
  trend,
  onViewDetails,
}: {
  value: string | number;
  status: "passed" | "failed" | "warning" | "unknown";
  showLabel?: boolean;
  label?: string;
  details?: QualityMetric["details"];
  variant?: "default" | "compact";
  metricId?: string;
  trend?: MetricTrend;
  onViewDetails?: () => void;
}) {
  const isPassed = status === "passed";
  const isFailed = status === "failed";
  const isWarning = status === "warning";

  const statusColor = isPassed
    ? THEME.colors.passed
    : isFailed
      ? THEME.colors.failed
      : isWarning
        ? THEME.colors.flaky
        : THEME.colors.skipped;

  const Icon = isPassed
    ? CheckCircle2
    : isFailed
      ? XCircle
      : isWarning
        ? AlertCircle
        : MinusCircle;

  const threshold = METRICS.find((m) => m.id === metricId)?.threshold;

  if (variant === "compact") {
    return (
      <div
        onClick={
          onViewDetails
            ? (e) => {
                e.stopPropagation();
                onViewDetails();
              }
            : undefined
        }
        className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all relative group/cell ${
          isPassed
            ? "bg-white border-slate-100"
            : isFailed
              ? "bg-red-50/30 border-red-100"
              : isWarning
                ? "bg-orange-50/30 border-orange-100"
                : "bg-slate-50 border-slate-100 opacity-60"
        } ${onViewDetails ? "cursor-pointer active:scale-[0.98]" : ""}`}
      >
        <div
          className="w-4 h-4 rounded flex items-center justify-center text-white shadow-sm shrink-0"
          style={{ backgroundColor: statusColor }}
        >
          <Icon size={10} />
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="text-[8px] font-black text-slate-400 uppercase tracking-tight truncate leading-tight">
            {label}
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className={`text-[10px] font-bold truncate leading-tight ${
                isPassed
                  ? "text-slate-900"
                  : isFailed
                    ? "text-red-700"
                    : isWarning
                      ? "text-orange-700"
                      : "text-slate-400"
              }`}
            >
              {value}
            </div>
            <TrendBadge trend={trend} />
          </div>
        </div>

        {/* Tooltip for threshold */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50">
          <div className="bg-slate-800 text-white text-[8px] font-bold py-1 px-2 rounded whitespace-nowrap shadow-xl">
            {threshold}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={
        onViewDetails
          ? (e) => {
              e.stopPropagation();
              onViewDetails();
            }
          : undefined
      }
      className={`flex flex-col rounded-2xl border transition-all p-3 group relative ${
        isPassed
          ? "bg-white border-slate-100 hover:border-green-200 hover:shadow-md"
          : isFailed
            ? "bg-red-50/30 border-red-100 hover:border-red-200"
            : isWarning
              ? "bg-orange-50/30 border-orange-100 hover:border-orange-200"
              : "bg-slate-50 border-slate-100 opacity-60"
      } ${onViewDetails ? "cursor-pointer active:scale-[0.98]" : ""}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm"
          style={{ backgroundColor: statusColor }}
        >
          <Icon size={14} />
        </div>
        {showLabel && (
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
            {label}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`text-[10px] font-bold truncate ${
                isPassed
                  ? "text-slate-900"
                  : isFailed
                    ? "text-red-700"
                    : isWarning
                      ? "text-orange-700"
                      : "text-slate-400"
              }`}
            >
              {value}
            </div>
            <TrendBadge trend={trend} />
          </div>
          <div className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">
            {threshold}
          </div>
        </div>
      </div>

      {details && (
        <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 border-t border-slate-100 pt-2">
          {Object.entries(details).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-[8px] uppercase text-slate-400 font-bold">
                {key}
              </span>
              <span className="text-[9px] font-mono font-bold text-slate-600">
                {val}
                {metricId === "coverage" ? "%" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function QualityClient({ projects }: QualityClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const selectedProject = searchParams.get("project") || "all";
  const isProjectView = selectedProject !== "all";
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([
    "passed",
    "warning",
    "failed",
    "unknown",
  ]);
  const [typeFilter, setTypeFilter] = useState<string[]>([
    "frontend",
    "backend",
    "other",
  ]);
  const [visibleKpis, setVisibleKpis] = useState<string[]>(
    KPI_CONFIG.map((k) => k.id),
  );
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    metricId: string;
    project: ProjectQuality | null;
  }>({
    isOpen: false,
    metricId: "",
    project: null,
  });

  const handleProjectChange = useCallback(
    (projectId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("project", projectId);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const toggleStatus = (statusId: string) => {
    setStatusFilter((prev) =>
      prev.includes(statusId)
        ? prev.filter((id) => id !== statusId)
        : [...prev, statusId],
    );
  };

  const toggleType = (typeId: string) => {
    setTypeFilter((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId],
    );
  };

  const toggleKpi = (kpiId: string) => {
    setVisibleKpis((prev) =>
      prev.includes(kpiId)
        ? prev.filter((id) => id !== kpiId)
        : [...prev, kpiId],
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter(["passed", "warning", "failed", "unknown"]);
    setTypeFilter(["frontend", "backend", "other"]);
    setVisibleKpis(KPI_CONFIG.map((k) => k.id));
  };

  const isFiltered =
    searchTerm !== "" ||
    statusFilter.length !== 4 ||
    typeFilter.length !== 3 ||
    !statusFilter.includes("passed") ||
    !statusFilter.includes("warning") ||
    !statusFilter.includes("failed") ||
    !statusFilter.includes("unknown") ||
    !typeFilter.includes("frontend") ||
    !typeFilter.includes("backend") ||
    !typeFilter.includes("other") ||
    visibleKpis.length !== KPI_CONFIG.length;

  const getGlobalStatus = (metrics: ProjectQuality["metrics"]) => {
    const relevantKeys: Array<keyof ProjectQuality["metrics"]> = [
      "sonar",
      "coverage",
      "eslint",
      "vuetsclint",
      "auditProd",
      "auditDev",
    ];

    const statuses = relevantKeys.map((k) => metrics[k].status);

    if (statuses.includes("failed"))
      return {
        id: "failed",
        label: "Échec",
        color: THEME.colors.failed,
        icon: XCircle,
      };
    if (statuses.includes("warning"))
      return {
        id: "warning",
        label: "Attention",
        color: THEME.colors.flaky,
        icon: AlertCircle,
      };

    // Si toutes les métriques pertinentes sont "passed" OU "unknown" (ex: un projet backend sans vue lint),
    // on le considère comme "passed" globalement si au moins une métrique pertinente est "passed".
    // Sinon, on garde "unknown".
    const hasPassed = statuses.includes("passed");
    const onlyPassedOrUnknown = statuses.every(
      (s) => s === "passed" || s === "unknown",
    );

    if (hasPassed && onlyPassedOrUnknown)
      return {
        id: "passed",
        label: "Stable",
        color: THEME.colors.passed,
        icon: CheckCircle2,
      };

    return {
      id: "unknown",
      label: "Inconnu",
      color: THEME.colors.skipped,
      icon: MinusCircle,
    };
  };

  const allProjects = useMemo(() => {
    if (selectedProject === "all") {
      // Filter out duplicate components if any (though getQualityData should return unique ones)
      const uniqueIds = new Set<string>();
      return projects.filter((p) => {
        if (uniqueIds.has(p.id)) return false;
        uniqueIds.add(p.id);
        return true;
      });
    }

    const componentIds = PROJECT_COMPONENTS_MAP[selectedProject] || [];

    return componentIds.map((compId): ProjectQuality => {
      const existingRepo = projects.find((ep) => ep.id === compId);
      if (existingRepo) return existingRepo;

      let type: "frontend" | "backend" | "other" = "other";
      if (compId.includes("-frontend")) type = "frontend";
      else if (compId.includes("-backend")) type = "backend";
      else if (compId === "tms") type = "frontend";

      return {
        id: compId,
        label: compId,
        type,
        metrics: {
          sonar: {
            label: "Sonar",
            value: "N/A",
            status: "unknown" as const,
          },
          eslint: {
            label: "ESLint",
            value: "N/A",
            warnings: 0,
            errors: 0,
            status: "unknown" as const,
          },
          vuetsclint: {
            label: "Vue Lint",
            value: "N/A",
            warnings: 0,
            errors: 0,
            status: "unknown" as const,
          },
          coverage: {
            label: "Couverture",
            value: "N/A",
            percentage: 0,
            status: "unknown" as const,
            details: { Statements: 0, Branches: 0, Functions: 0, Lines: 0 },
          },
          auditProd: {
            label: "Sécurité Prod",
            value: "N/A",
            vulnerabilities: {
              low: 0,
              moderate: 0,
              high: 0,
              critical: 0,
            },
            totalDependencies: 0,
            status: "unknown" as const,
          },
          auditDev: {
            label: "Sécurité Dev",
            value: "N/A",
            vulnerabilities: {
              low: 0,
              moderate: 0,
              high: 0,
              critical: 0,
            },
            totalDependencies: 0,
            status: "unknown" as const,
          },
          typecheck: {
            label: "Typescript",
            value: "N/A",
            errors: 0,
            status: "unknown" as const,
          },
        },
        lastUpdate: new Date().toISOString(),
      };
    });
  }, [projects, selectedProject]);

  const filteredProjects = useMemo(() => {
    return allProjects.filter((project) => {
      const globalStatus = getGlobalStatus(project.metrics);
      const matchesSearch = project.label
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter.length === 0 ||
        statusFilter.includes(globalStatus.id || "unknown");
      const matchesType =
        typeFilter.length === 0 || typeFilter.includes(project.type);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allProjects, searchTerm, statusFilter, typeFilter]);

  const showBoardLayout = selectedProject === "all";

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-blue-600 w-6 h-6" />
              Qualité du code
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
            {filteredProjects.length} repository{filteredProjects.length > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Filters Bar - Harmonisé avec Dashboard, Details, History, Visual */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center gap-3">
            <div className="relative flex-1 w-full min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher un repository..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-200 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0 justify-between lg:justify-start">
              {/* Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Par type
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {PROJECT_TYPE_CONFIG.map((type) => {
                    const isSelected = typeFilter.includes(type.id);
                    const Icon = type.icon;
                    return (
                      <Tooltip
                        key={type.id}
                        label={type.label}
                        position="bottom"
                      >
                        <button
                          onClick={() => toggleType(type.id)}
                          data-testid={`type-filter-${type.id}`}
                          className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? "bg-white shadow-sm ring-1 ring-slate-200/80"
                              : "opacity-40 grayscale hover:opacity-100"
                          }`}
                        >
                          <Icon
                            size={14}
                            className={isSelected ? "text-blue-600" : "text-slate-500"}
                          />
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden xl:block"></div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Par statut
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {QUALITY_STATUS_CONFIG.map((status) => {
                    const isSelected = statusFilter.includes(status.id);
                    const Icon = status.icon;
                    return (
                      <Tooltip
                        key={status.id}
                        label={status.label}
                        position="bottom"
                      >
                        <button
                          onClick={() => toggleStatus(status.id)}
                          data-testid={`status-filter-${status.id}`}
                          className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                            isSelected
                              ? "bg-white shadow-sm ring-1 ring-slate-200/80"
                              : "opacity-40 grayscale hover:opacity-100"
                          }`}
                        >
                          <Icon
                            size={14}
                            style={{
                              color: isSelected ? status.color : undefined,
                            }}
                          />
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>

              <div className="h-4 w-px bg-slate-200 hidden xl:block"></div>

              {/* KPI Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                  Indicateurs (KPIs) affichés
                </span>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {KPI_CONFIG.map((kpi) => {
                    const isSelected = visibleKpis.includes(kpi.id);
                    return (
                      <button
                        key={kpi.id}
                        data-testid={`kpi-pill-${kpi.id}`}
                        onClick={() => toggleKpi(kpi.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        {kpi.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset button */}
              <button
                onClick={resetFilters}
                disabled={!isFiltered}
                title="Réinitialiser tous les filtres"
                className={`p-2 rounded-xl border transition-all ${
                  isFiltered
                    ? "bg-white text-blue-600 border-slate-200 shadow-sm hover:border-blue-300 active:scale-95 cursor-pointer"
                    : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                }`}
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
        {showBoardLayout ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {filteredProjects.map((project, idx) => {
              const globalStatus = getGlobalStatus(project.metrics);
              const hasNoData = Object.values(project.metrics).every(
                (m) => m.status === "unknown",
              );

              return (
                <div
                  key={`${project.id}-${idx}`}
                  onClick={() =>
                    handleProjectChange(getParentProjectId(project.id))
                  }
                  className="bg-white rounded-3xl border border-slate-100 p-5 sm:p-6 shadow-sm transition-all hover:shadow-md group flex flex-col cursor-pointer active:scale-[0.99] h-full"
                >
                  <div className="flex items-start justify-between mb-5 flex-1">
                    <div className="flex items-start gap-3 w-full">
                      <div
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-white shadow-sm transition-colors mt-0.5"
                        style={{
                          backgroundColor: hasNoData
                            ? THEME.colors.skipped
                            : globalStatus.color,
                        }}
                      >
                        <globalStatus.icon size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight line-clamp-2 text-sm">
                            {project.label}
                          </h3>
                          {project.type !== "other" && (
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-500 shrink-0 font-mono">
                              {project.type}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                          <Clock size={10} />
                          {new Date(project.lastUpdate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {METRICS.filter((m) => visibleKpis.includes(m.id)).map(
                      (m) => (
                        <MetricCell
                          key={m.id}
                          label={m.label}
                          value={
                            project.metrics[
                              m.id as keyof ProjectQuality["metrics"]
                            ].value
                          }
                          status={
                            project.metrics[
                              m.id as keyof ProjectQuality["metrics"]
                            ].status
                          }
                          trend={
                            project.metrics[
                              m.id as keyof ProjectQuality["metrics"]
                            ].trend
                          }
                          variant="compact"
                          metricId={m.id}
                        />
                      ),
                    )}
                  </div>
                  {visibleKpis.includes("sonar") && (
                    <SonarRatings
                      metrics={project.metrics}
                      projectId={project.id}
                      isLinkable={isProjectView}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-6">
              {filteredProjects.map((project, idx) => {
                const globalStatus = getGlobalStatus(project.metrics);
                const hasNoData = Object.values(project.metrics).every(
                  (m) => m.status === "unknown",
                );

                return (
                  <div
                    key={`${project.id}-${idx}`}
                    className="bg-white rounded-3xl border border-slate-100 p-6 sm:p-8 shadow-sm w-full lg:w-[calc(50%-12px)] xl:w-[calc(33.333%-16px)] max-w-2xl"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                          style={{
                            backgroundColor: hasNoData
                              ? THEME.colors.skipped
                              : globalStatus.color,
                          }}
                        >
                          <globalStatus.icon size={24} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h2 className="text-lg font-bold text-slate-900">
                              {project.label}
                            </h2>
                            {project.type !== "other" && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                                {project.type}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5 font-mono">
                            <Clock size={11} />
                            Mis à jour le{" "}
                            {new Date(project.lastUpdate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {METRICS.filter((m) => visibleKpis.includes(m.id)).map(
                        (m) => (
                          <div key={m.id} className="flex flex-col gap-2">
                            <MetricCell
                              value={
                                project.metrics[
                                  m.id as keyof ProjectQuality["metrics"]
                                ].value
                              }
                              status={
                                project.metrics[
                                  m.id as keyof ProjectQuality["metrics"]
                                ].status
                              }
                              trend={
                                project.metrics[
                                  m.id as keyof ProjectQuality["metrics"]
                                ].trend
                              }
                              label={m.label}
                              showLabel
                              details={
                                project.metrics[
                                  m.id as keyof ProjectQuality["metrics"]
                                ].details
                              }
                              metricId={m.id}
                              onViewDetails={() =>
                                setModalState({
                                  isOpen: true,
                                  metricId: m.id,
                                  project: project,
                                })
                              }
                            />
                          </div>
                        ),
                      )}
                    </div>
                    {visibleKpis.includes("sonar") && (
                      <SonarRatings
                        metrics={project.metrics}
                        projectId={project.id}
                        isLinkable={isProjectView}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {allProjects.length === 0 && (
          <div className="bg-slate-50 p-16 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[300px]">
            <AlertCircle size={36} className="text-slate-300 mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Aucune donnée disponible
            </p>
          </div>
        )}
      </div>

      {modalState.project && (
        <DetailsModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          metricId={modalState.metricId}
          project={modalState.project}
        />
      )}
    </div>
  );
}
