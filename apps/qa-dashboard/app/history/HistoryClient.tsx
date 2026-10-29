"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Server,
  Monitor,
  Smartphone,
  Globe,
  History as HistoryIcon,
  RotateCcw,
  X,
} from "lucide-react";
import { RunData, formatDuration, THEME } from "../../lib/utils";
import ProjectSelector, {
  PROJECTS_CONFIG,
} from "../../components/ProjectSelector";

interface HistoryClientProps {
  history: RunData[];
}

const DAYS_OF_WEEK = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export default function HistoryClient({ history }: HistoryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectFilter = searchParams.get("project") || "all";

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Vue du calendrier (mois / année)
  const [viewDate, setViewDate] = useState(() => {
    if (history.length > 0 && history[0].date) {
      const d = new Date(history[0].date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  });

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isFlakyFilter, setIsFlakyFilter] = useState(false);
  const [sortBy, setSortBy] = useState("date-desc");
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  const handleSelectRun = (runId: string) => {
    setSelectedRuns((prev) => {
      if (prev.includes(runId)) {
        return prev.filter((id) => id !== runId);
      }
      if (prev.length >= 2) return prev;
      return [...prev, runId];
    });
  };

  const handleCompare = () => {
    if (selectedRuns.length === 2) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("run1", selectedRuns[0]);
      params.set("run2", selectedRuns[1]);
      router.push(`/compare?${params.toString()}`);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", projectId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setIsDatePickerOpen(false);
    setStatusFilter("all");
    setTypeFilter("all");
    setIsFlakyFilter(false);
    setSortBy("date-desc");
    setSelectedRuns([]);
    router.push(window.location.pathname, { scroll: false });
  };

  const isFiltered =
    searchTerm !== "" ||
    startDate !== "" ||
    endDate !== "" ||
    statusFilter !== "all" ||
    typeFilter !== "all" ||
    projectFilter !== "all" ||
    isFlakyFilter ||
    sortBy !== "date-desc";

  const getDateButtonLabel = () => {
    if (!startDate && !endDate) return "Date";
    if (startDate && endDate && startDate === endDate) {
      return startDate.split("-").reverse().join("/");
    }
    if (startDate && endDate) {
      const s = startDate.split("-").reverse().slice(0, 2).join("/");
      const e = endDate.split("-").reverse().slice(0, 2).join("/");
      return `${s} - ${e}`;
    }
    if (startDate)
      return `Depuis ${startDate.split("-").reverse().slice(0, 2).join("/")}`;
    return `Jusqu'au ${endDate.split("-").reverse().slice(0, 2).join("/")}`;
  };

  // Clic sur une date dans le calendrier interactif
  const handleDateClick = (dateStr: string) => {
    if (!startDate || (startDate && endDate && startDate !== endDate)) {
      // 1er clic : commence une nouvelle sélection
      setStartDate(dateStr);
      setEndDate(dateStr);
    } else if (startDate && (!endDate || startDate === endDate)) {
      // 2e clic : soit même jour (confirme et ferme), soit période (confirme et ferme)
      if (dateStr === startDate) {
        setEndDate(dateStr);
        setIsDatePickerOpen(false);
      } else if (dateStr < startDate) {
        setStartDate(dateStr);
        setEndDate(startDate);
        setIsDatePickerOpen(false);
      } else {
        setEndDate(dateStr);
        setIsDatePickerOpen(false);
      }
    }
  };

  // Calcul des jours du calendrier
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    // Lundi = 0, Dimanche = 6
    const startOffset = (firstDay + 6) % 7;
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: { day: number; dateStr: string }[] = [];
    for (let i = 1; i <= totalDays; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        i,
      ).padStart(2, "0")}`;
      days.push({ day: i, dateStr });
    }

    return { startOffset, days, year, month };
  }, [viewDate]);

  const monthLabel = useMemo(() => {
    const formatted = viewDate.toLocaleDateString("fr-FR", {
      month: "long",
      year: "numeric",
    });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }, [viewDate]);

  const filteredHistory = useMemo(() => {
    // 1. Filtrer et recalculer chaque run en fonction du projet métier
    const processedHistory = history.map((run) => {
      if (projectFilter === "all") return run;

      const currentProject = PROJECTS_CONFIG.find(
        (p) => p.id === projectFilter,
      );
      const keywords = currentProject?.keywords || [projectFilter];
      const excludeKeywords = currentProject?.excludeKeywords || [];

      const filteredTests = run.tests.filter(
        (test) =>
          keywords.some((kw) => test.file.toLowerCase().includes(kw)) &&
          !excludeKeywords.some((ekw) => test.file.toLowerCase().includes(ekw)),
      );

      if (filteredTests.length === 0) {
        return {
          ...run,
          tests: [],
          stats: {
            total: 0,
            expected: 0,
            unexpected: 0,
            flaky: 0,
            skipped: 0,
            duration: 0,
          },
        };
      }

      return {
        ...run,
        tests: filteredTests,
        stats: {
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
        },
      };
    });

    // 2. Filtrer la liste globale
    return processedHistory
      .filter((run) => {
        // Si on filtre par projet, on ne montre que les runs qui ont des données pour ce projet
        if (projectFilter !== "all" && run.stats.total === 0) return false;

        const matchesSearch =
          searchTerm === "" ||
          run.id.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtrage par date ou période
        const runDateStr = run.date.includes("T")
          ? run.date.split("T")[0]
          : run.date.substring(0, 10);

        let matchesDate = true;
        if (startDate && endDate) {
          matchesDate = runDateStr >= startDate && runDateStr <= endDate;
        } else if (startDate) {
          matchesDate = runDateStr >= startDate;
        } else if (endDate) {
          matchesDate = runDateStr <= endDate;
        }

        const isFailed = run.stats.unexpected > 0;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "success" && !isFailed) ||
          (statusFilter === "failed" && isFailed);

        const isCI = run.id.toLowerCase().includes("ci run");
        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "ci" && isCI) ||
          (typeFilter === "local" && !isCI);

        const matchesFlaky = !isFlakyFilter || run.stats.flaky > 0;

        return (
          matchesSearch &&
          matchesDate &&
          matchesStatus &&
          matchesType &&
          matchesFlaky
        );
      })
      .sort((a, b) => {
        if (sortBy === "date-desc") return b.date.localeCompare(a.date);
        if (sortBy === "date-asc") return a.date.localeCompare(b.date);
        if (sortBy === "failures-desc")
          return b.stats.unexpected - a.stats.unexpected;
        if (sortBy === "duration-desc")
          return b.stats.duration - a.stats.duration;
        return 0;
      });
  }, [
    history,
    searchTerm,
    startDate,
    endDate,
    statusFilter,
    typeFilter,
    projectFilter,
    isFlakyFilter,
    sortBy,
  ]);

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <HistoryIcon className="text-blue-600 w-6 h-6" />
              Historique
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={projectFilter}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
            {filteredHistory.length} exécutions enregistrées
          </span>
        </div>
      </div>

      {/* Search and Filters Bar - Lightened & Harmonized */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher par ID de run..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-200 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto shrink-0 justify-between lg:justify-start">
            {/* Date Picker Filter with Interactive Calendar */}
            <div className="relative">
              <button
                type="button"
                data-testid="date-picker-button"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  startDate || endDate
                    ? "bg-blue-50/80 text-blue-700 border-blue-200"
                    : "bg-slate-50 text-slate-600 border-slate-100 hover:bg-white hover:border-blue-200"
                }`}
              >
                <Calendar
                  size={13}
                  className={
                    startDate || endDate ? "text-blue-600" : "text-slate-400"
                  }
                />
                <span>{getDateButtonLabel()}</span>
                {(startDate || endDate) && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="p-0.5 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                    title="Effacer le filtre date"
                  >
                    <X size={12} />
                  </span>
                )}
              </button>

              {isDatePickerOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDatePickerOpen(false)}
                  />
                  <div
                    data-testid="date-picker-popover"
                    className="absolute top-full mt-2 left-0 sm:right-0 sm:left-auto bg-white p-4 rounded-2xl shadow-xl border border-slate-100 z-50 w-72 space-y-3"
                  >
                    {/* Header Mois & Navigation */}
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setViewDate(
                            new Date(
                              calendarDays.year,
                              calendarDays.month - 1,
                              1,
                            ),
                          )
                        }
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Mois précédent"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="text-xs font-bold text-slate-800">
                        {monthLabel}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          setViewDate(
                            new Date(
                              calendarDays.year,
                              calendarDays.month + 1,
                              1,
                            ),
                          )
                        }
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        title="Mois suivant"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Jours de la semaine */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {DAYS_OF_WEEK.map((d) => (
                        <span
                          key={d}
                          className="text-[10px] font-bold text-slate-400 py-0.5 uppercase"
                        >
                          {d}
                        </span>
                      ))}
                    </div>

                    {/* Grille des jours */}
                    <div className="grid grid-cols-7 gap-1 text-center">
                      {/* Espaces vides avant le premier jour */}
                      {Array.from({ length: calendarDays.startOffset }).map(
                        (_, idx) => (
                          <div key={`empty-${idx}`} className="h-7 w-7" />
                        ),
                      )}

                      {/* Jours du mois */}
                      {calendarDays.days.map(({ day, dateStr }) => {
                        const isSelected =
                          dateStr === startDate || dateStr === endDate;
                        const isInRange =
                          startDate &&
                          endDate &&
                          dateStr > startDate &&
                          dateStr < endDate;
                        const isRangeStart =
                          startDate &&
                          endDate &&
                          startDate !== endDate &&
                          dateStr === startDate;
                        const isRangeEnd =
                          startDate &&
                          endDate &&
                          startDate !== endDate &&
                          dateStr === endDate;

                        return (
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => handleDateClick(dateStr)}
                            className={`h-7 w-7 sm:h-8 sm:w-8 text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white font-bold rounded-lg shadow-sm"
                                : isInRange
                                  ? "bg-blue-50 text-blue-700 font-bold rounded-none"
                                  : "text-slate-700 hover:bg-slate-100 rounded-lg"
                            } ${isRangeStart ? "rounded-r-none rounded-l-lg" : ""} ${
                              isRangeEnd ? "rounded-l-none rounded-r-lg" : ""
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Raccourcis en dessous du calendrier */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().split("T")[0];
                          setStartDate(today);
                          setEndDate(today);
                          setViewDate(new Date());
                          setIsDatePickerOpen(false);
                        }}
                        className="text-slate-500 hover:text-blue-600 px-1 py-0.5 rounded transition-colors text-[11px]"
                      >
                        Aujourd&apos;hui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const end = d.toISOString().split("T")[0];
                          d.setDate(d.getDate() - 7);
                          const start = d.toISOString().split("T")[0];
                          setStartDate(start);
                          setEndDate(end);
                          setViewDate(d);
                          setIsDatePickerOpen(false);
                        }}
                        className="text-slate-500 hover:text-blue-600 px-1 py-0.5 rounded transition-colors text-[11px]"
                      >
                        7 jours
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          const end = d.toISOString().split("T")[0];
                          d.setDate(d.getDate() - 30);
                          const start = d.toISOString().split("T")[0];
                          setStartDate(start);
                          setEndDate(end);
                          setViewDate(d);
                          setIsDatePickerOpen(false);
                        }}
                        className="text-slate-500 hover:text-blue-600 px-1 py-0.5 rounded transition-colors text-[11px]"
                      >
                        30 jours
                      </button>
                      {(startDate || endDate) && (
                        <button
                          type="button"
                          onClick={() => {
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="text-rose-500 hover:text-rose-700 px-1 py-0.5 rounded transition-colors text-[11px]"
                        >
                          Effacer
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-blue-200 cursor-pointer transition-all min-w-[150px]"
            >
              <option value="all">Tous les Statuts</option>
              <option value="success">Succès uniquement</option>
              <option value="failed">Échecs uniquement</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-blue-200 cursor-pointer transition-all min-w-[130px]"
            >
              <option value="date-desc">Plus récents</option>
              <option value="date-asc">Plus anciens</option>
              <option value="failures-desc">Plus d&apos;échecs</option>
              <option value="duration-desc">Plus longs</option>
            </select>

            <label
              htmlFor="flaky-filter-checkbox"
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl cursor-pointer group select-none hover:bg-white hover:border-blue-200 transition-all"
            >
              <input
                id="flaky-filter-checkbox"
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={isFlakyFilter}
                onChange={(e) => setIsFlakyFilter(e.target.checked)}
              />
              <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors whitespace-nowrap">
                Flaky uniquement
              </span>
            </label>

            <button
              onClick={resetFilters}
              disabled={!isFiltered}
              title="Réinitialiser les filtres"
              className={`p-2 rounded-xl border transition-all ${
                isFiltered
                  ? "bg-white text-blue-600 border-slate-200 shadow-sm hover:border-blue-300 active:scale-95 cursor-pointer"
                  : "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
              }`}
            >
              <RotateCcw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* History Table Card - Harmonized with Dashboard */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 bg-slate-50/40 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
            Historique des exécutions
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {filteredHistory.length} exécutions affichées
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/20 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="px-5 py-3 w-12 text-center">Choix</th>
                <th className="px-5 py-3">Exécution & Projet</th>
                <th className="px-5 py-3 text-center">Statut</th>
                <th className="px-5 py-3 text-center">Stats</th>
                <th className="px-5 py-3 text-right">Durée</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredHistory.map((run) => {
                const isCI = run.id.toLowerCase().includes("ci run");
                const isFailed = run.stats.unexpected > 0;
                const isMobile =
                  run.project?.toLowerCase().includes("iphone") ||
                  run.project?.toLowerCase().includes("android");
                const isVisualOnly =
                  run.tests.length > 0 &&
                  run.tests.every(
                    (t) =>
                      t.category === "visual" ||
                      t.file?.includes("visual-tests") ||
                      t.file?.includes("/visual/"),
                  );
                const isVisualRun =
                  projectFilter === "tpbp-visual" ||
                  run.project?.toLowerCase() === "tpbp-visual" ||
                  run.id.toLowerCase().includes("visual") ||
                  isVisualOnly;
                const cleanRunId = run.id
                  .replace("CI Run - ", "")
                  .replace("CI-", "")
                  .trim();
                const runLink = isVisualRun
                  ? `/visual?id=${cleanRunId}`
                  : `/details?id=${run.id}${projectFilter !== "all" ? "&project=" + projectFilter : ""}`;

                return (
                  <tr
                    key={run.id}
                    className="group hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-5 py-3.5 text-center">
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        checked={selectedRuns.includes(run.id)}
                        disabled={
                          !selectedRuns.includes(run.id) &&
                          selectedRuns.length >= 2
                        }
                        onChange={() => handleSelectRun(run.id)}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                            isCI
                              ? "bg-blue-50 text-blue-600"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isCI ? <Server size={14} /> : <Monitor size={14} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={runLink}
                              className="font-mono text-xs sm:text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors"
                            >
                              {run.id}
                            </Link>
                            {run.project && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
                                {isMobile ? (
                                  <Smartphone size={9} />
                                ) : (
                                  <Globe size={9} />
                                )}
                                {run.project}
                              </span>
                            )}
                            {isVisualRun && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                                Visuel
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1 mt-0.5">
                            <Calendar size={10} /> {run.date}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {isFailed ? (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: `${THEME.colors.failed}15`,
                            borderColor: `${THEME.colors.failed}30`,
                            color: THEME.colors.failed,
                          }}
                        >
                          <XCircle size={12} /> Échec
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: `${THEME.colors.passed}15`,
                            borderColor: `${THEME.colors.passed}30`,
                            color: THEME.colors.passed,
                          }}
                        >
                          <CheckCircle2 size={12} /> Succès
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs font-semibold">
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">
                            Réussis
                          </span>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{ color: THEME.colors.passed }}
                          >
                            {run.stats.expected}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">
                            Échecs
                          </span>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{
                              color:
                                run.stats.unexpected > 0
                                  ? THEME.colors.failed
                                  : THEME.colors.slate[300],
                            }}
                          >
                            {run.stats.unexpected}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">
                            Instables
                          </span>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{
                              color:
                                run.stats.flaky > 0
                                  ? THEME.colors.flaky
                                  : THEME.colors.slate[300],
                            }}
                          >
                            {run.stats.flaky}
                          </span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-tight">
                            Ignorés
                          </span>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{
                              color:
                                run.stats.skipped > 0
                                  ? THEME.colors.skipped
                                  : THEME.colors.slate[300],
                            }}
                          >
                            {run.stats.skipped}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs font-bold text-slate-400">
                      {formatDuration(run.stats.duration)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={runLink}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-50/80 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/80 hover:border-blue-200 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <span>{isVisualRun ? "Visuel" : "Détails"}</span>
                        <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center">
                        <Search size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-400">
                        Aucun résultat pour cette recherche
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barre flottante de comparaison */}
      {selectedRuns.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-5 z-50 border border-slate-800 animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex flex-col">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Comparaison de Runs
            </p>
            <p className="text-xs font-bold text-slate-200">
              {selectedRuns.length} run{selectedRuns.length > 1 ? "s" : ""}{" "}
              sélectionné{selectedRuns.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedRuns([])}
              className="px-3 py-1.5 hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors text-slate-400 hover:text-white cursor-pointer"
            >
              Vider
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedRuns.length !== 2}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              Comparer ({selectedRuns.length}/2)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
