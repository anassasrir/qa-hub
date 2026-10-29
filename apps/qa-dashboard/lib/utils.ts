export interface TestStep {
  title: string;
  duration: number;
  error?: {
    message: string;
    stack: string;
  };
  steps?: TestStep[];
}

export interface TestResult {
  status: string;
  duration: number;
  error: {
    message: string;
    stack: string;
  } | null;
  attachments: {
    name: string;
    contentType: string;
    path: string;
  }[];
  steps?: TestStep[];
}

export type TestCategory = "functional" | "component" | "visual";

export interface TestData {
  title: string;
  suite: string;
  status: string;
  duration: number;
  file: string;
  project: string;
  results: TestResult[];
  reportUrl?: string;
  category?: TestCategory;
  tags?: string[];
}

export interface RunStats {
  total: number;
  expected: number;
  unexpected: number;
  skipped: number;
  flaky: number;
  duration: number;
}

export interface CategoryBreakdown {
  functional: RunStats;
  component: RunStats;
  visual: RunStats;
}

/**
 * Infère la catégorie d'un test ('functional' | 'component' | 'visual')
 * à partir du chemin de fichier et/ou des tags du titre.
 */
export function inferTestCategory(
  file?: string,
  titleOrTags?: string | string[],
): TestCategory {
  const f = (file || "").toLowerCase();
  const rawTags = Array.isArray(titleOrTags)
    ? titleOrTags
    : (titleOrTags || "").match(/@[\w-]+/g) || [];
  const tags = rawTags.map((t) => t.toLowerCase());

  if (
    f.includes("/visual/") ||
    f.includes("visual-tests") ||
    f.includes(".visual.") ||
    tags.includes("@visual") ||
    tags.includes("visual")
  ) {
    return "visual";
  }

  if (
    f.includes("/components/") ||
    f.includes("form-controls") ||
    f.includes("modals-nav") ||
    f.includes("vue3-migration") ||
    tags.includes("@components") ||
    tags.includes("@component") ||
    tags.includes("components") ||
    tags.includes("component")
  ) {
    return "component";
  }

  return "functional";
}

/**
 * Calcule la ventilation des statistiques par catégorie (fonctionnel, composant, visuel).
 */
export function computeCategoryBreakdown(tests: TestData[]): CategoryBreakdown {
  const init = (): RunStats => ({
    total: 0,
    expected: 0,
    unexpected: 0,
    skipped: 0,
    flaky: 0,
    duration: 0,
  });

  const breakdown: CategoryBreakdown = {
    functional: init(),
    component: init(),
    visual: init(),
  };

  for (const t of tests) {
    const cat = t.category || inferTestCategory(t.file, t.title);
    const target = breakdown[cat] || breakdown.functional;
    target.total++;
    target.duration += t.duration || 0;
    const status = t.status?.toLowerCase();
    if (status === "passed" || status === "expected") target.expected++;
    else if (status === "failed" || status === "unexpected") target.unexpected++;
    else if (status === "flaky") target.flaky++;
    else if (status === "skipped") target.skipped++;
    else target.expected++;
  }

  return breakdown;
}

export interface RunData {
  id: string;
  date: string;
  project?: string;
  branch?: string;
  environment?: string;
  stats: RunStats;
  tests: TestData[];
}

export interface PlaywrightSuite {
  title: string;
  suites?: PlaywrightSuite[];
  specs?: {
    title: string;
    file: string;
    tags?: string[];
    tests: {
      projectName: string;
      status: string;
      results: {
        status: string;
        duration: number;
        error?: {
          message: string;
          stack: string;
        };
        attachments?: {
          name: string;
          contentType: string;
          path: string;
        }[];
        steps?: TestStep[];
      }[];
    }[];
  }[];
}

export interface PlaywrightJson {
  suites: PlaywrightSuite[];
  config: {
    projects: { name: string }[];
  };
  stats?: {
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
    duration: number;
    expected_duration?: number;
  };
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return `${minutes}min ${remainingSeconds}s`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min ${remainingSeconds}s`;
}

export const THEME = {
  colors: {
    passed: "#76B09A",
    failed: "#933F4D",
    flaky: "#E6B35F",
    skipped: "#A3A3A3",
    empty: "#F3F4F6",
    blue: "#2563EB",
    slate: {
      50: "#F8FAFC",
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      900: "#0F172A",
    }
  },
  radius: {
    "3xl": "24px",
    "4xl": "32px",
    "full": "9999px"
  }
};

export const TMS_PROJECT_STORAGE_KEY = "tms_project";

/**
 * Récupère le projet sauvegardé dans le localStorage.
 * Retourne null si aucun projet spécifique n'est sauvegardé ou s'il s'agit de "all".
 */
export function getStoredProject(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem(TMS_PROJECT_STORAGE_KEY);
    return val && val !== "all" ? val : null;
  } catch {
    return null;
  }
}

/**
 * Enregistre ou supprime le projet sélectionné dans le localStorage.
 * Si le projet est null, indéfini ou "all", l'entrée est supprimée du localStorage.
 */
export function setStoredProject(projectId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  try {
    if (!projectId || projectId === "all") {
      localStorage.removeItem(TMS_PROJECT_STORAGE_KEY);
    } else {
      localStorage.setItem(TMS_PROJECT_STORAGE_KEY, projectId);
    }
  } catch {
    // Ignore les erreurs d'accès au localStorage (ex: navigation privée, quota)
  }
}

export interface ComparisonItem {
  suite: string;
  title: string;
  file: string;
  statusA?: string;
  statusB?: string;
  status?: string;
}

export interface ComparisonResult {
  regressions: ComparisonItem[];
  improvements: ComparisonItem[];
  added: ComparisonItem[];
  removed: ComparisonItem[];
}

/**
 * Compare deux runs de tests pour déterminer les régressions, améliorations, ajouts et retraits de tests.
 * runA correspond au run de référence (ex: run N-1) et runB au run cible (ex: run N).
 */
export function computeRunComparison(
  runA: Pick<RunData, "tests"> | null | undefined,
  runB: Pick<RunData, "tests"> | null | undefined,
): ComparisonResult | null {
  if (!runA || !runB) return null;

  const mapA = new Map(runA.tests.map((t) => [`${t.suite} > ${t.title}`, t]));
  const mapB = new Map(runB.tests.map((t) => [`${t.suite} > ${t.title}`, t]));

  const regressions: ComparisonItem[] = [];
  const improvements: ComparisonItem[] = [];
  const added: ComparisonItem[] = [];
  const removed: ComparisonItem[] = [];

  const isPassed = (status: string) =>
    status === "passed" || status === "expected" || status === "flaky";

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
      const isPassedA = isPassed(testA.status);
      const isPassedB = isPassed(testB.status);

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
}

export interface TestCase {
  id: string;
  title: string;
  steps: { title: string }[];
  file: string;
  automated?: boolean;
  status?: "run" | "skip" | "fixme" | "only";
  tags?: string[];
}

export interface TestSuite {
  id: string;
  title: string;
  testCases: TestCase[];
  file: string;
  automatedCount?: number;
}

/**
 * Détermine le nom de la fonctionnalité (Feature) pour un test de manière cohérente
 * entre /testplan et /details, pour tous les projets.
 */
export function inferFeatureName(
  filePath?: string,
  suiteTitle?: string,
): string {
  const fileNormalized = (filePath || "").replace(/\\/g, "/").toLowerCase();
  const fileName = fileNormalized.split("/").pop() || "";
  const suiteLower = (suiteTitle || "").trim().toLowerCase();

  // 1. Groupes consolidés prioritaires (alignés strictement sur consolidateTestSuites)
  if (
    fileNormalized.includes("/components/") ||
    fileNormalized.includes("tpbp/components") ||
    fileNormalized.startsWith("components/") ||
    fileName.includes("form-controls") ||
    fileName.includes("modals-nav")
  ) {
    return "Composants";
  }

  if (
    fileNormalized.includes("/visual/") ||
    fileNormalized.includes("tpbp/visual") ||
    fileNormalized.includes("visual-tests") ||
    fileNormalized.startsWith("visual/")
  ) {
    return "Tests Visuels";
  }

  if (
    fileNormalized.includes("bloc-vous") ||
    fileNormalized.includes("blocvous") ||
    fileName.includes("relations") ||
    fileName.includes("limitation-professions") ||
    fileName.includes("marital-status") ||
    fileName.includes("minor-profile")
  ) {
    return "Bloc Vous";
  }

  if (
    fileNormalized.includes("bloc-budget") ||
    fileNormalized.includes("blocbudget")
  ) {
    return "Bloc Budget";
  }

  if (
    fileNormalized.includes("b4b/gestion-libre") ||
    fileNormalized.includes("gl-subscription") ||
    fileName.includes("gl-subscription") ||
    suiteLower.startsWith("souscription gl") ||
    (fileName.startsWith("subscription-") && fileNormalized.includes("b4b"))
  ) {
    return "Souscription Gestion Libre";
  }

  if (
    fileName.startsWith("gl-") ||
    fileNormalized.includes("gl-actes-gestion") ||
    suiteLower.includes("gestion libre")
  ) {
    return "Gestion Libre";
  }

  // 2. Si suiteTitle est fourni et pertinent (issu de Feature: ou test.describe)
  if (
    suiteTitle &&
    suiteTitle.trim() !== "" &&
    !suiteTitle.includes(".spec.") &&
    !suiteTitle.includes(".feature") &&
    !suiteTitle.includes("/") &&
    suiteTitle.toLowerCase() !== "untitled" &&
    suiteTitle.toLowerCase() !== "n/a" &&
    suiteTitle.toLowerCase() !== "auth" &&
    suiteTitle.toLowerCase() !== "unknown"
  ) {
    return suiteTitle.trim();
  }

  // 3. Extraction du nom de base sans extension
  const cleanBaseName = fileName
    .replace(/\.feature\.spec\.(js|ts)$/i, "")
    .replace(/\.spec\.(js|ts)$/i, "")
    .replace(/\.feature$/i, "")
    .replace(/\.plan\.md$/i, "");

  const KNOWN_FEATURES: Record<string, string> = {
    auth: "Authentification",
    authentification: "Authentification",
    indicators: "Indicateurs",
    indicateurs: "Indicateurs",
    navigation: "Navigation",
    transmission: "Transmission",
    operations: "Opérations",
    operation: "Opérations",
    subscription: "Souscription",
    souscription: "Souscription",
    simulator: "Simulateur",
    simulateur: "Simulateur",
    consent: "Consentement",
    consentement: "Consentement",
  };

  if (KNOWN_FEATURES[cleanBaseName]) {
    return KNOWN_FEATURES[cleanBaseName];
  }

  // 4. Si suiteTitle est disponible même s'il ne rentrait pas dans le filtre strict
  if (
    suiteTitle &&
    suiteTitle.trim() &&
    !suiteTitle.includes("/") &&
    suiteTitle.toLowerCase() !== "untitled" &&
    suiteTitle.toLowerCase() !== "unknown"
  ) {
    return suiteTitle.trim();
  }

  // 5. Fallback : Formater le nom de fichier propre en Title Case
  if (cleanBaseName && cleanBaseName !== "unknown") {
    return cleanBaseName
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  return "Autre";
}

/**
 * Regroupe les suites par fonctionnalité pour harmoniser l'arborescence (notamment pour TPBP).
 * - Tout ce qui est sous tpbp/components/** -> fonctionnalité "Composants"
 * - Tout ce qui est sous tpbp/visual/** -> fonctionnalité "Tests Visuels"
 * - Tout ce qui est sous tpbp/bloc-vous/** -> fonctionnalité "Bloc Vous"
 */
export function consolidateTestSuites(suites: TestSuite[]): TestSuite[] {
  const result: TestSuite[] = [];

  const tpbpComponentsGroup: TestSuite = {
    id: "tpbp-components",
    title: "Composants",
    file: "tpbp/components",
    testCases: [],
    automatedCount: 0,
  };

  const tpbpVisualGroup: TestSuite = {
    id: "tpbp-visual",
    title: "Tests Visuels",
    file: "tpbp/visual",
    testCases: [],
    automatedCount: 0,
  };

  const tpbpBlocVousGroup: TestSuite = {
    id: "tpbp-bloc-vous",
    title: "Bloc Vous",
    file: "tpbp/bloc-vous",
    testCases: [],
    automatedCount: 0,
  };

  const b4bSouscriptionGlGroup: TestSuite = {
    id: "b4b-souscription-gl",
    title: "Souscription Gestion Libre",
    file: "b4b/gestion-libre",
    testCases: [],
    automatedCount: 0,
  };

  for (const suite of suites) {
    const fileNormalized = (suite.file || "").replace(/\\/g, "/").toLowerCase();
    const titleLower = (suite.title || "").toLowerCase();

    const isTpbpComponent =
      suite.id === "tpbp-components" ||
      fileNormalized.includes("tpbp/components") ||
      fileNormalized.includes("/components/") ||
      fileNormalized.startsWith("components/");

    const isTpbpVisual =
      suite.id === "tpbp-visual" ||
      fileNormalized.includes("tpbp/visual") ||
      fileNormalized.includes("/visual/") ||
      fileNormalized.includes("visual-tests") ||
      fileNormalized.startsWith("visual/");

    const isTpbpBlocVous =
      suite.id === "tpbp-bloc-vous" ||
      fileNormalized.includes("tpbp/bloc-vous") ||
      fileNormalized.includes("bloc-vous") ||
      fileNormalized.includes("blocvous");

    const isB4bSouscriptionGl =
      suite.id === "b4b-souscription-gl" ||
      fileNormalized.includes("b4b/gestion-libre") ||
      fileNormalized.includes("gl-subscription") ||
      titleLower.startsWith("souscription gl");

    if (isTpbpComponent) {
      tpbpComponentsGroup.testCases.push(...suite.testCases);
      tpbpComponentsGroup.automatedCount =
        (tpbpComponentsGroup.automatedCount || 0) +
        (suite.automatedCount || 0);
    } else if (isTpbpVisual) {
      tpbpVisualGroup.testCases.push(...suite.testCases);
      tpbpVisualGroup.automatedCount =
        (tpbpVisualGroup.automatedCount || 0) + (suite.automatedCount || 0);
    } else if (isTpbpBlocVous) {
      tpbpBlocVousGroup.testCases.push(...suite.testCases);
      tpbpBlocVousGroup.automatedCount =
        (tpbpBlocVousGroup.automatedCount || 0) +
        (suite.automatedCount || 0);
    } else if (isB4bSouscriptionGl) {
      b4bSouscriptionGlGroup.testCases.push(...suite.testCases);
      b4bSouscriptionGlGroup.automatedCount =
        (b4bSouscriptionGlGroup.automatedCount || 0) +
        (suite.automatedCount || 0);
    } else {
      result.push(suite);
    }
  }

  if (tpbpBlocVousGroup.testCases.length > 0) {
    result.push(tpbpBlocVousGroup);
  }
  if (tpbpComponentsGroup.testCases.length > 0) {
    result.push(tpbpComponentsGroup);
  }
  if (tpbpVisualGroup.testCases.length > 0) {
    result.push(tpbpVisualGroup);
  }
  if (b4bSouscriptionGlGroup.testCases.length > 0) {
    result.push(b4bSouscriptionGlGroup);
  }

  result.sort((a, b) =>
    a.title.localeCompare(b.title, "fr", { sensitivity: "base" }),
  );

  return result;
}

