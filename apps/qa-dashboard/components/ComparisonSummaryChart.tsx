"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  ArrowUpRight,
  Equal,
} from "lucide-react";
import { RunData, THEME, computeRunComparison } from "../lib/utils";

export interface ComparisonSummaryChartProps {
  history: RunData[];
  project?: string;
}

export function ComparisonSummaryChart({
  history,
  project,
}: ComparisonSummaryChartProps) {
  // On compare les 2 derniers runs de l'historique
  // history[0] = le run le plus récent (Cible / Run B)
  // history[1] = le run précédent (Référence / Run A)
  const runB = history.length > 0 ? history[0] : null;
  const runA = history.length > 1 ? history[1] : null;

  const comparison = useMemo(() => {
    if (!runA || !runB) return null;
    return computeRunComparison(runA, runB);
  }, [runA, runB]);

  // Si on n'a pas au moins 2 exécutions, la comparaison est impossible
  if (!runA || !runB || !comparison) {
    return (
      <div
        data-testid="comparison-summary-empty"
        className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm h-[350px] flex flex-col items-center justify-center text-center"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
          style={{
            backgroundColor: `${THEME.colors.slate[100]}`,
            color: THEME.colors.slate[400],
          }}
        >
          <GitCompare size={20} />
        </div>
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Comparaison inter-runs
        </h3>
        <p className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
          {history.length === 1
            ? "1 seul run disponible. Au moins 2 exécutions sont requises."
            : "Aucun run disponible pour générer la comparaison."}
        </p>
      </div>
    );
  }

  // URL vers la page /compare avec les 2 runs pré-sélectionnés
  const compareParams = new URLSearchParams();
  compareParams.set("run1", runA.id);
  compareParams.set("run2", runB.id);
  if (project && project !== "all") {
    compareParams.set("project", project);
  }
  const compareUrl = `/compare?${compareParams.toString()}`;

  const formatRunLabel = (id: string) => {
    if (id.startsWith("CI Run - ")) return `#${id.replace("CI Run - ", "")}`;
    if (id.startsWith("Local Run - ")) {
      const timePart = id.replace("Local Run - ", "").split("T")[1];
      return timePart ? timePart.substring(0, 5).replace("-", ":") : "Local";
    }
    return id.length > 14 ? `${id.substring(0, 12)}...` : id;
  };

  const regressionsCount = comparison.regressions.length;
  const improvementsCount = comparison.improvements.length;
  const addedCount = comparison.added.length;
  const removedCount = comparison.removed.length;
  const totalChanges =
    regressionsCount + improvementsCount + addedCount + removedCount;

  const headerIconStyle =
    totalChanges === 0
      ? {
          backgroundColor: `${THEME.colors.slate[100]}`,
          color: THEME.colors.slate[500],
        }
      : regressionsCount > 0
        ? {
            backgroundColor: `${THEME.colors.failed}15`,
            color: THEME.colors.failed,
          }
        : {
            backgroundColor: `${THEME.colors.blue}15`,
            color: THEME.colors.blue,
          };

  return (
    <Link
      href={compareUrl}
      data-testid="comparison-summary-card"
      className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all h-[350px] flex flex-col justify-between group cursor-pointer"
      title="Ouvrir la comparaison détaillée des 2 derniers runs"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={headerIconStyle}
          >
            <GitCompare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">
              Évolution Inter-Runs
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold flex items-center gap-1 mt-0.5">
              <span>{formatRunLabel(runA.id)}</span>
              <ArrowRight size={10} className="text-slate-300" />
              <span style={{ color: THEME.colors.blue }}>
                {formatRunLabel(runB.id)}
              </span>
            </p>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          className="text-slate-300 group-hover:text-blue-600 transition-colors"
        />
      </div>

      {/* Body: Pas de différence de résultat des tests OU liste des deltas signés (+ / -) */}
      {totalChanges === 0 ? (
        <div
          data-testid="no-changes-view"
          className="my-auto flex flex-col items-center justify-center text-center py-3 px-2"
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
            style={{
              backgroundColor: `${THEME.colors.slate[100]}`,
              color: THEME.colors.slate[500],
            }}
          >
            <Equal size={22} strokeWidth={2.5} />
          </div>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            Pas de différence de résultat des tests
          </p>
        </div>
      ) : (
        <div
          data-testid="changes-list-view"
          className="my-auto flex flex-col gap-2 py-2"
        >
          {improvementsCount > 0 && (
            <div
              data-testid="delta-improvements"
              className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold"
              style={{
                backgroundColor: `${THEME.colors.passed}12`,
                borderColor: `${THEME.colors.passed}30`,
                color: THEME.colors.passed,
              }}
            >
              <span className="flex items-center gap-2">
                <TrendingUp
                  size={14}
                  style={{ color: THEME.colors.passed }}
                  className="shrink-0"
                />
                {improvementsCount}{" "}
                {improvementsCount > 1
                  ? "tests repassés au vert"
                  : "test repassé au vert"}
              </span>
            </div>
          )}
          {regressionsCount > 0 && (
            <div
              data-testid="delta-regressions"
              className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold"
              style={{
                backgroundColor: `${THEME.colors.failed}12`,
                borderColor: `${THEME.colors.failed}30`,
                color: THEME.colors.failed,
              }}
            >
              <span className="flex items-center gap-2">
                <TrendingDown
                  size={14}
                  style={{ color: THEME.colors.failed }}
                  className="shrink-0"
                />
                {regressionsCount}{" "}
                {regressionsCount > 1
                  ? "tests en régression"
                  : "test en régression"}
              </span>
            </div>
          )}
          {addedCount > 0 && (
            <div
              data-testid="delta-added"
              className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold"
              style={{
                backgroundColor: `${THEME.colors.blue}12`,
                borderColor: `${THEME.colors.blue}30`,
                color: THEME.colors.blue,
              }}
            >
              <span className="flex items-center gap-2">
                <PlusCircle
                  size={14}
                  style={{ color: THEME.colors.blue }}
                  className="shrink-0"
                />
                {addedCount}{" "}
                {addedCount > 1 ? "tests en plus" : "test en plus"}
              </span>
            </div>
          )}
          {removedCount > 0 && (
            <div
              data-testid="delta-removed"
              className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold"
              style={{
                backgroundColor: `${THEME.colors.skipped}15`,
                borderColor: `${THEME.colors.skipped}35`,
                color: THEME.colors.slate[500],
              }}
            >
              <span className="flex items-center gap-2">
                <MinusCircle
                  size={14}
                  style={{ color: THEME.colors.skipped }}
                  className="shrink-0"
                />
                {removedCount}{" "}
                {removedCount > 1 ? "tests en moins" : "test en moins"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
        <span>Voir le comparatif</span>
        <ArrowRight
          size={12}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </Link>
  );
}
