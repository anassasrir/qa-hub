"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  Beaker,
  Search,
  CircleSlash,
  ArrowRightToLine,
  X,
  Play,
  ImageIcon,
  FileCode,
  ExternalLink,
  AlertCircle,
  Plus,
  Minus,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Focus,
  ListTree,
  BookOpen,
  Activity,
  Copy,
  Check,
  Eye,
  Folder,
  FolderOpen,
  Layers,
  Monitor,
  Smartphone,
} from "lucide-react";
import {
  formatDuration,
  RunData,
  TestData,
  TestResult,
  THEME,
  TestStep,
  inferTestCategory,
  TestCategory,
  inferFeatureName,
} from "../../lib/utils";
import ProjectSelector, {
  PROJECTS_CONFIG,
} from "../../components/ProjectSelector";

// Logos SVG officiels
const ChromeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M12 12m-5.45 0a5.45 5.45 0 1 0 10.9 0 5.45 5.45 0 1 0 -10.9 0"
    />
    <path
      fill="#EA4335"
      d="M12 6.07A5.94 5.94 0 0 1 17.72 10.3l3.6-6.24A12 12 0 0 0 12 0c-4.32 0-8.1 2.29-10.32 5.73l4.31 7.46A6.07 6.07 0 0 1 12 6.07z"
    />
    <path
      fill="#FBBC05"
      d="M5.89 10.3c-.45 1.25-.68 2.6-.68 4 0 4.14 2.21 7.78 5.49 9.8l3.9-6.75A6.07 6.07 0 0 1 5.89 10.3z"
    />
    <path
      fill="#34A853"
      d="M14.6 13.5c-1.32.82-2.84 1.32-4.5 1.32-2.14 0-4.04-.84-5.49-2.21l-3.6 6.24c2.22 3.44 6 5.73 10.32 5.73 4.31 0 8.1-.84 10.32-2.21L18.23 16c-1.04 1.83-2.6 3.25-4.53 3.84z"
    />
  </svg>
);

const FirefoxLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#FF7139"
      d="M23.91,12.18c0.04,3.04-0.68,4.82-0.68,4.82s0.59-2.39,0-5.25c-0.59-2.86-2.37-5.52-4.12-7.3c-0.45-0.45-0.88-0.86-1.29-1.23c0.33,0.24,0.65,0.5,0.96,0.78c0,0-0.48-1.56-2.28-2.5c-1.8-0.94-3.75-0.8-3.75-0.8s1.25,0.7,1.25,1.8c0,1.1-0.9,1.6-2,1.6c-1.1,0-2.2-0.6-2.5-2.1c0,0-0.28,1.15,0.25,2.5c0.53,1.35,1.25,2,1.75,2.5z"
    />
    <path
      fill="#FFC131"
      d="M9.5,14c-1,1.5-1,4,1,5.5c2,1.5,4,0.5,4.5,0c0.5-0.5,1-1.5,0.5-3c0,0,0.5,1,0,2c-0.5,1-1.07,1.47-2.5,1"
    />
    <path
      fill="#004A9E"
      d="M12,24c4.31,0,8.1-.84,10.32-2.21L18.23 16c-1.04 1.83-2.6 3.25-4.53 3.84z"
    />
  </svg>
);

const SafariLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="#FFFFFF"
      stroke="#006DFF"
      strokeWidth="1"
    />
    <path
      fill="#006DFF"
      d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z"
    />
    <path
      fill="#EA4335"
      d="M17.65,7.15l-3.3,9.9c-0.1,0.3-0.3,0.5-0.6,0.6l-9.9,3.3C3.45,21.05,3.15,20.65,3.25,20.25l3.3-9.9 c0.1-0.3,0.3-0.5,0.6-0.6l9.9-3.3C17.45,6.35,17.75,6.75,17.65,7.15z M12.5,11.5c-0.3-0.3-0.7-0.3-1,0s-0.3,0.7,0,1s0.7,0.3,1,0 S12.8,11.8,12.5,11.5z"
    />
  </svg>
);

const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="#000000" className={className}>
    <path d="M18.71,19.5c-0.83,1.24-1.71,2.45-3.1,2.48c-1.34,0.03-1.77-0.79-3.29-0.79c-1.53,0-2.01,0.77-3.27,0.82 c-1.31,0.05-2.33-1.32-3.19-2.55C4.1,17.06,2.8,12.58,4.55,9.54c0.87-1.51,2.46-2.47,4.2-2.5c1.31-0.02,2.56,0.9,3.36,0.9 c0.8,0,2.33-1.12,3.91-0.96c0.66,0.03,2.53,0.27,3.73,1.97c-0.1,0.06-2.22,1.29-2.2,3.81c0.03,3.03,2.62,4.07,2.65,4.08 C20.19,16.89,19.54,18.26,18.71,19.5z M13,5.19c0.85-1.02,1.41-2.44,1.25-3.86c-1.22,0.05-2.7,0.81-3.58,1.84 c-0.79,0.92-1.47,2.37-1.28,3.75C10.7,7.01,12.12,6.23,13,5.19z" />
  </svg>
);

const AndroidLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#3DDC84"
      d="M17.52,11.2c0.46,0,0.84-0.38,0.84-0.84c0-0.46-0.38-0.84-0.84-0.84c-0.46,0-0.84,0.38-0.84,0.84 C16.68,10.82,17.06,11.2,17.52,11.2z M6.48,11.2c0.46,0,0.84-0.38,0.84-0.84c0-0.46-0.38-0.84-0.84-0.84 c-0.46,0-0.84,0.38-0.84,0.84C5.64,10.82,6.02,11.2,6.48,11.2z M17.88,12.88c0.11,0,0.2-0.09,0.2-0.2V11 c0-3.32-2.68-6-6-6s-6,2.68-6,6v1.68c0,0.11,0.09,0.2,0.2,0.2H17.88z M12,2C10.02,2,8.19,2.77,6.81,4.02L5.41,2.62 C5.22,2.43,4.9,2.43,4.71,2.62c-0.19,0.19-0.19,0.51,0,0.7l1.4,1.4C4.65,6.31,4,8.49,4,10.84V13c0,0.55,0.45,1,1,1h14 c0.55,0,1-0.45,1-1v-2.16c0-2.35-0.65-4.53-2.11-6.12l1.4-1.4c0.19-0.19,0.19-0.51,0-0.7c-0.19-0.19-0.51-0.19-0.7,0l-1.4,1.4 C15.81,2.77,13.98,2,12,2z"
    />
  </svg>
);

const getBusinessProject = (filePath: string) => {
  if (!filePath) return "Autre";
  const pathLower = filePath.toLowerCase();
  for (const config of PROJECTS_CONFIG) {
    if (config.keywords && config.keywords.some((kw) => pathLower.includes(kw)))
      return config.label;
  }
  return "Autre";
};

const getTestData = (filePath: string, title?: string, suite?: string) => {
  if (!filePath)
    return {
      project: "Inconnu",
      fileName: "N/A",
      feature: "Autre",
      category: "functional" as TestCategory,
    };
  const parts = filePath.split("/");
  const fileName = parts[parts.length - 1];
  const projectLabel = getBusinessProject(filePath);
  const category = inferTestCategory(filePath, title);
  const feature = inferFeatureName(filePath, suite);

  return { project: projectLabel, fileName, feature, category };
};

const DEVICE_CONFIG = [
  { id: "chrome", label: "Chrome", logo: ChromeLogo },
  { id: "firefox", label: "Firefox", logo: FirefoxLogo },
  { id: "safari", label: "Safari", logo: SafariLogo },
  { id: "iphone", label: "iPhone", logo: AppleLogo },
  { id: "android", label: "Android", logo: AndroidLogo },
];

const STATUS_CONFIG = [
  {
    id: "success",
    label: "Succès",
    icon: CheckCircle2,
    color: THEME.colors.passed,
  },
  { id: "failed", label: "Échecs", icon: XCircle, color: THEME.colors.failed },
  {
    id: "flaky",
    label: "Instables",
    icon: CircleSlash,
    color: THEME.colors.flaky,
  },
  {
    id: "skipped",
    label: "Ignorés",
    icon: ArrowRightToLine,
    color: THEME.colors.skipped,
  },
];

const stripAnsi = (str: string) => {
  if (!str) return "";
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{4,}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    "",
  );
};

function ReproductionSteps({
  steps,
  depth = 0,
}: {
  steps?: TestStep[];
  depth?: number;
}) {
  if (!steps || steps.length === 0) return null;

  const hasErrorSomewhere = (step: TestStep): boolean => {
    if (step.error) return true;
    if (step.steps) return step.steps.some(hasErrorSomewhere);
    return false;
  };

  const failureIndex = steps.findIndex((step) => hasErrorSomewhere(step));
  const visibleSteps =
    failureIndex !== -1 ? steps.slice(0, failureIndex + 1) : steps;

  const cleanSteps = visibleSteps.filter((step) => {
    if (
      depth === 0 &&
      !hasErrorSomewhere(step) &&
      (step.title.startsWith("browserContext") ||
        step.title.startsWith("fixture"))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div
      className={`space-y-3 ${depth > 0 ? "ml-4 border-l-2 border-slate-100 pl-4 mt-3" : ""}`}
    >
      {cleanSteps.map((step, idx) => {
        const isFailed = !!step.error;
        const containsFailure = hasErrorSomewhere(step);

        return (
          <div key={idx} className="group/step">
            <div className="flex items-start gap-3 py-1">
              <div
                className="text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-lg flex-shrink-0 border"
                style={{
                  backgroundColor: isFailed
                    ? `${THEME.colors.failed}10`
                    : containsFailure
                      ? `${THEME.colors.flaky}10`
                      : "transparent",
                  borderColor: isFailed
                    ? `${THEME.colors.failed}30`
                    : containsFailure
                      ? `${THEME.colors.flaky}30`
                      : THEME.colors.slate[100],
                  color: isFailed
                    ? THEME.colors.failed
                    : containsFailure
                      ? THEME.colors.flaky
                      : THEME.colors.slate[400],
                }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className="text-xs font-semibold leading-tight"
                  style={
                    isFailed
                      ? { color: THEME.colors.failed }
                      : { color: THEME.colors.slate[500] }
                  }
                >
                  {step.title}
                  <span className="text-[10px] font-mono text-slate-400 ml-2 opacity-0 group-hover/step:opacity-100 transition-opacity">
                    {formatDuration(step.duration)}
                  </span>
                </p>
                {step.steps && containsFailure && (
                  <ReproductionSteps steps={step.steps} depth={depth + 1} />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
        className={`absolute ${position === "top" ? "bottom-full mb-2" : "top-full mt-2"} left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-100 z-[100] whitespace-nowrap shadow-xl`}
      >
        {label}
        <div
          className={`absolute ${position === "top" ? "top-full -mt-1 border-t-slate-900" : "bottom-full -mb-1 border-b-slate-900"} left-1/2 -translate-x-1/2 border-4 border-transparent`}
        ></div>
      </div>
    </div>
  );
}

export default function DetailsClient({ allRuns }: { allRuns: RunData[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const runId = searchParams.get("id");
  const projectFilter = searchParams.get("project") || "all";
  const statusParam = searchParams.get("status");
  const categoryParam = searchParams.get("category");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilters, setStatusFilters] = useState<string[]>(() =>
    statusParam ? statusParam.split(",") : [],
  );
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [tagFilter, setTagFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState<string>(
    categoryParam || "all",
  );

  const [prevStatusParam, setPrevStatusParam] = useState(statusParam);
  if (prevStatusParam !== statusParam) {
    setPrevStatusParam(statusParam);
    if (statusParam) {
      setStatusFilters(statusParam.split(","));
    }
  }

  const [prevCategoryParam, setPrevCategoryParam] = useState(categoryParam);
  if (prevCategoryParam !== categoryParam) {
    setPrevCategoryParam(categoryParam);
    if (categoryParam) {
      setCategoryFilter(categoryParam);
    }
  }

  const [collapsedFeatures, setCollapsedFeatures] = useState<Set<string>>(
    new Set(),
  );
  const [selectedTest, setSelectedTest] = useState<TestData | null>(null);
  const [selectedRetryIndex, setSelectedRetryIndex] = useState(0);

  const [prevProject, setPrevProject] = useState(projectFilter);
  if (prevProject !== projectFilter) {
    setPrevProject(projectFilter);
    setSelectedTest(null);
  }

  const [copiedTestTitle, setCopiedTestTitle] = useState<string | null>(null);

  const handleCopyTestTitle = (title: string) => {
    const cleanTitle = title.replace(/@[\w-]+/g, "").trim();
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanTitle).catch(() => {});
    }
    setCopiedTestTitle(title);
    setTimeout(() => setCopiedTestTitle(null), 2000);
  };

  const testTitleParam = searchParams.get("test");
  const [lastProcessedTest, setLastProcessedTest] = useState<string | null>(
    null,
  );

  const tableHeaderRef = useRef<HTMLDivElement>(null);

  const currentRun = useMemo(() => {
    if (runId) return allRuns.find((r) => r.id === runId);

    if (projectFilter === "all") {
      const compositeTests: TestData[] = [];
      const seenTestTitles = new Set<string>();

      PROJECTS_CONFIG.filter((p) => p.id !== "all").forEach((project) => {
        const keywords = project.keywords || [project.id];

        for (const run of allRuns) {
          const projectTests = run.tests.filter((t) =>
            keywords.some((kw) => t.file.toLowerCase().includes(kw)),
          );

          if (projectTests.length > 0) {
            projectTests.forEach((test) => {
              const uniqueKey = `${test.title}-${test.project}-${test.file}`;
              if (!seenTestTitles.has(uniqueKey)) {
                compositeTests.push(test);
                seenTestTitles.add(uniqueKey);
              }
            });
            break;
          }
        }
      });

      return {
        id: "Composite View",
        date: "État actuel (Tous les projets)",
        tests: compositeTests,
        stats: {
          total: compositeTests.length,
          expected: compositeTests.filter(
            (t) => t.status === "passed" || t.status === "expected",
          ).length,
          unexpected: compositeTests.filter(
            (t) => t.status === "failed" || t.status === "unexpected",
          ).length,
          flaky: compositeTests.filter((t) => t.status === "flaky").length,
          skipped: compositeTests.filter((t) => t.status === "skipped").length,
          duration: compositeTests.reduce((acc, t) => acc + t.duration, 0),
        },
      };
    }

    const targetLabel = PROJECTS_CONFIG.find(
      (p) => p.id === projectFilter,
    )?.label;
    const runWithData = allRuns.find((run) =>
      run.tests.some(
        (t: TestData) => getBusinessProject(t.file) === targetLabel,
      ),
    );
    return runWithData || allRuns[0];
  }, [runId, allRuns, projectFilter]);

  if (testTitleParam && testTitleParam !== lastProcessedTest && currentRun) {
    const targetTest = currentRun.tests.find(
      (t: TestData) => t.title === testTitleParam,
    );
    if (targetTest) {
      setLastProcessedTest(testTitleParam);
      setSearchTerm("");
      if (statusParam) {
        setStatusFilters(statusParam.split(","));
      } else {
        setStatusFilters([]);
      }
      setTagFilter("all");
      setSelectedDevices([]);
      const { feature } = getTestData(
        targetTest.file,
        targetTest.title,
        targetTest.suite,
      );
      setCollapsedFeatures((prev) => {
        const next = new Set(prev);
        next.delete(feature);
        return next;
      });
      setSelectedTest(targetTest);
      const results = targetTest.results || [];
      const failedIdx = results.findIndex((r) => {
        const s = r.status?.toLowerCase();
        return s === "failed" || s === "unexpected" || r.error;
      });
      setSelectedRetryIndex(
        failedIdx !== -1 ? failedIdx : Math.max(0, results.length - 1),
      );
    }
  }

  const handleTestClick = (test: TestData) => {
    if (
      selectedTest?.title === test.title &&
      selectedTest?.file === test.file &&
      selectedTest?.project === test.project
    ) {
      setSelectedTest(null);
    } else {
      setSelectedTest(test);
      const results = test.results || [];
      const failedIdx = results.findIndex((r) => {
        const s = r.status?.toLowerCase();
        return s === "failed" || s === "unexpected" || r.error;
      });
      setSelectedRetryIndex(
        failedIdx !== -1 ? failedIdx : Math.max(0, results.length - 1),
      );
    }
  };

  useEffect(() => {
    if (selectedTest) {
      const timer = setTimeout(() => {
        tableHeaderRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedTest]);

  const handleProjectChange = (projectId: string) => {
    setSelectedTest(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("project", projectId);
    params.delete("test");
    params.delete("file");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId],
    );
  };

  const toggleStatus = (statusId: string) => {
    setStatusFilters((prev) =>
      prev.includes(statusId)
        ? prev.filter((id) => id !== statusId)
        : [...prev, statusId],
    );
  };

  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilters([]);
    setSelectedDevices([]);
    setTagFilter("all");
    setCategoryFilter("all");
    router.push(window.location.pathname, { scroll: false });
  };

  const isFiltered =
    searchTerm !== "" ||
    statusFilters.length > 0 ||
    projectFilter !== "all" ||
    selectedDevices.length > 0 ||
    tagFilter !== "all" ||
    categoryFilter !== "all";
  const getTestTags = (t: TestData): string[] => {
    const fromTags = (t.tags || []).map((tag) => (tag.startsWith("@") ? tag : `@${tag}`));
    const fromTitle = (t.title || "").match(/@[\w-]+/g) || [];
    const fromSuite = (t.suite || "").match(/@[\w-]+/g) || [];
    return Array.from(new Set([...fromTags, ...fromTitle, ...fromSuite]));
  };

  const { tags } = useMemo(() => {
    if (!currentRun) return { tags: [] };
    const tSet = new Set<string>();
    currentRun.tests.forEach((t: TestData) => {
      getTestTags(t).forEach((tag) => tSet.add(tag));
    });
    return { tags: Array.from(tSet).sort() };
  }, [currentRun]);

  const filteredTests = useMemo(() => {
    if (!currentRun) return [];
    const targetLabel =
      projectFilter !== "all"
        ? PROJECTS_CONFIG.find((p) => p.id === projectFilter)?.label
        : "all";
    return (currentRun.tests as TestData[])
      .filter((test) => {
        const { project } = getTestData(test.file, test.title, test.suite);
        const device = test.project?.toLowerCase() || "";
        const testTags = getTestTags(test);
        const matchesSearch =
          test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (test.file &&
            test.file.toLowerCase().includes(searchTerm.toLowerCase()));

        const status = test.status?.toLowerCase();
        const matchesStatus =
          statusFilters.length === 0 ||
          statusFilters.some((sf) => {
            if (sf === "success")
              return status === "passed" || status === "expected";
            if (sf === "failed")
              return status === "failed" || status === "unexpected";
            return status === sf;
          });

        const matchesProject = targetLabel === "all" || project === targetLabel;
        const matchesDevice =
          selectedDevices.length === 0 ||
          selectedDevices.some((d) => {
            if (d === "chrome") return device.includes("chrome") || device.includes("chromium");
            if (d === "firefox") return device.includes("firefox");
            if (d === "safari") return device.includes("safari") || device.includes("webkit");
            if (d === "iphone") return device.includes("iphone") || device.includes("ios");
            if (d === "android") return device.includes("android") || device.includes("pixel") || device.includes("mobile");
            return device.includes(d);
          });
        const matchesTag =
          tagFilter === "all" ||
          (tagFilter === "no-tag"
            ? testTags.length === 0
            : testTags.includes(tagFilter));

        const cat = test.category || inferTestCategory(test.file, test.title);
        const matchesCategory =
          categoryFilter === "all" || cat === categoryFilter;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesProject &&
          matchesDevice &&
          matchesTag &&
          matchesCategory
        );
      })
      .sort((a, b) => {
        const statusRank: Record<string, number> = {
          failed: 0,
          unexpected: 0,
          skipped: 1,
          flaky: 2,
          passed: 3,
          expected: 3,
        };
        const rankA = statusRank[a.status?.toLowerCase()] ?? 4;
        const rankB = statusRank[b.status?.toLowerCase()] ?? 4;

        if (rankA !== rankB) return rankA - rankB;
        return a.title.localeCompare(b.title);
      });
  }, [
    currentRun,
    searchTerm,
    statusFilters,
    projectFilter,
    selectedDevices,
    tagFilter,
    categoryFilter,
  ]);

  const groupedByFeature = useMemo(() => {
    const groups: Record<string, TestData[]> = {};
    filteredTests.forEach((test) => {
      const { feature } = getTestData(test.file, test.title, test.suite);
      if (!groups[feature]) groups[feature] = [];
      groups[feature].push(test);
    });
    return groups;
  }, [filteredTests]);

  const toggleFeature = (feature: string) => {
    const newCollapsed = new Set(collapsedFeatures);
    if (newCollapsed.has(feature)) newCollapsed.delete(feature);
    else newCollapsed.add(feature);
    setCollapsedFeatures(newCollapsed);
  };

  const currentResult = selectedTest?.results?.[selectedRetryIndex];
  const isSuccessStatus = (currentResult?.status || selectedTest?.status || "")
    .toLowerCase()
    .includes("passed");
  const isFlakyOverall = selectedTest?.status?.toLowerCase() === "flaky";

  const renderTestRow = (test: TestData, i: number, isPromoted = false) => {
    const isSelected =
      selectedTest?.title === test.title &&
      selectedTest?.file === test.file &&
      selectedTest?.project === test.project;
    const status = test.status?.toLowerCase();
    const isPassed = status === "passed" || status === "expected";
    const isFailed = status === "failed" || status === "unexpected";
    const isFlaky = status === "flaky";

    return (
      <div
        key={i}
        onClick={() => handleTestClick(test)}
        className={`w-full px-2.5 py-2 rounded-xl transition-all flex items-start justify-between cursor-pointer gap-2 group/tc ${
          isSelected
            ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
            : "hover:bg-slate-50 text-slate-700"
        }`}
      >
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="pt-0.5 shrink-0">
            {isPassed && (
              <Tooltip label="Succès">
                <CheckCircle2
                  size={14}
                  style={{ color: THEME.colors.passed }}
                />
              </Tooltip>
            )}
            {isFailed && (
              <Tooltip label="Échec">
                <XCircle size={14} style={{ color: THEME.colors.failed }} />
              </Tooltip>
            )}
            {isFlaky && (
              <Tooltip label="Instable">
                <CircleSlash size={14} style={{ color: THEME.colors.flaky }} />
              </Tooltip>
            )}
            {!isPassed && !isFailed && !isFlaky && (
              <Tooltip label="Ignoré">
                <ArrowRightToLine size={14} className="text-slate-300" />
              </Tooltip>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 group/title">
              <p
                className={`text-xs font-semibold leading-snug break-words [overflow-wrap:anywhere] transition-colors ${
                  isSelected
                    ? "text-blue-700 font-bold"
                    : "text-slate-700 group-hover/tc:text-blue-600"
                }`}
              >
                {test.title.replace(/@[\w-]+/g, "").trim()}
              </p>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyTestTitle(test.title);
                }}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-blue-600 cursor-pointer shrink-0"
                title="Copier le nom du test"
              >
                {copiedTestTitle === test.title ? (
                  <Check className="w-3 h-3 text-emerald-500 animate-in zoom-in-50 duration-150" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {test.results && test.results.length > 1 && (
                <span
                  className="inline-flex items-center gap-1 text-[8px] font-bold uppercase px-1.5 py-0.2 rounded border"
                  style={{
                    color: THEME.colors.flaky,
                    backgroundColor: `${THEME.colors.flaky}15`,
                    borderColor: `${THEME.colors.flaky}30`,
                  }}
                >
                  {test.results.length} tentatives
                </span>
              )}
              <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-200">
                {getTestData(test.file, test.title, test.suite).project}
              </span>
              {test.project && (
                <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1 py-0.2 rounded border border-blue-200">
                  {test.project.toLowerCase().includes("mobile") ? (
                    <Smartphone size={9} className="text-blue-600" />
                  ) : (
                    <Monitor size={9} className="text-blue-600" />
                  )}
                  {test.project.toLowerCase().includes("chromium")
                    ? "Chromium"
                    : test.project.toLowerCase().includes("mobile")
                      ? "Mobile"
                      : test.project.replace(/^.*-/, "")}
                </span>
              )}
              {(() => {
                const cat =
                  test.category || inferTestCategory(test.file, test.title);
                if (cat === "component") {
                  return (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200">
                      Composant
                    </span>
                  );
                }
                if (cat === "visual") {
                  return (
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      Visuel
                    </span>
                  );
                }
                return null;
              })()}
              {isPromoted && (
                <span className="text-[8px] font-bold uppercase text-white bg-blue-600 px-1.5 py-0.2 rounded flex items-center gap-0.5 shadow-sm">
                  <Focus size={8} /> Actif
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <span className="font-mono text-[9px] font-bold text-slate-400">
            {formatDuration(test.duration)}
          </span>
          <ChevronRight
            size={12}
            className={`transition-transform duration-200 ${
              isSelected ? "text-blue-600 rotate-90" : "text-slate-300 group-hover/tc:translate-x-0.5"
            }`}
          />
        </div>
      </div>
    );
  };

  if (!currentRun) return null;

  return (
    <div className="space-y-6 p-6 md:p-10 max-w-[1600px] mx-auto relative font-sans text-slate-900">
      {/* Header Section */}
      <div
        ref={tableHeaderRef}
        className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Beaker className="text-blue-600 w-6 h-6" />
              Rapport de Test
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>
          <ProjectSelector
            selectedProject={projectFilter}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold font-mono">
            {filteredTests.length} scénarios &bull;{" "}
            {formatDuration(
              filteredTests.reduce((acc, t) => acc + t.duration, 0),
            )}
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher un scénario..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-blue-200 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto shrink-0 justify-between lg:justify-start">
            {/* Multi-Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Statut :
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {STATUS_CONFIG.map((status) => {
                  const isSelected = statusFilters.includes(status.id);
                  const Icon = status.icon;
                  return (
                    <Tooltip
                      key={status.id}
                      label={status.label}
                      position="bottom"
                    >
                      <button
                        onClick={() => toggleStatus(status.id)}
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

            {/* Platform/Browser Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Plateforme :
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                {DEVICE_CONFIG.map((device) => {
                  const isSelected = selectedDevices.includes(device.id);
                  return (
                    <Tooltip
                      key={device.id}
                      label={device.label}
                      position="bottom"
                    >
                      <button
                        onClick={() => toggleDevice(device.id)}
                        className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                          isSelected
                            ? "bg-white shadow-sm ring-1 ring-slate-200/80"
                            : "opacity-40 grayscale hover:opacity-100"
                        }`}
                      >
                        <device.logo className="w-4 h-4" />
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <div className="h-4 w-px bg-slate-200 hidden xl:block"></div>

            {/* Tag Filter */}
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-blue-200 cursor-pointer transition-all min-w-[120px]"
            >
              <option value="all">Tous les Tags</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 hidden xl:block"></div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:bg-white focus:border-blue-200 cursor-pointer transition-all"
            >
              <option value="all">Toutes Catégories</option>
              <option value="functional">Fonctionnel</option>
              <option value="component">Composants</option>
              <option value="visual">Visuel & Snapshots</option>
            </select>

            {/* Reset Button */}
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
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Scenarios Worktree Card */}
        <div className="w-full lg:w-[42%] xl:w-[38%] shrink-0 min-w-0 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 bg-slate-50/40 border-b border-slate-100 flex justify-between items-center gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex gap-1.5 shrink-0">
                <button
                  onClick={() => setCollapsedFeatures(new Set())}
                  title="Tout déplier"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-blue-600 hover:bg-blue-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() =>
                    setCollapsedFeatures(new Set(Object.keys(groupedByFeature)))
                  }
                  title="Tout plier"
                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-all border border-slate-200 shadow-sm cursor-pointer"
                >
                  <Minus size={13} />
                </button>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <Layers size={14} className="text-blue-600 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-tight truncate">
                  Arborescence des Scénarios
                </h3>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono shrink-0">
              {Object.keys(groupedByFeature).length} fonct. &bull; {filteredTests.length} tests
            </span>
          </div>

          <div className="p-3 sm:p-4 divide-y divide-slate-100/60 max-h-[750px] overflow-y-auto space-y-2">
            {/* Grouped Features Worktree */}
            {Object.entries(groupedByFeature)
              .sort(([a], [b]) => a.localeCompare(b, "fr", { sensitivity: "base" }))
              .map(([feature, tests]) => {
              const isCollapsed = collapsedFeatures.has(feature);
              const failedTestsCount = tests.filter(
                (t) => t.status === "failed" || t.status === "unexpected",
              ).length;
              const flakyTestsCount = tests.filter((t) => t.status === "flaky").length;

              return (
                <div key={feature} className="pt-1.5 first:pt-0">
                  {/* Feature Node */}
                  <div
                    onClick={() => toggleFeature(feature)}
                    className="group w-full px-3 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer gap-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFeature(feature);
                        }}
                        title={isCollapsed ? "Déplier la suite" : "Replier la suite"}
                        className="text-slate-400 group-hover:text-blue-600 hover:bg-slate-200/60 rounded p-0.5 transition-colors shrink-0 cursor-pointer"
                      >
                        {isCollapsed ? (
                          <ChevronRight size={13} />
                        ) : (
                          <ChevronDown size={13} className="text-blue-600" />
                        )}
                      </span>
                      <div className="text-blue-600 shrink-0">
                        {isCollapsed ? (
                          <Folder size={14} />
                        ) : (
                          <FolderOpen size={14} />
                        )}
                      </div>
                      <span
                        className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate"
                        title={feature}
                      >
                        {feature}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {failedTestsCount > 0 && (
                        <span
                          style={{
                            color: THEME.colors.failed,
                            backgroundColor: `${THEME.colors.failed}15`,
                            borderColor: `${THEME.colors.failed}30`,
                          }}
                          className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border"
                        >
                          {failedTestsCount} {failedTestsCount > 1 ? "échecs" : "échec"}
                        </span>
                      )}
                      {flakyTestsCount > 0 && (
                        <span
                          style={{
                            color: THEME.colors.flaky,
                            backgroundColor: `${THEME.colors.flaky}15`,
                            borderColor: `${THEME.colors.flaky}30`,
                          }}
                          className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border"
                        >
                          {flakyTestsCount} inst.
                        </span>
                      )}
                      <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {tests.length}
                      </span>
                    </div>
                  </div>

                  {/* Test Cases Nested Under Feature */}
                  {!isCollapsed && (
                    <div className="mt-1 ml-5 pl-2.5 border-l-2 border-slate-100 space-y-1">
                      {tests.map((test, i) => renderTestRow(test, i))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredTests.length === 0 && (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-xs font-semibold text-slate-400 italic">
                  Aucun scénario trouvé correspondant aux filtres.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Sticky Details Panel or Placeholder */}
        <div className="flex-1 w-full min-w-0">
          {selectedTest ? (
            <div className="sticky top-[24px] animate-in fade-in slide-in-from-right-4 duration-300 self-start">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl flex flex-col max-h-[calc(100vh-100px)] overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-white">
                  <div className="flex justify-between items-start mb-3">
                    <div className="min-w-0 pr-4">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                          {selectedTest.title.replace(/@[\w-]+/g, "").trim()}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopyTestTitle(selectedTest.title)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors shrink-0 cursor-pointer"
                          title="Copier le nom du test"
                        >
                          {copiedTestTitle === selectedTest.title ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-50 duration-150" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {getTestData(selectedTest.file, selectedTest.title, selectedTest.suite).project}
                        </span>
                        {selectedTest.project && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {selectedTest.project.toLowerCase().includes("mobile") ? (
                              <Smartphone size={10} className="text-blue-600" />
                            ) : (
                              <Monitor size={10} className="text-blue-600" />
                            )}
                            {selectedTest.project.toLowerCase().includes("chromium")
                              ? "Chromium"
                              : selectedTest.project.toLowerCase().includes("mobile")
                                ? "Mobile"
                                : selectedTest.project.replace(/^.*-/, "")}
                          </span>
                        )}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {(() => {
                          const cat =
                            selectedTest.category ||
                            inferTestCategory(
                              selectedTest.file,
                              selectedTest.title,
                            );
                          if (cat === "component") {
                            return (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                Composant
                              </span>
                            );
                          }
                          if (cat === "visual") {
                            return (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                Visuel
                              </span>
                            );
                          }
                          return (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              Fonctionnel
                            </span>
                          );
                        })()}
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        {formatDuration(selectedTest.duration)} total
                      </div>

                      {/* Display test tags as badges */}
                      {(() => {
                        const testTags = getTestTags(selectedTest);
                        if (testTags.length === 0) return null;
                        return (
                          <div className="flex flex-wrap items-center gap-1 mt-2">
                            {testTags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        <Link
                          href={`/testplan?test=${encodeURIComponent(selectedTest.title.replace(/@[\w-]+/g, "").trim())}&file=${encodeURIComponent(selectedTest.file.replace("tests/", "").replace(".spec.ts", ".feature"))}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100 text-xs font-bold shrink-0"
                        >
                          <BookOpen size={12} />
                          <span>Plan de Test</span>
                        </Link>

                        {/* Trace Playwright: ONLY display if trace exists! */}
                        {(() => {
                          const hasTrace =
                            Boolean(selectedTest.reportUrl) ||
                            Boolean(selectedTest.results?.some((r) =>
                              r.attachments?.some(
                                (a) =>
                                  a.name === "trace" ||
                                  a.path?.toLowerCase().endsWith(".zip"),
                              ),
                            ));

                          if (!hasTrace) return null;

                          const traceUrl =
                            selectedTest.reportUrl ||
                            selectedTest.results
                              ?.flatMap((r) => r.attachments || [])
                              .find(
                                (a) =>
                                  a.name === "trace" ||
                                  a.path?.toLowerCase().endsWith(".zip"),
                              )?.path;

                          return (
                            <a
                              href={traceUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all border border-purple-100 text-xs font-bold shrink-0"
                            >
                              <Activity size={12} />
                              <span>Trace Playwright</span>
                            </a>
                          );
                        })()}

                        {/* Comparateur Visuel: ONLY display if test is visual! */}
                        {(() => {
                          const isVisual =
                            selectedTest.category === "visual" ||
                            selectedTest.file?.toLowerCase().includes("visual") ||
                            selectedTest.title?.toLowerCase().includes("@visual") ||
                            selectedTest.tags?.includes("@visual");

                          if (!isVisual) return null;

                          return (
                            <Link
                              href={`/visual?id=${(runId || "").replace("CI Run - ", "").replace("CI-", "").trim()}`}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-500 hover:text-white transition-all border border-amber-200 text-xs font-bold shrink-0"
                            >
                              <Eye size={12} />
                              <span>Comparateur Visuel</span>
                            </Link>
                          );
                        })()}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTest(null)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 transition-all flex-shrink-0 cursor-pointer"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {selectedTest.results && selectedTest.results.length > 1 && (
                    <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl mt-3">
                      {selectedTest.results.map(
                        (res: TestResult, idx: number) => {
                          const isSelected = selectedRetryIndex === idx;
                          const rs = res.status?.toLowerCase();
                          const isSuccess = rs === "passed" || rs === "expected";
                          return (
                            <button
                              key={idx}
                              onClick={() => setSelectedRetryIndex(idx)}
                              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "text-slate-500 hover:text-slate-900"
                              }`}
                            >
                              {isSuccess ? (
                                <CheckCircle2
                                  size={11}
                                  style={{ color: THEME.colors.passed }}
                                />
                              ) : (
                                <XCircle
                                  size={11}
                                  style={{ color: THEME.colors.failed }}
                                />
                              )}
                              {idx === 0
                                ? "Exécution initiale"
                                : `Nouvelle tentative (${idx})`}
                            </button>
                          );
                        },
                      )}
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/20">
                  {isFlakyOverall && (
                    <div
                      className="p-3.5 rounded-2xl flex items-start gap-2.5 border"
                      style={{
                        backgroundColor: `${THEME.colors.flaky}10`,
                        borderColor: `${THEME.colors.flaky}30`,
                      }}
                    >
                      <AlertCircle
                        size={15}
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: THEME.colors.flaky }}
                      />
                      <div>
                        <h4
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: THEME.colors.flaky }}
                        >
                          Tentative Instable
                        </h4>
                        <p
                          className="text-[11px] mt-0.5 leading-relaxed"
                          style={{ color: THEME.colors.flaky }}
                        >
                          Ce scénario a fini par réussir après un ou plusieurs
                          échecs.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentResult?.steps && currentResult.steps.length > 0 && (
                    <div className="space-y-2.5">
                      <div
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg border w-fit"
                        style={{
                          color: isSuccessStatus
                            ? THEME.colors.passed
                            : THEME.colors.failed,
                          backgroundColor: isSuccessStatus
                            ? `${THEME.colors.passed}10`
                            : `${THEME.colors.failed}10`,
                          borderColor: isSuccessStatus
                            ? `${THEME.colors.passed}30`
                            : `${THEME.colors.failed}30`,
                        }}
                      >
                        <ListTree size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {isSuccessStatus
                            ? "Étapes du scénario"
                            : "Étapes de reproduction"}{" "}
                          ({currentResult.steps.length})
                        </span>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                        <ReproductionSteps steps={currentResult.steps} />
                      </div>
                    </div>
                  )}

                  {currentResult?.attachments &&
                    currentResult.attachments.length > 0 && (
                      <div className="space-y-3">
                        {currentResult.attachments.map(
                          (
                            att: {
                              name: string;
                              contentType: string;
                              path: string;
                            },
                            idx: number,
                          ) => {
                            const isImage =
                              att.contentType?.includes("image") ||
                              att.name === "screenshot";
                            return (
                              <div key={idx} className="space-y-1.5 group">
                                <div className="flex justify-between items-center px-1">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                    {isImage ? (
                                      <ImageIcon size={12} />
                                    ) : (
                                      <Play size={12} />
                                    )}
                                    {isImage ? "Capture d'écran" : "Vidéo"}
                                  </span>
                                  <a
                                    href={att.path}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 uppercase"
                                  >
                                    Ouvrir <ExternalLink size={10} />
                                  </a>
                                </div>
                                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 group-hover:border-blue-200 transition-colors">
                                  {isImage ? (
                                    <Image
                                      src={att.path}
                                      alt={att.name}
                                      width={800}
                                      height={600}
                                      className="w-full h-auto cursor-zoom-in"
                                      onClick={() =>
                                        window.open(att.path, "_blank")
                                      }
                                      unoptimized
                                    />
                                  ) : (
                                    <video
                                      src={att.path}
                                      controls
                                      className="w-full h-full"
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  {!currentResult?.error &&
                    (!currentResult?.attachments ||
                      currentResult?.attachments.length === 0) && (
                      <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-2.5">
                          {isSuccessStatus ? (
                            <CheckCircle2
                              size={20}
                              style={{ color: THEME.colors.passed }}
                            />
                          ) : (
                            <XCircle
                              size={20}
                              style={{ color: THEME.colors.failed }}
                            />
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Aucun détail supplémentaire
                        </p>
                      </div>
                    )}
                  {currentResult?.error && (
                    <div className="space-y-2.5">
                      <div
                        className="flex items-center gap-2 px-2.5 py-1 rounded-lg border w-fit"
                        style={{
                          color: THEME.colors.failed,
                          backgroundColor: `${THEME.colors.failed}10`,
                          borderColor: `${THEME.colors.failed}30`,
                        }}
                      >
                        <FileCode size={13} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Stacktrace
                        </span>
                      </div>
                      <div className="bg-slate-900 rounded-2xl p-4 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {stripAnsi(
                            currentResult.error.stack ||
                              currentResult.error.message,
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full py-36 bg-white rounded-3xl border border-slate-100 text-center space-y-3 shadow-sm">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Beaker size={28} />
              </div>
              <div className="space-y-1 px-6">
                <h3 className="text-base font-bold text-slate-800">
                  Sélectionnez un scénario
                </h3>
                <p className="text-slate-400 max-w-md mx-auto text-xs leading-relaxed">
                  Cliquez sur un test dans l&apos;arborescence à gauche pour afficher le détail de son exécution, ses étapes et ses traces.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
