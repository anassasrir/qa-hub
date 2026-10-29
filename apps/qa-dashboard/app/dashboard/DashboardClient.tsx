"use client";

import React, { useMemo, useSyncExternalStore, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  CircleSlash,
  LayoutDashboard,
} from "lucide-react";
import TestResultPieChart from "../../components/TestResultPieChart";
import ActivityTrendChart from "../../components/ActivityTrendChart";
import FlakinessRadar from "../../components/FlakinessRadar";
import FailureRadar from "../../components/FailureRadar";
import { ComparisonSummaryChart } from "../../components/ComparisonSummaryChart";
import {
  RunData,
  RunStats,
  CategoryBreakdown,
  computeCategoryBreakdown,
  getStoredProject,
  setStoredProject,
} from "../../lib/utils";
import ProjectSelector, {
  PROJECTS_CONFIG,
} from "../../components/ProjectSelector";

// Hook utilitaire pour remplacer le isMounted sans déclencher le linter
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

interface DashboardClientProps {
  history: RunData[];
}

const EMPTY_STATS: RunStats = {
  total: 0,
  expected: 0,
  unexpected: 0,
  skipped: 0,
  flaky: 0,
  duration: 0,
};

function GlobalStatusBoard({
  projectStatuses,
  onProjectClick,
}: {
  projectStatuses: {
    id: string;
    label: string;
    status: string;
    stats: RunStats;
    lastRunId: string;
    categories?: CategoryBreakdown;
  }[];
  onProjectClick: (projectId: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
        {projectStatuses.map((project) => {
          const hasNoData = project.stats.total === 0;
          return (
            <div
              key={project.id}
              className={hasNoData ? "opacity-60 grayscale-[0.5]" : ""}
            >
              <TestResultPieChart
                stats={project.stats}
                title={project.label}
                runId={project.lastRunId}
                project={project.id}
                categories={project.categories}
                onClick={() => onProjectClick(project.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardClient({ history }: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isClient = useIsClient();

  const selectedProject = searchParams.get("project") || "all";
  const selectedEnvironment = searchParams.get("env") || "staging";

  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (!projectParam) {
      const savedProject = getStoredProject();
      if (savedProject) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("project", savedProject);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }
    } else if (projectParam === "all") {
      setStoredProject(null);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("project");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    } else {
      setStoredProject(projectParam);
    }
  }, [searchParams, router, pathname]);

  const handleProjectChange = useCallback(
    (projectId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (projectId === "all") {
        params.delete("project");
        setStoredProject(null);
      } else {
        params.set("project", projectId);
        setStoredProject(projectId);
      }
      const query = params.toString();
      const target = query ? `${pathname}?${query}` : pathname;
      router.replace(target, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleEnvironmentChange = useCallback(
    (env: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("env", env);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const filteredData = useMemo(() => {
    // Only keep CI runs for the dashboard to display the correct complete project run stats
    const ciOnlyHistory = history.filter((run) =>
      run.id.toLowerCase().includes("ci run")
    );

    const envFilteredHistory = ciOnlyHistory.filter(
      (run) => (run.environment || "staging") === selectedEnvironment,
    );

    if (selectedProject === "all") {
      const projectStatuses = PROJECTS_CONFIG.filter((p) => p.id !== "all").map(
        (project) => {
          const keywords = project.keywords || [project.id];
          const excludeKeywords = project.excludeKeywords || [];
          let latestProjectRun = null;
          for (const run of envFilteredHistory) {
            const filteredTests = run.tests.filter((test) =>
              keywords.some((kw) => test.file.toLowerCase().includes(kw)) &&
              !excludeKeywords.some((ekw) => test.file.toLowerCase().includes(ekw)),
            );
            if (filteredTests.length > 0) {
              const stats: RunStats = {
                total: filteredTests.length,
                expected: filteredTests.filter(
                  (t) => t.status === "passed" || t.status === "expected",
                ).length,
                unexpected: filteredTests.filter(
                  (t) => t.status === "failed" || t.status === "unexpected",
                ).length,
                skipped: filteredTests.filter((t) => t.status === "skipped")
                  .length,
                flaky: filteredTests.filter((t) => t.status === "flaky").length,
                duration: filteredTests.reduce((acc, t) => acc + t.duration, 0),
              };
              const categories = computeCategoryBreakdown(filteredTests);
              latestProjectRun = {
                id: project.id,
                label: project.label,
                status: stats.unexpected > 0 ? "failed" : "passed",
                stats,
                lastRunId: run.id,
                categories,
              };
              break;
            }
          }

          return (
            latestProjectRun || {
              id: project.id,
              label: project.label,
              status: "unknown",
              stats: EMPTY_STATS,
              lastRunId: "N/A",
            }
          );
        },
      );

      return {
        latestRun: envFilteredHistory.length > 0 ? envFilteredHistory[0] : null,
        history: envFilteredHistory,
        projectStatuses,
      };
    }
    const currentProject = PROJECTS_CONFIG.find(
      (p) => p.id === selectedProject,
    );
    const keywords = currentProject?.keywords || [selectedProject];
    const excludeKeywords = currentProject?.excludeKeywords || [];
    const processedHistory = envFilteredHistory.map((run) => {
      const filteredTests = run.tests.filter((test) =>
        keywords.some((kw) => test.file.toLowerCase().includes(kw)) &&
        !excludeKeywords.some((ekw) => test.file.toLowerCase().includes(ekw)),
      );
      if (filteredTests.length === 0)
        return { ...run, tests: [], stats: EMPTY_STATS };
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
      return { ...run, tests: filteredTests, stats };
    });
    const historyWithData = processedHistory.filter(
      (run) => run.stats.total > 0,
    );
    return {
      latestRun:
        historyWithData.length > 0
          ? historyWithData[0]
          : processedHistory.length > 0
            ? { ...processedHistory[0], stats: EMPTY_STATS, tests: [] }
            : null,
      history: historyWithData,
      projectStatuses: [],
    };
  }, [history, selectedProject, selectedEnvironment]);

  // Si pas encore monté sur le client, on ne rend rien pour éviter les erreurs d'hydratation
  if (!isClient) return null;

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <LayoutDashboard className="text-blue-600 w-6 h-6" />
              Tableau de Bord
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
            {[
              { id: "dev", label: "Dev" },
              { id: "staging", label: "Staging" },
            ].map((env) => (
              <button
                key={env.id}
                onClick={() => handleEnvironmentChange(env.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedEnvironment === env.id
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredData.latestRun &&
      (selectedProject === "all" || filteredData.latestRun.stats.total > 0) ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {selectedProject === "all" ? (
            <GlobalStatusBoard
              projectStatuses={filteredData.projectStatuses}
              onProjectClick={handleProjectChange}
            />
          ) : (
            <>
              {/* Niveau 1 : Dernier résultat, Radar d'instabilité, Scénarios en échec, Évolution inter-runs */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                <TestResultPieChart
                  stats={filteredData.latestRun.stats}
                  runId={filteredData.latestRun.id}
                  project={selectedProject}
                />
                <FlakinessRadar
                  tests={filteredData.latestRun.tests}
                  runId={filteredData.latestRun.id}
                />
                <FailureRadar
                  tests={filteredData.latestRun.tests}
                  runId={filteredData.latestRun.id}
                />
                <ComparisonSummaryChart
                  history={filteredData.history}
                  project={selectedProject}
                />
              </div>

              {/* Niveau 2 : Historique d'activité */}
              <div className="w-full">
                <ActivityTrendChart history={filteredData.history} />
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="bg-slate-50/50 p-20 rounded-[40px] border border-slate-200 border-dashed flex flex-col items-center justify-center text-center min-h-[300px]">
          <CircleSlash size={48} className="text-slate-200 mb-4" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            Aucune donnée disponible
          </p>
        </div>
      )}
    </div>
  );
}
