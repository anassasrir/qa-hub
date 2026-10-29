"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CircleSlash,
  XCircle,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { THEME, TestResult } from "../lib/utils";

interface TestCase {
  title: string;
  status: string;
  results?: TestResult[];
}

interface Props {
  tests: TestCase[];
  runId: string;
}

export default function FlakinessRadar({ tests, runId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // On compte les tests dont le statut est flaky (identique au filtre de la page /details)
  const allFlakyTests = tests
    .filter((t) => t.status === "flaky")
    .map((t) => ({
      title: t.title,
      attempts: t.results ? t.results.length : 1,
      status: t.status,
    }))
    .sort((a, b) => b.attempts - a.attempts);

  const totalFlaky = allFlakyTests.length;
  const flakyTests = allFlakyTests.slice(0, 5);

  const hasFailedTests = tests.some(
    (t) => t.status === "failed" || t.status === "unexpected",
  );

  const handleTestClick = (testTitle: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", runId);
    params.set("status", "flaky");
    params.set("test", testTitle);
    router.push(`/details?${params.toString()}`);
  };

  const handleCardClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", runId);
    params.set("status", "flaky");
    router.push(`/details?${params.toString()}`);
  };

  const headerIconStyle =
    totalFlaky === 0
      ? {
          backgroundColor: `${THEME.colors.passed}15`,
          color: THEME.colors.passed,
        }
      : {
          backgroundColor: `${THEME.colors.flaky}15`,
          color: THEME.colors.flaky,
        };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all h-[350px] flex flex-col justify-between group cursor-pointer"
      title="Voir les détails des scénarios instables"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors"
            style={headerIconStyle}
          >
            <AlertCircle size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 leading-tight">
              Radar d&apos;instabilité
            </h3>
            <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">
              {totalFlaky === 0
                ? "0 test instable"
                : `${totalFlaky} ${
                    totalFlaky > 1 ? "tests instables" : "test instable"
                  }`}
            </p>
          </div>
        </div>
        <ArrowUpRight
          size={14}
          className="text-slate-300 group-hover:text-blue-600 transition-colors"
        />
      </div>

      {/* Body */}
      {tests.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center text-center py-3 px-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
            style={{
              backgroundColor: `${THEME.colors.slate[100]}`,
              color: THEME.colors.slate[400],
            }}
          >
            <CircleSlash size={20} />
          </div>
          <p className="text-sm font-bold text-slate-700">Aucune donnée</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Aucun test pour ce projet
          </p>
        </div>
      ) : flakyTests.length > 0 ? (
        <div className="my-auto flex flex-col gap-2 py-2 overflow-y-auto max-h-[220px]">
          {flakyTests.map((test, i) => (
            <div
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                handleTestClick(test.title);
              }}
              className="flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold transition-all hover:brightness-95 cursor-pointer"
              style={{
                backgroundColor: `${THEME.colors.flaky}12`,
                borderColor: `${THEME.colors.flaky}30`,
                color: THEME.colors.flaky,
              }}
            >
              <span className="flex items-center gap-2 min-w-0 mr-2 truncate">
                <AlertCircle
                  size={14}
                  style={{ color: THEME.colors.flaky }}
                  className="shrink-0"
                />
                <span className="truncate">
                  {test.title.replace(/@[\w-]+/g, "").trim()}
                </span>
              </span>
              <ChevronRight
                size={13}
                style={{ color: THEME.colors.flaky }}
                className="shrink-0"
              />
            </div>
          ))}
        </div>
      ) : hasFailedTests ? (
        <div className="my-auto flex flex-col items-center justify-center text-center py-3 px-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
            style={{
              backgroundColor: `${THEME.colors.failed}15`,
              color: THEME.colors.failed,
            }}
          >
            <XCircle size={20} />
          </div>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            Pas d&apos;instabilité
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Des échecs sont présents
          </p>
        </div>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center text-center py-3 px-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-2.5"
            style={{
              backgroundColor: `${THEME.colors.passed}15`,
              color: THEME.colors.passed,
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <p className="text-sm font-bold text-slate-800 leading-snug">
            Tout est au vert
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Aucun test instable détecté
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
        <span>Voir les détails des instabilités</span>
        <ArrowRight
          size={12}
          className="group-hover:translate-x-0.5 transition-transform"
        />
      </div>
    </div>
  );
}
