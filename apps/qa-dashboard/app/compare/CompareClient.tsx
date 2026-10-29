"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import {
  GitCompare,
  ArrowRight,
  PlusCircle,
  MinusCircle,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CircleSlash,
  X,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { RunData, RunStats, THEME, setStoredProject } from "../../lib/utils";
import ProjectSelector, {
  PROJECTS_CONFIG,
} from "../../components/ProjectSelector";

interface CompareClientProps {
  history: RunData[];
}

interface RunSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: RunData[];
  placeholder: string;
  disabledValue?: string;
  disabledLabel?: string;
}

function RunSelector({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabledValue,
  disabledLabel,
}: RunSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedRun = useMemo(
    () => options.find((r) => r.id === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((r) =>
      r.id.toLowerCase().includes(search.toLowerCase()),
    );
  }, [options, search]);

  const formatRunDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString("fr-FR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getRunStatusIcon = (run: RunData) => {
    const unexpectedCount = run.stats
      ? run.stats.unexpected
      : run.tests.filter(
          (t) => t.status === "failed" || t.status === "unexpected",
        ).length;

    if (unexpectedCount === 0) {
      return (
        <CheckCircle2
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: THEME.colors.passed }}
        />
      );
    }
    return (
      <XCircle
        className="w-3.5 h-3.5 flex-shrink-0"
        style={{ color: THEME.colors.failed }}
      />
    );
  };

  // Fermer le menu déroulant lors d'un clic en dehors
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const containerClass = `run-select-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;
      if (!target.closest(`.${containerClass}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen, label]);

  const safeContainerClass = `run-select-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  return (
    <div
      className={`relative flex flex-col gap-1 w-full ${safeContainerClass}`}
    >
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
        {label}
      </label>

      {/* Trigger Button - Harmonized with History Filter Inputs */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 focus:border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all outline-none"
      >
        {selectedRun ? (
          <div className="flex items-center justify-between flex-grow overflow-hidden mr-2">
            <div className="flex items-center gap-2 overflow-hidden">
              {getRunStatusIcon(selectedRun)}
              <span className="truncate font-mono text-xs font-bold text-slate-800">
                {selectedRun.id}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium shrink-0">
                ({formatRunDate(selectedRun.date)})
              </span>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-2 flex items-center justify-center"
              title="Effacer la sélection"
            >
              <X className="w-3 h-3" />
            </span>
          </div>
        ) : (
          <span className="text-slate-400 flex-grow text-left text-xs font-medium">
            {placeholder}
          </span>
        )}
        <span className="text-slate-400 select-none flex-shrink-0 text-[10px]">
          {isOpen ? "▲" : "▼"}
        </span>
      </button>

      {/* Dropdown Options Box */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1.5 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-[350px] overflow-hidden flex flex-col p-2 gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Search Box */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une CI pipeline..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 outline-none flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />

          {/* Options List */}
          <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[280px]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  disabled={run.id === disabledValue}
                  onClick={() => {
                    onChange(run.id);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    run.id === disabledValue
                      ? "opacity-40 cursor-not-allowed bg-slate-50"
                      : value === run.id
                        ? "bg-blue-50 text-blue-600 cursor-pointer font-bold"
                        : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {getRunStatusIcon(run)}
                    <span className="truncate font-mono">{run.id}</span>
                  </div>
                  {run.id === disabledValue ? (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {disabledLabel || "Déjà sélectionné"}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-mono font-medium shrink-0">
                      {formatRunDate(run.date)}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs font-medium text-slate-400">
                Aucun résultat pour &quot;{search}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompareClient({ history }: CompareClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Runs à comparer (CI ou runs locaux si pas de CI)
  const ciHistory = useMemo(() => {
    const hasCi = history.some((run) => run.id.toLowerCase().includes("ci run"));
    return hasCi ? history.filter((run) => run.id.toLowerCase().includes("ci run")) : history;
  }, [history]);

  const selectedProject = searchParams.get("project") || "all";

  // Filtrer l'historique des dropdowns pour n'afficher que les runs contenant des tests du projet sélectionné
  const dropdownHistory = useMemo(() => {
    if (selectedProject === "all") return ciHistory;

    const currentProject = PROJECTS_CONFIG.find(
      (p) => p.id === selectedProject,
    );
    const keywords = currentProject?.keywords || [selectedProject];
    const excludeKeywords = currentProject?.excludeKeywords || [];

    return ciHistory.filter((run) => {
      return run.tests.some(
        (test) =>
          keywords.some((kw) => test.file.toLowerCase().includes(kw)) &&
          !excludeKeywords.some((ekw) => test.file.toLowerCase().includes(ekw)),
      );
    });
  }, [ciHistory, selectedProject]);

  const run1Id = searchParams.get("run1") || "";
  const run2Id = searchParams.get("run2") || "";

  // État local pour les sélecteurs manuels de runs
  const [localRun1, setLocalRun1] = useState(run1Id);
  const [localRun2, setLocalRun2] = useState(run2Id);

  // Mettre à jour l'URL lorsque les sélections de runs ou de projet changent
  const updateUrl = (run1: string, run2: string, project: string) => {
    const params = new URLSearchParams();
    if (run1) params.set("run1", run1);
    if (run2) params.set("run2", run2);
    if (project && project !== "all") {
      params.set("project", project);
      setStoredProject(project);
    } else {
      setStoredProject(null);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleProjectChange = (projectId: string) => {
    updateUrl(localRun1, localRun2, projectId);
  };

  const handleApplyCompare = () => {
    updateUrl(localRun1, localRun2, selectedProject);
  };

  const handleReset = () => {
    setLocalRun1("");
    setLocalRun2("");
    updateUrl("", "", selectedProject);
  };

  // Récupérer les runs bruts sélectionnés
  const rawRun1 = useMemo(
    () => ciHistory.find((r) => r.id === run1Id),
    [ciHistory, run1Id],
  );
  const rawRun2 = useMemo(
    () => ciHistory.find((r) => r.id === run2Id),
    [ciHistory, run2Id],
  );

  // Filtrer les tests et recalculer les statistiques en fonction du projet sélectionné
  const getProcessedRun = useCallback(
    (run: RunData | undefined) => {
      if (!run) return null;
      if (selectedProject === "all") return run;

      const currentProject = PROJECTS_CONFIG.find(
        (p) => p.id === selectedProject,
      );
      const keywords = currentProject?.keywords || [selectedProject];

      const filteredTests = run.tests.filter((test) =>
        keywords.some((kw) => test.file.toLowerCase().includes(kw)),
      );

      const stats: RunStats = {
        total: filteredTests.length,
        expected: filteredTests.filter(
          (t) => t.status === "passed" || t.status === "expected",
        ).length,
        unexpected: filteredTests.filter(
          (t) => t.status === "failed" || t.status === "unexpected",
        ).length,
        skipped: filteredTests.filter((t) => t.status === "skipped").length,
        flaky: filteredTests.filter((t) => t.status === "flaky").length,
        duration: filteredTests.reduce((acc, t) => acc + t.duration, 0),
      };

      return {
        ...run,
        tests: filteredTests,
        stats,
      };
    },
    [selectedProject],
  );

  const runA = useMemo(
    () => getProcessedRun(rawRun1),
    [rawRun1, getProcessedRun],
  );
  const runB = useMemo(
    () => getProcessedRun(rawRun2),
    [rawRun2, getProcessedRun],
  );

  // Analyse et comparaison des tests individuels
  const comparison = useMemo(() => {
    if (!runA || !runB) return null;

    const mapA = new Map(runA.tests.map((t) => [`${t.suite} > ${t.title}`, t]));
    const mapB = new Map(runB.tests.map((t) => [`${t.suite} > ${t.title}`, t]));

    const regressions: {
      suite: string;
      title: string;
      file: string;
      statusA: string;
      statusB: string;
    }[] = [];
    const improvements: {
      suite: string;
      title: string;
      file: string;
      statusA: string;
      statusB: string;
    }[] = [];
    const added: {
      suite: string;
      title: string;
      file: string;
      status: string;
    }[] = [];
    const removed: {
      suite: string;
      title: string;
      file: string;
      status: string;
    }[] = [];

    // 1. Détecter régressions, améliorations et retraits
    runA.tests.forEach((testA) => {
      const key = `${testA.suite} > ${testA.title}`;
      const testB = mapB.get(key);

      if (!testB) {
        removed.push({
          suite: testA.suite,
          title: testA.title,
          file: testA.file,
          status: testA.status,
        });
      } else {
        const isPassedA = testA.status === "passed";
        const isPassedB = testB.status === "passed";

        if (isPassedA && !isPassedB) {
          regressions.push({
            suite: testA.suite,
            title: testA.title,
            file: testA.file,
            statusA: testA.status,
            statusB: testB.status,
          });
        } else if (!isPassedA && isPassedB) {
          improvements.push({
            suite: testA.suite,
            title: testA.title,
            file: testA.file,
            statusA: testA.status,
            statusB: testB.status,
          });
        }
      }
    });

    // 2. Détecter les ajouts
    runB.tests.forEach((testB) => {
      const key = `${testB.suite} > ${testB.title}`;
      if (!mapA.has(key)) {
        added.push({
          suite: testB.suite,
          title: testB.title,
          file: testB.file,
          status: testB.status,
        });
      }
    });

    return { regressions, improvements, added, removed };
  }, [runA, runB]);

  const diffStats = useMemo(() => {
    if (!runA || !runB) return null;
    return {
      total: runB.stats.total - runA.stats.total,
      expected: runB.stats.expected - runA.stats.expected,
      unexpected: runB.stats.unexpected - runA.stats.unexpected,
      flaky: runB.stats.flaky - runA.stats.flaky,
      skipped: runB.stats.skipped - runA.stats.skipped,
    };
  }, [runA, runB]);

  const renderBadge = (
    diff: number,
    type: "success" | "danger" | "neutral" | "flaky",
  ) => {
    if (diff === 0) return null;
    const sign = diff > 0 ? "+" : "";

    let style = {};
    if (type === "success") {
      style = {
        backgroundColor: `${THEME.colors.passed}15`,
        borderColor: `${THEME.colors.passed}30`,
        color: THEME.colors.passed,
      };
    } else if (type === "danger") {
      style = {
        backgroundColor: `${THEME.colors.failed}15`,
        borderColor: `${THEME.colors.failed}30`,
        color: THEME.colors.failed,
      };
    } else if (type === "flaky") {
      style = {
        backgroundColor: `${THEME.colors.flaky}15`,
        borderColor: `${THEME.colors.flaky}30`,
        color: THEME.colors.flaky,
      };
    } else {
      style = {
        backgroundColor: `${THEME.colors.skipped}15`,
        borderColor: `${THEME.colors.skipped}30`,
        color: THEME.colors.skipped,
      };
    }

    return (
      <span
        style={style}
        className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border leading-none"
      >
        {sign}
        {diff}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3 whitespace-nowrap">
              <GitCompare className="text-blue-600 w-6 h-6" />
              Comparaison des Runs
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
          />
        </div>
        {runA && runB && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
              2 exécutions comparées
            </span>
          </div>
        )}
      </div>

      {/* Selecteurs de Runs - Style Harmonisé avec la barre de recherche /history */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <RunSelector
              label="Choisir le run de référence"
              value={localRun1}
              onChange={setLocalRun1}
              options={dropdownHistory}
              placeholder="Sélectionner un run de référence..."
              disabledValue={localRun2}
              disabledLabel="Cible"
            />
          </div>

          <div className="shrink-0 text-slate-300 hidden md:flex items-center justify-center p-2 pt-5">
            <ArrowRight size={16} />
          </div>

          <div className="flex-1 w-full">
            <RunSelector
              label="Choisir le run de comparaison"
              value={localRun2}
              onChange={setLocalRun2}
              options={dropdownHistory}
              placeholder="Sélectionner un run de comparaison..."
              disabledValue={localRun1}
              disabledLabel="Base"
            />
          </div>

          <div className="shrink-0 w-full md:w-auto self-end md:self-end pt-2 md:pt-0 flex items-center gap-2">
            {(localRun1 || localRun2) && (
              <button
                onClick={handleReset}
                className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl text-slate-400 hover:text-slate-600 transition-all hover:bg-slate-50 cursor-pointer"
                title="Réinitialiser"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <button
              onClick={handleApplyCompare}
              disabled={!localRun1 || !localRun2 || localRun1 === localRun2}
              className="w-full md:w-auto px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:hover:bg-blue-600 disabled:cursor-not-allowed rounded-xl text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              Comparer
            </button>
          </div>
        </div>
      </div>

      {/* Affichage des résultats de comparaison */}
      {runA && runB ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Side-by-Side KPIs - Harmonized with Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Total Tests */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tests Totaux
                </span>
                {diffStats && renderBadge(diffStats.total, "neutral")}
              </div>
              <div className="flex items-baseline justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-400 font-mono">
                    {runA.stats.total}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {runB.stats.total}
                  </span>
                </div>
              </div>
            </div>

            {/* Passed Tests */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span
                  style={{ color: THEME.colors.passed }}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  Succès
                </span>
                {diffStats && renderBadge(diffStats.expected, "success")}
              </div>
              <div className="flex items-baseline justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-400 font-mono">
                    {runA.stats.expected}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: THEME.colors.passed }}
                  >
                    {runB.stats.expected}
                  </span>
                </div>
              </div>
            </div>

            {/* Failed Tests */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span
                  style={{ color: THEME.colors.failed }}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  Échecs
                </span>
                {diffStats && renderBadge(diffStats.unexpected, "danger")}
              </div>
              <div className="flex items-baseline justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-400 font-mono">
                    {runA.stats.unexpected}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: THEME.colors.failed }}
                  >
                    {runB.stats.unexpected}
                  </span>
                </div>
              </div>
            </div>

            {/* Flaky Tests */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span
                  style={{ color: THEME.colors.flaky }}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  Instables
                </span>
                {diffStats && renderBadge(diffStats.flaky, "flaky")}
              </div>
              <div className="flex items-baseline justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-400 font-mono">
                    {runA.stats.flaky}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: THEME.colors.flaky }}
                  >
                    {runB.stats.flaky}
                  </span>
                </div>
              </div>
            </div>

            {/* Skipped Tests */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span
                  style={{ color: THEME.colors.skipped }}
                  className="text-[10px] font-bold uppercase tracking-wider"
                >
                  Ignorés
                </span>
                {diffStats && renderBadge(diffStats.skipped, "neutral")}
              </div>
              <div className="flex items-baseline justify-between mt-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-bold text-slate-400 font-mono">
                    {runA.stats.skipped}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                  <span
                    className="text-xl font-bold font-mono"
                    style={{ color: THEME.colors.skipped }}
                  >
                    {runB.stats.skipped}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Analyse Détaillée des Différences - Harmonized with Dashboard */}
          {comparison && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Régressions */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div
                  style={{ backgroundColor: `${THEME.colors.failed}08` }}
                  className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <TrendingDown
                      style={{ color: THEME.colors.failed }}
                      className="w-4 h-4"
                    />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      TESTS EN RÉGRESSION ({comparison.regressions.length})
                    </h3>
                  </div>
                  <span
                    style={{
                      backgroundColor: `${THEME.colors.failed}15`,
                      borderColor: `${THEME.colors.failed}30`,
                      color: THEME.colors.failed,
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  >
                    Alerte
                  </span>
                </div>
                <div className="p-4 sm:p-5 flex-grow overflow-y-auto max-h-[400px]">
                  {comparison.regressions.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.regressions.map((reg, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: `${THEME.colors.failed}04`,
                            borderColor: `${THEME.colors.failed}15`,
                          }}
                          className="flex flex-col p-3.5 rounded-xl border gap-1 hover:border-rose-300 transition-colors"
                        >
                          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                            {reg.suite}
                          </p>
                          <Link
                            href={`/details?id=${encodeURIComponent(runB.id)}&test=${encodeURIComponent(reg.title)}${selectedProject !== "all" ? `&project=${encodeURIComponent(selectedProject)}` : ""}`}
                            className="text-xs font-bold text-slate-800 hover:text-blue-600 hover:underline transition-colors flex items-center gap-1.5 group cursor-pointer"
                            title="Ouvrir le détail de ce test dans le run cible"
                          >
                            <span>{reg.title}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-10 gap-2.5">
                      <div
                        style={{
                          backgroundColor: `${THEME.colors.passed}15`,
                          color: THEME.colors.passed,
                        }}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-500">
                        Aucun test en régression.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Améliorations */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div
                  style={{ backgroundColor: `${THEME.colors.passed}08` }}
                  className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp
                      style={{ color: THEME.colors.passed }}
                      className="w-4 h-4"
                    />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      TESTS REPASSÉS AU VERT ({comparison.improvements.length})
                    </h3>
                  </div>
                  <span
                    style={{
                      backgroundColor: `${THEME.colors.passed}15`,
                      borderColor: `${THEME.colors.passed}30`,
                      color: THEME.colors.passed,
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                  >
                    Succès
                  </span>
                </div>
                <div className="p-4 sm:p-5 flex-grow overflow-y-auto max-h-[400px]">
                  {comparison.improvements.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.improvements.map((imp, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: `${THEME.colors.passed}04`,
                            borderColor: `${THEME.colors.passed}15`,
                          }}
                          className="flex flex-col p-3.5 rounded-xl border gap-1 hover:border-emerald-300 transition-colors"
                        >
                          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                            {imp.suite}
                          </p>
                          <h4 className="text-xs font-bold text-slate-800">
                            {imp.title}
                          </h4>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-10 gap-2 text-slate-400">
                      <TrendingUp size={20} />
                      <p className="text-xs font-bold text-slate-500">
                        Aucun test repassé au vert.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nouveaux Tests */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div
                  style={{ backgroundColor: `${THEME.colors.blue}08` }}
                  className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <PlusCircle
                      style={{ color: THEME.colors.blue }}
                      className="w-4 h-4"
                    />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      TESTS EN PLUS ({comparison.added.length})
                    </h3>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-grow overflow-y-auto max-h-[400px]">
                  {comparison.added.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.added.map((add, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: `${THEME.colors.blue}04`,
                            borderColor: `${THEME.colors.blue}15`,
                          }}
                          className="flex flex-col p-3.5 rounded-xl border gap-1 hover:border-blue-300 transition-colors"
                        >
                          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                            {add.suite}
                          </p>
                          <h4 className="text-xs font-bold text-slate-800">
                            {add.title}
                          </h4>
                          <span
                            style={{
                              backgroundColor:
                                add.status === "passed"
                                  ? `${THEME.colors.passed}15`
                                  : `${THEME.colors.failed}15`,
                              color:
                                add.status === "passed"
                                  ? THEME.colors.passed
                                  : THEME.colors.failed,
                              borderColor:
                                add.status === "passed"
                                  ? `${THEME.colors.passed}30`
                                  : `${THEME.colors.failed}30`,
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border self-start mt-1.5"
                          >
                            Statut : {add.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-10 gap-2 text-slate-400">
                      <PlusCircle size={20} />
                      <p className="text-xs font-bold text-slate-500">
                        Aucun test en plus détecté.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tests Retirés */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[300px]">
                <div
                  style={{ backgroundColor: `${THEME.colors.skipped}08` }}
                  className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <MinusCircle
                      style={{ color: THEME.colors.skipped }}
                      className="w-4 h-4"
                    />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      TESTS EN MOINS ({comparison.removed.length})
                    </h3>
                  </div>
                </div>
                <div className="p-4 sm:p-5 flex-grow overflow-y-auto max-h-[400px]">
                  {comparison.removed.length > 0 ? (
                    <div className="space-y-3">
                      {comparison.removed.map((rem, index) => (
                        <div
                          key={index}
                          style={{
                            backgroundColor: `${THEME.colors.skipped}04`,
                            borderColor: `${THEME.colors.skipped}15`,
                          }}
                          className="flex flex-col p-3.5 rounded-xl border gap-1 hover:border-slate-300 transition-colors"
                        >
                          <p className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                            {rem.suite}
                          </p>
                          <h4 className="text-xs font-bold text-slate-800">
                            {rem.title}
                          </h4>
                          <span
                            style={{
                              backgroundColor:
                                rem.status === "passed"
                                  ? `${THEME.colors.passed}15`
                                  : `${THEME.colors.failed}15`,
                              color:
                                rem.status === "passed"
                                  ? THEME.colors.passed
                                  : THEME.colors.failed,
                              borderColor:
                                rem.status === "passed"
                                  ? `${THEME.colors.passed}30`
                                  : `${THEME.colors.failed}30`,
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border self-start mt-1.5"
                          >
                            Ancien statut : {rem.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-10 gap-2 text-slate-400">
                      <MinusCircle size={20} />
                      <p className="text-xs font-bold text-slate-500">
                        Aucun test en moins.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[350px]">
          <CircleSlash size={36} className="text-slate-300 mb-3" />
          <p className="text-sm font-bold text-slate-800 mb-1.5 uppercase tracking-tight">
            En attente de comparaison
          </p>
          <p className="text-slate-400 text-xs max-w-md font-medium leading-relaxed">
            Sélectionnez deux runs de la CI différents ci-dessus ou depuis la
            page Historique pour comparer leurs résultats, régressions et
            améliorations de manière détaillée.
          </p>
        </div>
      )}
    </div>
  );
}
