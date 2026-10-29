"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Check,
  X,
  CircleSlash,
  ArrowRightToLine,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { THEME } from "../lib/utils";

interface Stats {
  total: number;
  expected: number;
  unexpected: number;
  skipped: number;
  flaky: number;
}

export interface CategorySummaryStats {
  functional?: Stats;
  component?: Stats;
  visual?: Stats;
}

interface Props {
  stats: Stats;
  title?: string;
  onClick?: () => void;
  runId?: string;
  project?: string;
  categories?: CategorySummaryStats;
}

export default function TestResultPieChart({
  stats,
  title,
  onClick,
  runId,
  project,
}: Props) {
  const router = useRouter();
  const COLORS = THEME.colors;

  const total =
    stats.total ||
    stats.expected + stats.unexpected + stats.skipped + stats.flaky;

  const successPercent =
    total > 0 ? Math.round((stats.expected / total) * 100) : 0;

  const data = [
    {
      name: "Succès",
      value: stats.expected || 0,
      color: COLORS.passed,
      icon: Check,
      label: "Succès",
    },
    {
      name: "Instables",
      value: stats.flaky || 0,
      color: COLORS.flaky,
      icon: CircleSlash,
      label: "Instables",
    },
    {
      name: "Ignorés",
      value: stats.skipped || 0,
      color: COLORS.skipped,
      icon: ArrowRightToLine,
      label: "Ignorés",
    },
    {
      name: "Échecs",
      value: stats.unexpected || 0,
      color: COLORS.failed,
      icon: X,
      label: "Échecs",
    },
  ];

  const chartData =
    stats.expected === 0 &&
    stats.unexpected === 0 &&
    stats.flaky === 0 &&
    stats.skipped === 0
      ? [{ value: 1, color: COLORS.empty }]
      : data.filter((d) => d.value > 0);

  const displayTitle = title
    ? title.startsWith("Derniers résultats")
      ? title
      : `Derniers résultats — ${title}`
    : "Derniers résultats";

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (runId) {
      const params = new URLSearchParams();
      params.set("id", runId);
      if (project && project !== "all") {
        params.set("project", project);
      }
      router.push(`/details?${params.toString()}`);
    }
  };

  const headerIconStyle =
    stats.unexpected === 0
      ? {
          backgroundColor: `${COLORS.passed}15`,
          color: COLORS.passed,
        }
      : {
          backgroundColor: `${COLORS.failed}15`,
          color: COLORS.failed,
        };

  return (
    <div
      onClick={handleClick}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all h-[350px] w-full flex flex-col justify-between group cursor-pointer"
      title="Voir les détails complets des résultats"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={headerIconStyle}
          >
            {stats.unexpected > 0 ? (
              <XCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">
              {displayTitle}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
              {total} tests au total • {successPercent}% de succès
            </p>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          className="text-slate-300 group-hover:text-blue-600 transition-colors"
        />
      </div>

      {/* Donut Container - Centré avec infobulle au survol */}
      <div className="w-36 h-36 sm:w-44 sm:h-44 relative mx-auto my-auto flex-shrink-0">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-0">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">
            {total}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            TESTS
          </span>
        </div>

        <div className="relative z-10 w-full h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius="76%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                isAnimationActive={true}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry as { color: string }).color}
                    stroke="none"
                  />
                ))}
              </Pie>
              <Tooltip
                wrapperStyle={{ zIndex: 100 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as {
                      label?: string;
                      value?: number;
                    };
                    const percent =
                      total > 0 && d.value
                        ? Math.round((d.value / total) * 100)
                        : 0;
                    return (
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-xs z-[100]">
                        <p className="font-bold text-slate-900">{d.label}</p>
                        <p className="text-slate-500">
                          {d.value} tests ({percent}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
        <span>
          {onClick ? "Filtrer ce projet" : "Voir les détails complets"}
        </span>
        <ArrowRight
          size={12}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </div>
  );
}
