"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Eye,
  Search,
  RotateCcw,
  X,
  Maximize2,
  GitBranch,
  CircleSlash,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
  SlidersHorizontal,
  Columns,
  ZoomIn,
  ZoomOut,
  Hand,
  ListFilter,
} from "lucide-react";
import { VisualRunData, VisualDiffItem } from "../../lib/parseVisual";
import { THEME, setStoredProject } from "../../lib/utils";
import ProjectSelector from "../../components/ProjectSelector";

interface VisualClientProps {
  runs: VisualRunData[];
}

export interface BranchOption {
  name: string;
  label: string;
  count: number;
}

/**
 * Traduit le nom technique d'une branche en libellé convivial pour les tests visuels TPBP.
 * - main / master -> "Homologation"
 * - test/TD-1867-visual-tests-dev-isDesignSystemDisabled -> "DEV sans FF"
 * - test/TD-1867-visual-tests-dev-isDesignSystemEnabled -> "DEV avec FF"
 * - test/TD-1866-visual-tests-dev3-tailwind4 -> "DEV3 (Vue3)"
 */
export function getBranchFriendlyLabel(branch: string): string {
  if (!branch) return branch;
  if (branch === "all") return "Toutes les branches";

  // Homologation
  if (
    branch === "main" ||
    branch === "master" ||
    branch.toLowerCase().includes("homologation")
  ) {
    return "Homologation";
  }

  // DEV sans FF (Feature Flag Design System désactivé)
  if (
    branch.includes("isDesignSystemDisabled") ||
    branch.includes("disable-design-system") ||
    branch.toLowerCase().includes("sans-ff") ||
    branch.toLowerCase().includes("sans-ds")
  ) {
    return "DEV sans FF";
  }

  // DEV avec FF (Feature Flag Design System activé)
  if (
    branch.includes("isDesignSystemEnabled") ||
    branch.includes("enable-design-system") ||
    branch.toLowerCase().includes("avec-ff") ||
    branch.toLowerCase().includes("avec-ds")
  ) {
    return "DEV avec FF";
  }

  // DEV3 (Vue 3 / Tailwind 4)
  if (
    branch.includes("dev3-tailwind4") ||
    branch.includes("tailwind4") ||
    branch.toLowerCase().includes("dev3")
  ) {
    return "DEV3 (Vue3)";
  }

  return branch;
}

interface BranchSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: BranchOption[];
  placeholder?: string;
}

function BranchSelector({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner une branche...",
}: BranchSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.name === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.name.toLowerCase().includes(term) ||
        opt.label.toLowerCase().includes(term),
    );
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const containerClass = `branch-select-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;
      if (!target.closest(`.${containerClass}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen, label]);

  const safeContainerClass = `branch-select-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  return (
    <div
      className={`relative flex flex-col gap-1 w-full ${safeContainerClass}`}
    >
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <GitBranch className="w-3 h-3 text-slate-400" />
        {label}
      </label>

      {/* Trigger Button */}
      <button
        type="button"
        data-testid="branch-selector-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 focus:border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all outline-none"
      >
        {selectedOption ? (
          <div className="flex items-center justify-between flex-grow overflow-hidden mr-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <GitBranch className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span
                className="text-xs font-bold text-slate-800 truncate"
                title={selectedOption.name !== "all" && selectedOption.name !== selectedOption.label ? `${selectedOption.label} (${selectedOption.name})` : selectedOption.label}
              >
                {selectedOption.label}
              </span>
            </div>
            {selectedOption.name !== "all" && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("all");
                }}
                className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-2 flex items-center justify-center"
                title="Réinitialiser la branche (Toutes les branches)"
              >
                <X className="w-3 h-3" />
              </span>
            )}
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
            placeholder="Rechercher une branche..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 outline-none flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />

          {/* Options List */}
          <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[280px]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.name}
                  type="button"
                  onClick={() => {
                    onChange(opt.name);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    value === opt.name
                      ? "bg-blue-50 text-blue-600 cursor-pointer font-bold"
                      : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                    <GitBranch
                      className={`w-3.5 h-3.5 shrink-0 ${
                        value === opt.name ? "text-blue-600" : "text-slate-400"
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-bold text-slate-800">
                        {opt.label}
                      </span>
                      {opt.name !== "all" && opt.name !== opt.label && (
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {opt.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {opt.count > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-slate-100 rounded-md shrink-0">
                      {opt.count} run{opt.count > 1 ? "s" : ""}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs font-medium text-slate-400">
                Aucune branche trouvée
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface RunSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: VisualRunData[];
  placeholder?: string;
  disabledValue?: string;
  disabledLabel?: string;
}

function RunSelector({
  label,
  value,
  onChange,
  options,
  placeholder = "Sélectionner une exécution...",
  disabledValue,
  disabledLabel,
}: RunSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedRun = useMemo(
    () => options.find((r) => r.pipelineId === value || r.jobId === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(
      (r) =>
        r.pipelineId.toLowerCase().includes(term) ||
        r.branch.toLowerCase().includes(term) ||
        getBranchFriendlyLabel(r.branch).toLowerCase().includes(term) ||
        r.commitHash.toLowerCase().includes(term),
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

  const getRunStatusIcon = (run: VisualRunData) => {
    if (run.stats.total === 0) {
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

  const getRunStats = (run: VisualRunData) => {
    const totalTests =
      typeof run.totalTests === "number" && run.totalTests > 0
        ? run.totalTests
        : typeof run.testCount === "number" && run.testCount > 0
        ? run.testCount
        : 12;

    const failedCount =
      typeof run.failedCount === "number"
        ? run.failedCount
        : new Set(
            (run.items || []).map((i) => i.specTitle || i.file).filter(Boolean),
          ).size;

    const passedCount =
      typeof run.passedCount === "number"
        ? run.passedCount
        : Math.max(0, totalTests - failedCount);

    const diffCount = (run.items || []).length;

    return { totalTests, passedCount, failedCount, diffCount };
  };

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

      {/* Trigger Button - Harmonized with History & Compare */}
      <button
        type="button"
        data-testid="run-selector-trigger"
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
              <span className="shrink-0 font-mono text-xs font-bold text-slate-800">
                Run #{selectedRun.pipelineId}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-medium shrink-0">
                ({formatRunDate(selectedRun.runTimestamp)})
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <span
                style={{
                  backgroundColor: `${THEME.colors.slate[100]}`,
                  color: THEME.colors.slate[600],
                  borderColor: `${THEME.colors.slate[200]}`,
                }}
                className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0"
              >
                {getRunStats(selectedRun).totalTests} tests
              </span>
              {getRunStats(selectedRun).passedCount > 0 && (
                <span
                  style={{
                    backgroundColor: `${THEME.colors.passed}15`,
                    color: THEME.colors.passed,
                    borderColor: `${THEME.colors.passed}30`,
                  }}
                  className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0"
                >
                  {getRunStats(selectedRun).passedCount} conformes
                </span>
              )}
              {getRunStats(selectedRun).failedCount > 0 && (
                <span
                  style={{
                    backgroundColor: `${THEME.colors.failed}15`,
                    color: THEME.colors.failed,
                    borderColor: `${THEME.colors.failed}30`,
                  }}
                  className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0"
                >
                  {getRunStats(selectedRun).failedCount} échecs
                </span>
              )}
              <span
                style={{
                  backgroundColor: `${THEME.colors.failed}15`,
                  color: THEME.colors.failed,
                  borderColor: `${THEME.colors.failed}30`,
                }}
                className="text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0"
              >
                {getRunStats(selectedRun).diffCount} écart{getRunStats(selectedRun).diffCount > 1 ? "s" : ""}
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onChange("");
                }}
                className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-1 flex items-center justify-center"
                title="Effacer la sélection"
              >
                <X className="w-3 h-3" />
              </span>
            </div>
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
            placeholder="Rechercher une CI pipeline ou un run..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 outline-none flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />

          {/* Options List */}
          <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[280px]">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((run) => (
                <button
                  key={run.pipelineId}
                  type="button"
                  disabled={run.pipelineId === disabledValue}
                  onClick={() => {
                    onChange(run.pipelineId);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    run.pipelineId === disabledValue
                      ? "opacity-40 cursor-not-allowed bg-slate-50"
                      : value === run.pipelineId
                        ? "bg-blue-50 text-blue-600 cursor-pointer font-bold"
                        : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {getRunStatusIcon(run)}
                    <span className="truncate font-mono">
                      Run #{run.pipelineId}
                    </span>
                    {run.branch && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-sans font-semibold shrink-0">
                        {getBranchFriendlyLabel(run.branch)}
                      </span>
                    )}
                  </div>

                  {run.pipelineId === disabledValue ? (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                      {disabledLabel || "Déjà sélectionné"}
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-mono font-medium shrink-0">
                        {formatRunDate(run.runTimestamp)}
                      </span>
                      <span
                        style={{
                          backgroundColor: `${THEME.colors.slate[100]}`,
                          color: THEME.colors.slate[600],
                          borderColor: `${THEME.colors.slate[200]}`,
                        }}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0"
                      >
                        {getRunStats(run).totalTests} tests
                      </span>
                      {getRunStats(run).passedCount > 0 && (
                        <span
                          style={{
                            backgroundColor: `${THEME.colors.passed}15`,
                            color: THEME.colors.passed,
                            borderColor: `${THEME.colors.passed}30`,
                          }}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0"
                        >
                          {getRunStats(run).passedCount} ok
                        </span>
                      )}
                      {getRunStats(run).failedCount > 0 && (
                        <span
                          style={{
                            backgroundColor: `${THEME.colors.failed}15`,
                            color: THEME.colors.failed,
                            borderColor: `${THEME.colors.failed}30`,
                          }}
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0"
                        >
                          {getRunStats(run).failedCount} échecs
                        </span>
                      )}
                      <span
                        style={{
                          backgroundColor: `${THEME.colors.failed}15`,
                          color: THEME.colors.failed,
                          borderColor: `${THEME.colors.failed}30`,
                        }}
                        className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border shrink-0"
                      >
                        {getRunStats(run).diffCount} écart{getRunStats(run).diffCount > 1 ? "s" : ""}
                      </span>
                    </div>
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

interface TestScenarioOption {
  title: string;
  count: number;
  file: string;
}

interface TestScenarioSelectorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: TestScenarioOption[];
  totalDiffs: number;
  placeholder?: string;
}

function TestScenarioSelector({
  label,
  value,
  onChange,
  options,
  totalDiffs,
  placeholder = "Tous les scénarios avec écarts",
}: TestScenarioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => opt.title === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const term = search.toLowerCase();
    return options.filter(
      (opt) =>
        opt.title.toLowerCase().includes(term) ||
        opt.file.toLowerCase().includes(term),
    );
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const containerClass = `test-scenario-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;
      if (!target.closest(`.${containerClass}`)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [isOpen, label]);

  const safeContainerClass = `test-scenario-container-${label.replace(/[^a-zA-Z0-9-]/g, "-")}`;

  return (
    <div
      className={`relative flex flex-col gap-1 w-full ${safeContainerClass}`}
    >
      {/* Trigger Button - Même thème que BranchSelector et RunSelector */}
      <button
        type="button"
        data-testid="test-filter-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setSearch("");
        }}
        className="w-full bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 focus:border-blue-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center justify-between cursor-pointer transition-all outline-none"
      >
        {value !== "all" && selectedOption ? (
          <div className="flex items-center justify-between flex-grow overflow-hidden mr-2">
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <ListFilter className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span
                className="text-xs font-bold text-slate-800 truncate"
                title={selectedOption.title}
              >
                {selectedOption.title}
              </span>
              <span
                style={{
                  backgroundColor: `${THEME.colors.failed}15`,
                  color: THEME.colors.failed,
                  borderColor: `${THEME.colors.failed}30`,
                }}
                className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0"
              >
                {selectedOption.count} écart{selectedOption.count > 1 ? "s" : ""}
              </span>
            </div>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("all");
              }}
              className="p-1 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0 ml-2 flex items-center justify-center"
              title="Réinitialiser le test (Tous les tests)"
            >
              <X className="w-3 h-3" />
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow overflow-hidden mr-2">
            <ListFilter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-700 text-xs font-semibold truncate">
              {placeholder} ({options.length} test{options.length > 1 ? "s" : ""} • {totalDiffs} écart{totalDiffs > 1 ? "s" : ""})
            </span>
          </div>
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
            placeholder="Rechercher un scénario de test..."
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:bg-white focus:border-blue-200 outline-none flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />

          {/* Options List */}
          <div className="flex-grow overflow-y-auto space-y-0.5 max-h-[280px]">
            {/* Option "Tous les scénarios" */}
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setIsOpen(false);
              }}
              className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                value === "all"
                  ? "bg-blue-50 text-blue-600 cursor-pointer font-bold"
                  : "text-slate-700 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                <ListFilter
                  className={`w-3.5 h-3.5 shrink-0 ${
                    value === "all" ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <span className="truncate text-xs font-bold text-slate-800">
                  Tous les scénarios avec écarts
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono px-1.5 py-0.5 bg-slate-100 rounded-md shrink-0">
                {options.length} tests • {totalDiffs} écarts
              </span>
            </button>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.title}
                  type="button"
                  onClick={() => {
                    onChange(opt.title);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                    value === opt.title
                      ? "bg-blue-50 text-blue-600 cursor-pointer font-bold"
                      : "text-slate-700 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2 min-w-0">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 shrink-0 ${
                        value === opt.title ? "text-blue-600" : "text-slate-300"
                      }`}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate text-xs font-bold text-slate-800">
                        {opt.title}
                      </span>
                      {opt.file && (
                        <span className="text-[10px] text-slate-400 font-mono truncate">
                          {opt.file}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    style={{
                      backgroundColor: `${THEME.colors.failed}15`,
                      color: THEME.colors.failed,
                    }}
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0"
                  >
                    {opt.count} écart{opt.count > 1 ? "s" : ""}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-4 text-xs font-medium text-slate-400">
                Aucun scénario trouvé
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Composant de comparaison interactive par Slider avec Zoom et Panning (Avant / Après)
 */
interface ImageComparisonSliderProps {
  expectedSrc: string;
  actualSrc: string;
  onExpand?: () => void;
  initialZoom?: number;
  isFullScreen?: boolean;
}

function ImageComparisonSlider({
  expectedSrc,
  actualSrc,
  onExpand,
  initialZoom = 1,
  isFullScreen = false,
}: ImageComparisonSliderProps) {
  const [sliderPos, setSliderPos] = useState(50);
  const [zoom, setZoom] = useState(initialZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingSlider, setIsDraggingSlider] = useState(false);
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const updateSliderPosition = (clientX: number) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    if (rect.width === 0) return;
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("[data-slider-handle]")) {
      setIsDraggingSlider(true);
      updateSliderPosition(e.clientX);
    } else if (zoom > 1) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    } else {
      setIsDraggingSlider(true);
      updateSliderPosition(e.clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSlider) {
      updateSliderPosition(e.clientX);
    } else if (isPanning && zoom > 1) {
      const dx = (e.clientX - lastMousePos.current.x) / zoom;
      const dy = (e.clientY - lastMousePos.current.y) / zoom;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSlider(false);
    setIsPanning(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      if (target.closest("[data-slider-handle]") || zoom === 1) {
        setIsDraggingSlider(true);
        updateSliderPosition(touch.clientX);
      } else if (zoom > 1) {
        setIsPanning(true);
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      if (isDraggingSlider) {
        updateSliderPosition(touch.clientX);
      } else if (isPanning && zoom > 1) {
        const dx = (touch.clientX - lastMousePos.current.x) / zoom;
        const dy = (touch.clientY - lastMousePos.current.y) / zoom;
        lastMousePos.current = { x: touch.clientX, y: touch.clientY };
        setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      }
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (zoom > 1) {
      setPan((prev) => ({
        x: prev.x - e.deltaX / zoom,
        y: prev.y - e.deltaY / zoom,
      }));
    }
  };

  return (
    <div
      className={`flex flex-col gap-1.5 w-full ${isFullScreen ? "h-full justify-center" : ""}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <SlidersHorizontal size={11} className="text-blue-600" />
          Slider Avant / Après (Attendu ➔ Reçu)
          {zoom > 1 && (
            <span className="text-slate-400 font-normal hidden sm:inline-flex items-center gap-1 ml-1.5">
              &bull; <Hand size={10} /> Glissez l&apos;image pour naviguer
            </span>
          )}
        </span>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1 bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/60">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="p-1 hover:bg-white text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all cursor-pointer"
            title="Zoom arrière"
          >
            <ZoomOut size={12} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700 hover:text-blue-600 hover:bg-white rounded transition-all cursor-pointer"
            title="Réinitialiser le zoom"
          >
            {zoom}x
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
            className="p-1 hover:bg-white text-slate-600 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-all cursor-pointer"
            title="Zoom avant"
          >
            <ZoomIn size={12} />
          </button>

          {onExpand && !isFullScreen && (
            <>
              <div className="h-3 w-px bg-slate-300"></div>
              <button
                type="button"
                onClick={onExpand}
                className="p-1 hover:bg-white text-slate-600 hover:text-blue-600 rounded transition-all cursor-pointer"
                title="Agrandir"
              >
                <Maximize2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        className={`relative select-none overflow-hidden rounded-xl border border-slate-200/80 bg-slate-900 flex items-center justify-center group ${
          isFullScreen ? "w-full flex-1 max-h-[82vh]" : "aspect-video"
        } ${zoom > 1 ? (isPanning ? "cursor-grabbing" : "cursor-grab") : "cursor-ew-resize"}`}
      >
        {/* Unified Scaled & Panned Canvas: contains Images AND Slider line so the line NEVER gets lost! */}
        <div
          ref={canvasRef}
          className="relative w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
          }}
        >
          {/* Baseline (Attendu - Arrière-plan) */}
          <img
            src={expectedSrc}
            alt="Baseline"
            className="w-full h-full object-contain pointer-events-none select-none"
          />

          {/* Exécution (Reçu - Calque découpé) */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center justify-center"
            style={{
              clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
            }}
          >
            <img
              src={actualSrc}
              alt={isFullScreen ? "Full View" : "Actual"}
              className="w-full h-full object-contain pointer-events-none select-none"
            />
          </div>

          {/* Ligne et poignée de déplacement du slider : INSIDE canvas so it stays locked to images */}
          <div
            data-slider-handle="true"
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.8)] z-30 cursor-ew-resize"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white shadow-xl border border-slate-300 flex items-center justify-center text-slate-800 pointer-events-auto cursor-ew-resize">
              <ArrowLeftRight size={11} />
            </div>
          </div>
        </div>

        {/* Badges d'indication gauche/droite (fixed in viewport) */}
        <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider pointer-events-none z-40 border border-slate-700">
          Attendu ({Math.round(100 - sliderPos)}%)
        </span>
        <span className="absolute top-2.5 right-2.5 bg-blue-600/90 backdrop-blur-sm text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider pointer-events-none z-40 shadow-sm">
          Reçu ({Math.round(sliderPos)}%)
        </span>
      </div>
    </div>
  );
}

export default function VisualClient({ runs }: VisualClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedProject = searchParams.get("project") || "all";
  const branchParam = searchParams.get("branch");
  const runIdParam = searchParams.get("id");

  // Runs disponibles
  const availableRuns = useMemo(() => {
    if (!runs || runs.length === 0) return [];
    if (
      selectedProject === "all" ||
      selectedProject === "tpbp-visual" ||
      selectedProject === "tpbp"
    ) {
      return runs;
    }
    return runs.filter(
      (r) =>
        r.project === selectedProject ||
        (selectedProject === "tpbp" && r.project === "tpbp-visual"),
    );
  }, [runs, selectedProject]);

  // Options de branches uniques
  const branchOptions: BranchOption[] = useMemo(() => {
    if (availableRuns.length === 0) return [];

    const branchCounts = new Map<string, number>();
    for (const r of availableRuns) {
      const b = r.branch || "unknown";
      branchCounts.set(b, (branchCounts.get(b) || 0) + 1);
    }

    const list: BranchOption[] = [
      {
        name: "all",
        label: "Toutes les branches",
        count: availableRuns.length,
      },
    ];

    for (const [branch, count] of branchCounts.entries()) {
      list.push({
        name: branch,
        label: getBranchFriendlyLabel(branch),
        count,
      });
    }

    const BRANCH_ORDER: Record<string, number> = {
      Homologation: 1,
      "DEV sans FF": 2,
      "DEV avec FF": 3,
      "DEV3 (Vue3)": 4,
    };

    list.sort((a, b) => {
      if (a.name === "all") return -1;
      if (b.name === "all") return 1;
      const orderA = BRANCH_ORDER[a.label] ?? 99;
      const orderB = BRANCH_ORDER[b.label] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label);
    });

    return list;
  }, [availableRuns]);

  // Branche active
  const selectedBranch = useMemo(() => {
    if (availableRuns.length === 0) return "all";

    if (branchParam) {
      if (branchParam === "all") return "all";
      const exists = branchOptions.some((b) => b.name === branchParam);
      if (exists) return branchParam;
    }

    if (runIdParam && runIdParam !== "none") {
      const foundRun = availableRuns.find(
        (r) => r.pipelineId === runIdParam || r.jobId === runIdParam,
      );
      if (foundRun?.branch) return foundRun.branch;
    }

    return availableRuns[0]?.branch || "all";
  }, [availableRuns, branchOptions, branchParam, runIdParam]);

  // Runs filtrés pour la branche sélectionnée
  const runsForSelectedBranch = useMemo(() => {
    if (availableRuns.length === 0) return [];
    if (selectedBranch === "all") return availableRuns;
    return availableRuns.filter((r) => r.branch === selectedBranch);
  }, [availableRuns, selectedBranch]);

  const currentRun = useMemo(() => {
    if (availableRuns.length === 0) return null;
    if (runIdParam === "none" || runIdParam === "") return null;
    if (runIdParam) {
      return (
        runsForSelectedBranch.find(
          (r) => r.pipelineId === runIdParam || r.jobId === runIdParam,
        ) ||
        availableRuns.find(
          (r) => r.pipelineId === runIdParam || r.jobId === runIdParam,
        ) ||
        null
      );
    }
    return runsForSelectedBranch[0] || availableRuns[0] || null;
  }, [availableRuns, runsForSelectedBranch, runIdParam]);

  const [currentFilter, setCurrentFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"slider" | "grid">("slider");
  const [modalImage, setModalImage] = useState<{
    src: string;
    title: string;
    isSlider?: boolean;
    expectedSrc?: string;
    actualSrc?: string;
  } | null>(null);

  const handleProjectChange = (projectId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (projectId === "all") {
      params.delete("project");
      setStoredProject(null);
    } else {
      params.set("project", projectId);
      setStoredProject(projectId);
    }
    params.delete("id");
    params.delete("branch");
    params.delete("test");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleBranchChange = (newBranch: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("test");
    if (newBranch === "all") {
      params.set("branch", "all");
      if (runIdParam === "none") {
        // keep none
      } else if (
        !availableRuns.some((r) => r.pipelineId === currentRun?.pipelineId)
      ) {
        if (availableRuns.length > 0) {
          params.set("id", availableRuns[0].pipelineId);
        }
      }
    } else {
      params.set("branch", newBranch);
      const targetRuns = availableRuns.filter((r) => r.branch === newBranch);
      const currentInBranch = targetRuns.some(
        (r) => r.pipelineId === currentRun?.pipelineId,
      );
      if (!currentInBranch) {
        if (targetRuns.length > 0) {
          params.set("id", targetRuns[0].pipelineId);
        } else {
          params.set("id", "none");
        }
      }
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleRunChange = (pipelineId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("test");
    if (pipelineId) {
      params.set("id", pipelineId);
      const run = availableRuns.find(
        (r) => r.pipelineId === pipelineId || r.jobId === pipelineId,
      );
      if (run && run.branch && selectedBranch !== "all") {
        params.set("branch", run.branch);
      }
    } else {
      params.set("id", "none");
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const selectedTestFilter = searchParams.get("test") || "all";
  const [searchQuery, setSearchQuery] = useState<string>("");

  const testOptions = useMemo(() => {
    if (!currentRun || !currentRun.items) return [];
    const map = new Map<string, { title: string; count: number; file: string }>();
    for (const item of currentRun.items) {
      const title = item.specTitle || item.file || "Test sans titre";
      if (!map.has(title)) {
        map.set(title, { title, count: 0, file: item.file });
      }
      map.get(title)!.count++;
    }
    return Array.from(map.values()).sort((a, b) =>
      a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
    );
  }, [currentRun]);

  const handleTestFilterChange = (testTitle: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (testTitle === "all") {
      params.delete("test");
    } else {
      params.set("test", testTitle);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const resetFilters = () => {
    setCurrentFilter("all");
    setSearchQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("test");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const isFiltered =
    currentFilter !== "all" ||
    selectedTestFilter !== "all" ||
    searchQuery.trim() !== "";

  const items = useMemo(() => currentRun?.items || [], [currentRun?.items]);
  const catCounts = currentRun?.stats.categories || {};

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCat =
        currentFilter === "all" || item.category === currentFilter;
      const testTitle = item.specTitle || item.file || "Test sans titre";
      const matchesTest =
        selectedTestFilter === "all" || testTitle === selectedTestFilter;
      const term = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !term ||
        testTitle.toLowerCase().includes(term) ||
        (item.file && item.file.toLowerCase().includes(term)) ||
        (item.snapshot && item.snapshot.toLowerCase().includes(term)) ||
        (item.category && item.category.toLowerCase().includes(term));
      return matchesCat && matchesTest && matchesSearch;
    });
  }, [items, currentFilter, selectedTestFilter, searchQuery]);

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto min-h-screen">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Eye className="text-blue-600 w-6 h-6" />
              Tests Visuels
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>

          <ProjectSelector
            selectedProject={selectedProject}
            onProjectChange={handleProjectChange}
          />
        </div>
        {availableRuns.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
              {availableRuns.length} exécution
              {availableRuns.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* 2. Sélecteurs Branche & Run & Barre de Filtres */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1 min-w-0">
            {/* Branche : largeur compacte adaptée */}
            <div className="w-full sm:w-64 lg:w-72 shrink-0">
              <BranchSelector
                label="Choisir la branche"
                value={selectedBranch}
                onChange={handleBranchChange}
                options={branchOptions}
                placeholder={
                  branchOptions.length === 0
                    ? "Aucune branche disponible..."
                    : "Sélectionner une branche..."
                }
              />
            </div>
            {/* Run : prend tout le reste de l'espace pour que les badges ne soient pas denses */}
            <div className="flex-1 min-w-0">
              <RunSelector
                label="Choisir le run de test visuel"
                value={currentRun ? currentRun.pipelineId : ""}
                onChange={handleRunChange}
                options={runsForSelectedBranch}
                placeholder={
                  runsForSelectedBranch.length === 0
                    ? "Aucun run disponible..."
                    : "Sélectionner un run de test visuel..."
                }
              />
            </div>
          </div>

          {/* Switcher Slider / 3 Vues */}
          {currentRun && (
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              {/* Mode d'affichage Slider vs 3 Vues */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("slider")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "slider"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Afficher le slider interactif Avant / Après"
                >
                  <SlidersHorizontal size={12} />
                  <span>Slider</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Afficher les 3 colonnes côte-à-côte"
                >
                  <Columns size={12} />
                  <span>3 Vues</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Barre de sélection par scénario de test & recherche (au-dessus des catégories) */}
      {currentRun && (
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
            {/* Dropdown choix du test au même thème que les autres sélecteurs */}
            <div className="flex-1 min-w-0">
              <TestScenarioSelector
                label="Filtrer par scénario de test"
                value={selectedTestFilter}
                onChange={handleTestFilterChange}
                options={testOptions}
                totalDiffs={items.length}
              />
            </div>

            {/* Champ de recherche */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                data-testid="visual-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par snapshot, titre..."
                className="w-full pl-8.5 pr-8 py-2 bg-slate-50 border border-slate-100 focus:bg-white focus:border-blue-200 rounded-xl text-xs font-medium text-slate-700 placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Effacer la recherche"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Compteur d'affichage et Bouton Reset (icône seule, grisé quand inactif) */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
            <span className="text-xs font-mono font-bold text-slate-500 px-3 py-2 bg-slate-100 rounded-xl">
              {filteredItems.length} / {items.length} écart{items.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              disabled={!isFiltered}
              onClick={resetFilters}
              data-testid="reset-filters-btn"
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                isFiltered
                  ? "border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/40 shadow-sm cursor-pointer"
                  : "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50"
              }`}
              title="Réinitialiser les filtres"
              aria-label="Réinitialiser les filtres"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 4. Cartes KPIs des Catégories (Filtres) - Style harmonisé avec /compare */}
      {currentRun && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              id: "all",
              label: "Tous les écarts",
              count: items.length,
              badge: "Global",
              badgeStyle: {
                backgroundColor: `${THEME.colors.slate[100]}`,
                color: THEME.colors.slate[600],
                borderColor: THEME.colors.slate[200],
              },
              tooltip: "Tous les écarts visuels et erreurs techniques du run",
              color: THEME.colors.slate[900],
            },
            {
              id: "Refonte Modale / Drawer (Impact Majeur)",
              label: "Modales / Drawers",
              count: catCounts["Refonte Modale / Drawer (Impact Majeur)"] || 0,
              badge: "> 40%",
              badgeStyle: {
                backgroundColor: "#f3e8ff",
                color: "#7e22ce",
                borderColor: "#e9d5ff",
              },
              tooltip:
                "Refonte modale ou drawer avec impact majeur (Écart > 40%)",
              color: "#7e22ce",
            },
            {
              id: "Décalage Vertical / Hauteur (Layout Shift)",
              label: "Layout Shift",
              count:
                catCounts["Décalage Vertical / Hauteur (Layout Shift)"] || 0,
              badge: "Hauteur",
              badgeStyle: {
                backgroundColor: `${THEME.colors.flaky}15`,
                color: THEME.colors.flaky,
                borderColor: `${THEME.colors.flaky}30`,
              },
              tooltip:
                "Changement de hauteur provoquant un décalage vertical (Layout Shift)",
              color: THEME.colors.flaky,
            },
            {
              id: "Ajustement Cosmétique Localisé",
              label: "Cosmétique",
              count: catCounts["Ajustement Cosmétique Localisé"] || 0,
              badge: "< 5%",
              badgeStyle: {
                backgroundColor: `${THEME.colors.blue}15`,
                color: THEME.colors.blue,
                borderColor: `${THEME.colors.blue}30`,
              },
              tooltip:
                "Ajustements cosmétiques localisés : couleurs, marges, padding (Écart < 5%)",
              color: THEME.colors.blue,
            },
            {
              id: "Erreur Fonctionnelle / Timeout",
              label: "Erreurs / Timeouts",
              count: catCounts["Erreur Fonctionnelle / Timeout"] || 0,
              badge: "Alerte",
              badgeStyle: {
                backgroundColor: `${THEME.colors.failed}15`,
                color: THEME.colors.failed,
                borderColor: `${THEME.colors.failed}30`,
              },
              tooltip:
                "Erreurs fonctionnelles, timeouts ou échecs avant capture du snapshot",
              color: THEME.colors.failed,
            },
          ].map((cat) => {
            const isActive = currentFilter === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() =>
                  setCurrentFilter(
                    isActive && cat.id !== "all" ? "all" : cat.id,
                  )
                }
                title={cat.tooltip}
                className={`bg-white p-4 sm:p-5 rounded-2xl border shadow-sm flex flex-col justify-between cursor-pointer transition-all ${
                  isActive
                    ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/10"
                    : "border-slate-100 hover:border-slate-300 hover:shadow-md"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: isActive
                        ? THEME.colors.blue
                        : THEME.colors.slate[400],
                    }}
                  >
                    {cat.label}
                  </span>
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                    style={cat.badgeStyle}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-auto">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-xl font-bold font-mono"
                      style={{
                        color:
                          cat.count > 0 && cat.id !== "all"
                            ? cat.color
                            : THEME.colors.slate[900],
                      }}
                    >
                      {cat.count}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 font-mono">
                      écart{cat.count > 1 ? "s" : ""}
                    </span>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      Actif
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Grille des Différences Visuelles - Harmonisé avec /dashboard & /history */}
      {currentRun ? (
        <div className="space-y-6">
          {filteredItems.length === 0 ? (
            <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-100 text-center space-y-2.5">
              <div className="w-10 h-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <Search size={18} />
              </div>
              <p className="text-xs font-bold text-slate-400">
                Aucun élément ne correspond à votre filtre.
              </p>
            </div>
          ) : (
            filteredItems.map((item: VisualDiffItem) => {
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Header Carte */}
                  <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs sm:text-sm font-bold text-slate-800 truncate">
                          {item.snapshot || item.specTitle}
                        </span>
                        {item.diffPercent && (
                          <span
                            style={{
                              backgroundColor: `${THEME.colors.failed}15`,
                              color: THEME.colors.failed,
                              borderColor: `${THEME.colors.failed}30`,
                            }}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border"
                          >
                            Écart : {item.diffPercent}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono font-medium mt-1">
                        {item.file} &bull; {item.specTitle}
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic & Dimensions */}
                  <div className="px-4 sm:px-5 py-2.5 bg-slate-50/20 border-b border-slate-100 text-xs text-slate-600 flex flex-wrap items-center gap-4">
                    <span>
                      <strong className="font-bold text-slate-700">
                        Diagnostic :
                      </strong>{" "}
                      {item.explanation}
                    </span>
                    {item.expectedDim && item.receivedDim && (
                      <span className="text-slate-400">
                        &bull; Dimensions :{" "}
                        <code className="text-slate-700 font-mono text-[11px]">
                          {item.expectedDim} ➔ {item.receivedDim}
                        </code>
                      </span>
                    )}
                    {item.diffPixels && (
                      <span className="text-slate-400">
                        &bull; Pixels modifiés :{" "}
                        <strong className="text-slate-700 font-mono text-[11px]">
                          {item.diffPixels.toLocaleString("fr-FR")}
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Affichage des images : Mode Slider ou Mode 3 Colonnes */}
                  {item.snapshot ? (
                    item.expectedImageRelPath &&
                    item.actualImageRelPath &&
                    viewMode === "slider" ? (
                      <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                        {/* 1. Slider interactif Avant/Après (2 colonnes de large) avec zoom et pan intégrés */}
                        <div className="lg:col-span-2">
                          <ImageComparisonSlider
                            expectedSrc={item.expectedImageRelPath}
                            actualSrc={item.actualImageRelPath}
                            onExpand={() =>
                              setModalImage({
                                src: item.actualImageRelPath!,
                                title: `Comparaison Slider — ${item.snapshot}`,
                                isSlider: true,
                                expectedSrc: item.expectedImageRelPath!,
                                actualSrc: item.actualImageRelPath!,
                              })
                            }
                          />
                        </div>

                        {/* 2. Visualisation du Diff (1 colonne) */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              style={{ color: THEME.colors.failed }}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              Différence (Écarts)
                            </span>
                            {item.diffImageRelPath && (
                              <button
                                onClick={() =>
                                  setModalImage({
                                    src: item.diffImageRelPath!,
                                    title: `Diff — ${item.snapshot}`,
                                  })
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Agrandir"
                              >
                                <Maximize2 size={13} />
                              </button>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-900 aspect-video flex items-center justify-center relative group">
                            {item.diffImageRelPath ? (
                              <img
                                src={item.diffImageRelPath}
                                alt="Diff"
                                className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() =>
                                  setModalImage({
                                    src: item.diffImageRelPath!,
                                    title: `Diff — ${item.snapshot}`,
                                  })
                                }
                              />
                            ) : (
                              <span className="text-xs text-slate-400">
                                Aucun fichier diff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Mode 3 Vues Côte-à-côte */
                      <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* 1. Baseline */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              1. Baseline (Attendu)
                            </span>
                            {item.expectedImageRelPath && (
                              <button
                                onClick={() =>
                                  setModalImage({
                                    src: item.expectedImageRelPath!,
                                    title: `Baseline — ${item.snapshot}`,
                                  })
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Agrandir"
                              >
                                <Maximize2 size={13} />
                              </button>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center relative group">
                            {item.expectedImageRelPath ? (
                              <img
                                src={item.expectedImageRelPath}
                                alt="Expected"
                                className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() =>
                                  setModalImage({
                                    src: item.expectedImageRelPath!,
                                    title: `Baseline — ${item.snapshot}`,
                                  })
                                }
                              />
                            ) : (
                              <span className="text-xs text-slate-400">
                                Image attendue introuvable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. Actual */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                              2. Exécution (Reçu)
                            </span>
                            {item.actualImageRelPath && (
                              <button
                                onClick={() =>
                                  setModalImage({
                                    src: item.actualImageRelPath!,
                                    title: `Reçu — ${item.snapshot}`,
                                  })
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Agrandir"
                              >
                                <Maximize2 size={13} />
                              </button>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center relative group">
                            {item.actualImageRelPath ? (
                              <img
                                src={item.actualImageRelPath}
                                alt="Actual"
                                className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() =>
                                  setModalImage({
                                    src: item.actualImageRelPath!,
                                    title: `Reçu — ${item.snapshot}`,
                                  })
                                }
                              />
                            ) : (
                              <span className="text-xs text-slate-400">
                                Image reçue introuvable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. Diff Highlight */}
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span
                              style={{ color: THEME.colors.failed }}
                              className="text-[10px] font-bold uppercase tracking-wider"
                            >
                              3. Différence
                            </span>
                            {item.diffImageRelPath && (
                              <button
                                onClick={() =>
                                  setModalImage({
                                    src: item.diffImageRelPath!,
                                    title: `Diff — ${item.snapshot}`,
                                  })
                                }
                                className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                title="Agrandir"
                              >
                                <Maximize2 size={13} />
                              </button>
                            )}
                          </div>
                          <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-slate-50 aspect-video flex items-center justify-center relative group">
                            {item.diffImageRelPath ? (
                              <img
                                src={item.diffImageRelPath}
                                alt="Diff"
                                className="w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-105"
                                onClick={() =>
                                  setModalImage({
                                    src: item.diffImageRelPath!,
                                    title: `Diff — ${item.snapshot}`,
                                  })
                                }
                              />
                            ) : (
                              <span className="text-xs text-slate-400">
                                Aucun fichier diff
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-4 sm:p-5 bg-rose-50/50 text-rose-700 text-xs font-mono space-y-1">
                      <p className="font-bold">
                        Échec technique avant capture :
                      </p>
                      <p className="leading-relaxed">{item.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="bg-white p-12 sm:p-16 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center min-h-[300px]">
          {availableRuns.length === 0 ? (
            <>
              <CircleSlash size={36} className="text-slate-300 mb-3" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {runs.length === 0
                  ? "Aucun rapport de test visuel disponible"
                  : "Aucun rapport visuel disponible pour ce projet"}
              </p>
            </>
          ) : (
            <>
              <Eye size={36} className="text-slate-300 mb-3" />
              <h3 className="text-sm font-bold text-slate-700 mb-1">
                Aucun run sélectionné
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Veuillez sélectionner une exécution dans le menu déroulant
                ci-dessus pour afficher le rapport de comparaison visuelle.
              </p>
            </>
          )}
        </div>
      )}

      {/* Modal Zoom / Lightbox - TRUE FULLSCREEN */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen animate-in fade-in duration-200 select-none"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Escape") setModalImage(null);
          }}
        >
          {/* Header Plein Écran */}
          <div className="h-14 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 z-50">
            <div className="flex items-center gap-3">
              <span className="font-bold text-xs sm:text-sm text-slate-200 font-mono">
                {modalImage.title}
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded uppercase font-bold">
                Plein Écran
              </span>
            </div>

            <button
              onClick={() => setModalImage(null)}
              title="Fermer"
              aria-label="Fermer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-bold"
            >
              <span>Fermer</span>
              <X size={15} />
            </button>
          </div>

          {/* Corps Plein Écran */}
          <div className="flex-1 w-full h-[calc(100vh-56px)] bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {modalImage.isSlider &&
            modalImage.expectedSrc &&
            modalImage.actualSrc ? (
              <div className="w-full h-full max-w-[95vw] max-h-[90vh] flex flex-col items-center justify-center">
                <ImageComparisonSlider
                  expectedSrc={modalImage.expectedSrc}
                  actualSrc={modalImage.actualSrc}
                  initialZoom={1}
                  isFullScreen={true}
                />
              </div>
            ) : (
              <img
                src={modalImage.src}
                alt="Full View"
                className="max-w-full max-h-[88vh] object-contain rounded-lg shadow-2xl"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
