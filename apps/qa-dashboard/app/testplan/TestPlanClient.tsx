"use client";

import React, { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ChevronRight,
  ChevronDown,
  FileCode,
  Layers,
  BookOpen,
  X,
  CircleSlash,
  ListTree,
  Zap,
  Activity,
  Tag,
  Plus,
  Minus,
  FolderOpen,
  Folder,
  CheckCircle2,
  XCircle,
  ArrowRightToLine,
  ExternalLink,
} from "lucide-react";
import {
  TestSuite,
  TestCase,
  THEME,
  RunData,
  consolidateTestSuites,
} from "../../lib/utils";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams } from "next/navigation";
import ProjectSelector, {
  PROJECTS_CONFIG,
} from "../../components/ProjectSelector";

export const getAutomationColor = (percentage: number) => {
  if (percentage === 0) return THEME.colors.failed;
  if (percentage === 100) return THEME.colors.passed;
  return THEME.colors.flaky;
};

const getRunStatusColor = (status?: string) => {
  switch (status) {
    case "passed":
    case "expected":
      return THEME.colors.passed;
    case "failed":
    case "unexpected":
      return THEME.colors.failed;
    case "flaky":
      return THEME.colors.flaky;
    case "skipped":
      return THEME.colors.skipped;
    default:
      return THEME.colors.slate[400];
  }
};

interface Props {
  initialTestPlan: TestSuite[];
  allRuns?: RunData[];
}

export default function TestPlanClient({ initialTestPlan, allRuns = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get("project") || "all";
  const testTitle = searchParams.get("test") || "";
  const filePath = searchParams.get("file") || "";

  return (
    <TestPlanInternal
      key={`${currentProject}-${testTitle}-${filePath}`}
      initialTestPlan={initialTestPlan}
      allRuns={allRuns}
      currentProject={currentProject}
      router={router}
      searchParams={searchParams}
    />
  );
}

function TestPlanInternal({
  initialTestPlan,
  allRuns,
  currentProject,
  router,
  searchParams,
}: {
  initialTestPlan: TestSuite[];
  allRuns: RunData[];
  currentProject: string;
  router: AppRouterInstance;
  searchParams: ReadonlyURLSearchParams;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const consolidatedTestPlan = useMemo(() => {
    return consolidateTestSuites(initialTestPlan);
  }, [initialTestPlan]);

  // Initial selection derived from URL
  const initialSelection = (() => {
    const testTitle = searchParams.get("test");
    const filePath = searchParams.get("file");

    if (testTitle) {
      const config =
        currentProject !== "all"
          ? PROJECTS_CONFIG.find((p) => p.id === currentProject)
          : null;

      for (const suite of consolidatedTestPlan) {
        if (
          config?.keywords &&
          !config.keywords.some((kw) => suite.file.toLowerCase().includes(kw))
        ) {
          continue;
        }

        const matchesFile =
          !filePath ||
          suite.file === filePath ||
          suite.testCases.some(
            (t) => t.file === filePath || t.file.endsWith(filePath),
          );

        if (matchesFile) {
          let tc =
            suite.testCases.find(
              (t) =>
                t.title === testTitle &&
                (!filePath || t.file === filePath || t.file.endsWith(filePath)),
            ) || suite.testCases.find((t) => t.title === testTitle);
          if (!tc) {
            tc = suite.testCases.find((t) => {
              if (!t.title.includes("${")) return false;
              const pattern = t.title
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
                .replace(/\\\{\\\$\\\.[^}]+\\\}/g, ".*")
                .replace(/\\\$\\\{[^}]+\\\}/g, ".*");
              return new RegExp(`^${pattern}$`).test(testTitle);
            });
          }
          if (tc) return { suiteId: suite.id, tc };
        }
      }
    }
    return null;
  })();

  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(
    initialSelection?.suiteId || null,
  );
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(
    initialSelection?.tc || null,
  );

  // Par défaut, tous les dossiers du worktree sont FERMÉS (sauf si un test est ciblé via l'URL)
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(() =>
    initialSelection?.suiteId ? new Set([initialSelection.suiteId]) : new Set(),
  );

  const [prevProject, setPrevProject] = useState(currentProject);
  if (prevProject !== currentProject) {
    setPrevProject(currentProject);
    setSelectedTestCase(null);
    setSelectedSuiteId(null);
    setExpandedSuites(new Set());
  }

  // Déterminer le dernier run correspondant au projet sélectionné
  const latestRun = useMemo(() => {
    if (!allRuns || allRuns.length === 0) return null;
    if (currentProject === "all") return allRuns[0];

    const config = PROJECTS_CONFIG.find((p) => p.id === currentProject);
    const targetKeywords = config?.keywords || [currentProject];

    const runWithData = allRuns.find((run) =>
      run.tests.some((t) => {
        const fileLower = (t.file || "").toLowerCase();
        return targetKeywords.some((kw) => fileLower.includes(kw));
      }),
    );

    return runWithData || allRuns[0];
  }, [allRuns, currentProject]);

  // Carte titre de test -> statut dans le dernier run
  const runTestStatusMap = useMemo(() => {
    const map = new Map<string, { status: string; runId: string }>();
    if (!latestRun) return map;

    latestRun.tests.forEach((t) => {
      const cleanTitle = t.title.replace(/@[\w-]+/g, "").trim().toLowerCase();
      let status = t.status?.toLowerCase();
      if (status === "expected") status = "passed";
      if (status === "unexpected") status = "failed";
      map.set(cleanTitle, { status: status || "unknown", runId: latestRun.id });
    });
    return map;
  }, [latestRun]);

  // Métriques de résultat du dernier run pour la barre de statut
  const latestRunStats = useMemo(() => {
    if (!latestRun) return null;

    const config = PROJECTS_CONFIG.find((p) => p.id === currentProject);
    const targetKeywords = config?.keywords || [];

    const tests =
      currentProject === "all" || targetKeywords.length === 0
        ? latestRun.tests
        : latestRun.tests.filter((t) => {
            const fileLower = (t.file || "").toLowerCase();
            return targetKeywords.some((kw) => fileLower.includes(kw));
          });

    const passed = tests.filter(
      (t) => t.status === "passed" || t.status === "expected",
    ).length;
    const failed = tests.filter(
      (t) => t.status === "failed" || t.status === "unexpected",
    ).length;
    const flaky = tests.filter((t) => t.status === "flaky").length;
    const skipped = tests.filter((t) => t.status === "skipped").length;
    const total = tests.length;

    if (total === 0) return null;

    return {
      runId: latestRun.id,
      date: latestRun.date,
      passed,
      failed,
      flaky,
      skipped,
      total,
      passedPct: (passed / total) * 100,
      failedPct: (failed / total) * 100,
      flakyPct: (flaky / total) * 100,
      skippedPct: (skipped / total) * 100,
    };
  }, [latestRun, currentProject]);

  const handleProjectChange = (projectId: string) => {
    setSelectedTestCase(null);
    setSelectedSuiteId(null);
    setExpandedSuites(new Set());
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", projectId);
    params.delete("test");
    params.delete("file");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleTestCaseClick = (tc: TestCase, suiteId: string) => {
    setSelectedSuiteId(suiteId);
    if (selectedTestCase?.id === tc.id) {
      setSelectedTestCase(null);
    } else {
      setSelectedTestCase(tc);
    }
  };

  const toggleSuite = (suiteId: string) => {
    setSelectedSuiteId(suiteId);
    setExpandedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) {
        next.delete(suiteId);
      } else {
        next.add(suiteId);
      }
      return next;
    });
  };

  const filteredSuites = useMemo(() => {
    let suites = consolidatedTestPlan;
    if (currentProject !== "all") {
      const config = PROJECTS_CONFIG.find((p) => p.id === currentProject);
      if (config && config.keywords) {
        suites = consolidatedTestPlan.filter((suite) =>
          config.keywords!.some((kw) => suite.file.toLowerCase().includes(kw)),
        );
      }
    }

    if (searchTerm) {
      suites = suites.filter(
        (suite) =>
          suite.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          suite.testCases.some(
            (tc) =>
              tc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              tc.tags?.some((t) =>
                t.toLowerCase().includes(searchTerm.toLowerCase()),
              ),
          ),
      );
    }

    return suites;
  }, [consolidatedTestPlan, currentProject, searchTerm]);

  const activeSuite = useMemo(() => {
    if (!selectedTestCase) return null;
    return (
      filteredSuites.find((s) =>
        s.testCases.some((t) => t.id === selectedTestCase.id),
      ) ||
      filteredSuites.find((s) => s.id === selectedSuiteId) ||
      null
    );
  }, [filteredSuites, selectedTestCase, selectedSuiteId]);

  const totalTests = useMemo(() => {
    return filteredSuites.reduce((acc, s) => acc + s.testCases.length, 0);
  }, [filteredSuites]);

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto font-sans text-slate-900">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <BookOpen className="text-blue-600 w-6 h-6" />
              Plan de Test
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={currentProject}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
            {filteredSuites.length} fonctionnalité
            {filteredSuites.length > 1 ? "s" : ""} &bull; {totalTests} tests
          </span>
        </div>
      </div>

      {/* Barre de résultat du dernier run (Inspiré Xray / Jira) */}
      {latestRunStats && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Dernier résultat d&apos;exécution :
              </span>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {latestRunStats.runId}
              </span>
              <span className="text-slate-300 hidden sm:inline">&bull;</span>
              <span className="text-[10px] font-mono text-slate-400">
                {latestRunStats.date}
              </span>
            </div>

            {/* Légende / Métriques avec les couleurs THEME */}
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold font-mono">
              <div
                className="flex items-center gap-1.5"
                style={{ color: THEME.colors.passed }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: THEME.colors.passed }}
                ></span>
                <span>
                  {latestRunStats.passed} Réussis ({Math.round(latestRunStats.passedPct)}%)
                </span>
              </div>
              {latestRunStats.failed > 0 && (
                <div
                  className="flex items-center gap-1.5"
                  style={{ color: THEME.colors.failed }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: THEME.colors.failed }}
                  ></span>
                  <span>
                    {latestRunStats.failed} Échecs ({Math.round(latestRunStats.failedPct)}%)
                  </span>
                </div>
              )}
              {latestRunStats.flaky > 0 && (
                <div
                  className="flex items-center gap-1.5"
                  style={{ color: THEME.colors.flaky }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: THEME.colors.flaky }}
                  ></span>
                  <span>
                    {latestRunStats.flaky} Instables ({Math.round(latestRunStats.flakyPct)}%)
                  </span>
                </div>
              )}
              {latestRunStats.skipped > 0 && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  <span>
                    {latestRunStats.skipped} Ignorés ({Math.round(latestRunStats.skippedPct)}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-100 shadow-inner">
            {latestRunStats.passedPct > 0 && (
              <div
                style={{
                  width: `${latestRunStats.passedPct}%`,
                  backgroundColor: THEME.colors.passed,
                }}
                className="h-full transition-all duration-500"
                title={`${latestRunStats.passed} réussis (${Math.round(latestRunStats.passedPct)}%)`}
              />
            )}
            {latestRunStats.flakyPct > 0 && (
              <div
                style={{
                  width: `${latestRunStats.flakyPct}%`,
                  backgroundColor: THEME.colors.flaky,
                }}
                className="h-full transition-all duration-500"
                title={`${latestRunStats.flaky} instables (${Math.round(latestRunStats.flakyPct)}%)`}
              />
            )}
            {latestRunStats.failedPct > 0 && (
              <div
                style={{
                  width: `${latestRunStats.failedPct}%`,
                  backgroundColor: THEME.colors.failed,
                }}
                className="h-full transition-all duration-500"
                title={`${latestRunStats.failed} échecs (${Math.round(latestRunStats.failedPct)}%)`}
              />
            )}
            {latestRunStats.skippedPct > 0 && (
              <div
                style={{
                  width: `${latestRunStats.skippedPct}%`,
                  backgroundColor: THEME.colors.skipped,
                }}
                className="h-full transition-all duration-500"
                title={`${latestRunStats.skipped} ignorés (${Math.round(latestRunStats.skippedPct)}%)`}
              />
            )}
          </div>
        </div>
      )}

      {/* Worktree Layout: Left Tree View | Right Steps Details */}
      <div className="flex flex-col lg:flex-row gap-6 min-h-[650px] items-start w-full">
        {/* Left Panel: Worktree of Features and Tests */}
        <div className="w-full lg:w-[42%] xl:w-[38%] shrink-0 min-w-0 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Worktree Header */}
          <div className="p-4 sm:p-5 bg-slate-50/40 border-b border-slate-100 flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() =>
                    setExpandedSuites(new Set(filteredSuites.map((s) => s.id)))
                  }
                  title="Tout déplier"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => setExpandedSuites(new Set())}
                  title="Tout plier"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Minus size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="text-blue-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight truncate">
                  Arborescence des Tests
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono shrink-0">
              {filteredSuites.length} fonct.
            </span>
          </div>

          {/* Recherche au dessus des dossiers de tests dans l'arborescence */}
          <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-100 bg-white">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Rechercher une fonction ou un test..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-7 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-200 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Worktree Content */}
          <div className="p-3 sm:p-4 divide-y divide-slate-100/60 max-h-[720px] overflow-y-auto space-y-2">
            {filteredSuites.map((suite) => {
              const isExpanded = expandedSuites.has(suite.id);
              const isSuiteActive = activeSuite?.id === suite.id;

              return (
                <div key={suite.id} className="pt-1.5 first:pt-0">
                  {/* Feature Node in Tree */}
                  <div
                    onClick={() => toggleSuite(suite.id)}
                    className={`group w-full px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer gap-2 ${
                      isSuiteActive
                        ? "bg-slate-100/80 font-bold"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSuite(suite.id);
                        }}
                        title={isExpanded ? "Replier la suite" : "Déplier la suite"}
                        className="text-slate-400 group-hover:text-blue-600 hover:bg-slate-200/60 rounded p-0.5 transition-colors shrink-0 cursor-pointer"
                      >
                        {isExpanded ? (
                          <ChevronDown size={13} className="text-blue-600" />
                        ) : (
                          <ChevronRight size={13} />
                        )}
                      </span>
                      <div className="text-blue-600 shrink-0">
                        {isExpanded ? (
                          <FolderOpen size={14} />
                        ) : (
                          <Folder size={14} />
                        )}
                      </div>
                      <span
                        className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate"
                        title={suite.title}
                      >
                        {suite.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {suite.automatedCount !== undefined && (() => {
                        const pct =
                          suite.testCases.length > 0
                            ? Math.round(
                                ((suite.automatedCount || 0) /
                                  suite.testCases.length) *
                                  100,
                              )
                            : 0;
                        const color = getAutomationColor(pct);
                        return (
                          <span
                            style={{
                              color: color,
                              backgroundColor: `${color}15`,
                              borderColor: `${color}35`,
                            }}
                            className="text-[9px] font-bold font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border"
                          >
                            {pct}%
                          </span>
                        );
                      })()}
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {suite.testCases.length}
                      </span>
                    </div>
                  </div>

                  {/* Test Cases Nested Under Feature (Only rendered when expanded) */}
                  {isExpanded && (
                    <div className="mt-1 ml-5 pl-2.5 border-l-2 border-slate-100 space-y-1">
                      {suite.testCases.map((tc) => {
                        const isSelected = selectedTestCase?.id === tc.id;
                        const cleanTcTitle = tc.title
                          .replace(/@[\w-]+/g, "")
                          .trim()
                          .toLowerCase();
                        const execution = runTestStatusMap.get(cleanTcTitle);

                        return (
                          <div
                            key={tc.id}
                            onClick={() => handleTestCaseClick(tc, suite.id)}
                            className={`w-full px-2.5 py-1.5 rounded-lg transition-all flex items-start justify-between cursor-pointer gap-2 group/tc ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                                : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-start gap-2 min-w-0 flex-1">
                              <div className="pt-0.5 shrink-0">
                                {tc.automated ? (
                                  <div
                                    style={{
                                      color: THEME.colors.passed,
                                      backgroundColor: `${THEME.colors.passed}15`,
                                      borderColor: `${THEME.colors.passed}35`,
                                    }}
                                    className="w-3.5 h-3.5 rounded flex items-center justify-center border shadow-2xs"
                                  >
                                    <Zap size={8} fill="currentColor" />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      color: THEME.colors.skipped,
                                      backgroundColor: `${THEME.colors.skipped}15`,
                                      borderColor: `${THEME.colors.skipped}30`,
                                    }}
                                    className="w-3.5 h-3.5 rounded flex items-center justify-center border"
                                  >
                                    <Activity size={8} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`text-xs font-medium leading-snug break-words [overflow-wrap:anywhere] transition-colors ${
                                    isSelected
                                      ? "text-blue-700 font-bold"
                                      : "text-slate-700 group-hover/tc:text-blue-600"
                                  }`}
                                >
                                  {tc.title}
                                </p>
                                {tc.tags && tc.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {tc.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-[8px] font-bold uppercase bg-blue-50 text-blue-600 px-1 py-0.2 rounded border border-blue-100 flex items-center gap-0.5"
                                      >
                                        <Tag size={7} />
                                        {tag.replace("@", "")}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                              {/* Statut d'exécution du dernier run (Style Xray) */}
                              {execution && (
                                <span
                                  style={{
                                    color: getRunStatusColor(execution.status),
                                    backgroundColor: `${getRunStatusColor(execution.status)}15`,
                                    borderColor: `${getRunStatusColor(execution.status)}35`,
                                  }}
                                  className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border font-mono"
                                >
                                  {execution.status === "passed"
                                    ? "PASS"
                                    : execution.status === "failed"
                                      ? "FAIL"
                                      : execution.status === "flaky"
                                        ? "FLAKY"
                                        : "SKIP"}
                                </span>
                              )}
                              <span className="text-[9px] font-bold font-mono text-slate-400">
                                {tc.steps.length} ét.
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredSuites.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-400 italic">
                  {currentProject === "all"
                    ? "Aucun projet sélectionné"
                    : "Aucun test automatisé pour ce projet"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Steps of the Selected Test */}
        <div className="flex-1 w-full min-w-0">
          {selectedTestCase ? (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden flex flex-col sticky top-24 w-full animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Steps Header */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-100 flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  {activeSuite && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      <Folder size={11} className="text-blue-500" />
                      <span className="truncate">{activeSuite.title}</span>
                      <span>&bull;</span>
                      <span className="font-mono">{selectedTestCase.file}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 min-w-0">
                    {selectedTestCase.automated ? (
                      <div
                        style={{
                          color: THEME.colors.passed,
                          backgroundColor: `${THEME.colors.passed}15`,
                          borderColor: `${THEME.colors.passed}35`,
                        }}
                        className="w-5 h-5 rounded-md flex items-center justify-center shadow-sm border shrink-0"
                      >
                        <Zap size={11} fill="currentColor" />
                      </div>
                    ) : (
                      <div
                        style={{
                          color: THEME.colors.skipped,
                          backgroundColor: `${THEME.colors.skipped}15`,
                          borderColor: `${THEME.colors.skipped}30`,
                        }}
                        className="w-5 h-5 rounded-md flex items-center justify-center border shrink-0"
                      >
                        <Activity size={11} />
                      </div>
                    )}
                    <h2
                      className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words [overflow-wrap:anywhere] flex-1 min-w-0"
                      title={selectedTestCase.title}
                    >
                      {selectedTestCase.title}
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                    {/* Execution status in latest run */}
                    {(() => {
                      const cleanTitle = selectedTestCase.title
                        .replace(/@[\w-]+/g, "")
                        .trim()
                        .toLowerCase();
                      const exec = runTestStatusMap.get(cleanTitle);
                      if (exec) {
                        const color = getRunStatusColor(exec.status);
                        return (
                          <Link
                            href={`/details?id=${encodeURIComponent(exec.runId)}&test=${encodeURIComponent(selectedTestCase.title)}`}
                            style={{
                              color: color,
                              backgroundColor: `${color}15`,
                              borderColor: `${color}35`,
                            }}
                            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border font-mono flex items-center gap-1 hover:opacity-80 transition-opacity"
                            title="Voir les détails dans le rapport d'exécution"
                          >
                            {exec.status === "passed" && (
                              <CheckCircle2 size={11} />
                            )}
                            {exec.status === "failed" && <XCircle size={11} />}
                            {exec.status === "flaky" && (
                              <CircleSlash size={11} />
                            )}
                            {exec.status === "skipped" && (
                              <ArrowRightToLine size={11} />
                            )}
                            <span>Dernier run : {exec.status.toUpperCase()}</span>
                            <ExternalLink size={9} />
                          </Link>
                        );
                      }
                      return null;
                    })()}

                    <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1 font-mono">
                      <ListTree size={11} className="text-blue-500" />
                      {selectedTestCase.steps.length} étape
                      {selectedTestCase.steps.length > 1 ? "s" : ""}
                    </span>

                    {selectedTestCase.automated ? (
                      <span
                        style={{
                          color: THEME.colors.passed,
                          backgroundColor: `${THEME.colors.passed}15`,
                          borderColor: `${THEME.colors.passed}35`,
                        }}
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
                      >
                        Automatisé
                      </span>
                    ) : (
                      <span
                        style={{
                          color: THEME.colors.skipped,
                          backgroundColor: `${THEME.colors.skipped}15`,
                          borderColor: `${THEME.colors.skipped}35`,
                        }}
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border"
                      >
                        Manuel
                      </span>
                    )}

                    {selectedTestCase.tags &&
                      selectedTestCase.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {selectedTestCase.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] font-bold uppercase bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-0.5"
                            >
                              <Tag size={7} />
                              {tag.replace("@", "")}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTestCase(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 transition-all cursor-pointer shrink-0"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Steps Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[620px]">
                <div className="flex items-center gap-2 text-slate-400 pb-2.5 border-b border-slate-100 min-w-0">
                  <FileCode size={13} className="text-blue-500 shrink-0" />
                  <span
                    className="text-[10px] font-medium font-mono text-slate-500 truncate min-w-0 flex-1"
                    title={selectedTestCase.file}
                  >
                    {selectedTestCase.file}
                  </span>
                </div>

                <div className="space-y-3 min-w-0">
                  {selectedTestCase.steps.map((step, index) => (
                    <div
                      key={index}
                      className="flex gap-3 min-w-0 items-start group"
                    >
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center text-[9px] font-bold shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {index + 1}
                        </div>
                        {index < selectedTestCase.steps.length - 1 && (
                          <div className="w-px h-full bg-slate-100 my-1 group-hover:bg-blue-100 transition-colors"></div>
                        )}
                      </div>
                      <div className="pt-0.5 flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors leading-relaxed break-words [overflow-wrap:anywhere]">
                          {step.title}
                        </p>
                      </div>
                    </div>
                  ))}

                  {selectedTestCase.steps.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-14 text-center space-y-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <CircleSlash size={20} className="text-slate-300" />
                      <p className="text-xs text-slate-400 font-semibold italic px-6">
                        Aucune étape détaillée n&apos;a été détectée dans le
                        code pour ce test.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-36 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                {currentProject !== "all" && filteredSuites.length === 0 ? (
                  <Layers size={28} />
                ) : (
                  <BookOpen size={28} />
                )}
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-base font-bold text-slate-800">
                  {currentProject === "all"
                    ? "Explorez nos plans de test"
                    : "Sélectionnez un test"}
                </h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                  {currentProject === "all"
                    ? "Choisissez un projet dans le menu ci-dessus pour visualiser l'ensemble des fonctionnalités couvertes."
                    : "Cliquez sur un test dans l'arborescence à gauche pour afficher le détail de ses étapes d'exécution."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
