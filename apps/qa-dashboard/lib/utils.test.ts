import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  formatDuration,
  computeRunComparison,
  TestData,
  getStoredProject,
  setStoredProject,
  TMS_PROJECT_STORAGE_KEY,
  inferTestCategory,
  computeCategoryBreakdown,
  inferFeatureName,
} from "./utils";

describe("formatDuration", () => {
  it("should format milliseconds correctly", () => {
    expect(formatDuration(500)).toBe("500ms");
  });

  it("should format seconds correctly", () => {
    expect(formatDuration(1500)).toBe("1s");
    expect(formatDuration(59000)).toBe("59s");
  });

  it("should format minutes correctly", () => {
    expect(formatDuration(60000)).toBe("1min 0s");
    expect(formatDuration(61000)).toBe("1min 1s");
    expect(formatDuration(3599000)).toBe("59min 59s");
  });

  it("should format hours correctly", () => {
    expect(formatDuration(3600000)).toBe("1h 0min 0s");
    expect(formatDuration(3661000)).toBe("1h 1min 1s");
    expect(formatDuration(86400000)).toBe("24h 0min 0s");
  });
});

describe("computeRunComparison", () => {
  it("should return null if either run is missing", () => {
    expect(computeRunComparison(null, null)).toBeNull();
    expect(computeRunComparison({ tests: [] }, null)).toBeNull();
    expect(computeRunComparison(null, { tests: [] })).toBeNull();
  });

  it("should detect regressions, improvements, added and removed tests", () => {
    const runA = {
      tests: [
        {
          title: "Test 1 (Regression)",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 2 (Improvement)",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "failed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 3 (Stable Passed)",
          suite: "Suite B",
          file: "suite-b.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 4 (Removed)",
          suite: "Suite B",
          file: "suite-b.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
      ] as TestData[],
    };

    const runB = {
      tests: [
        {
          title: "Test 1 (Regression)",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "failed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 2 (Improvement)",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 3 (Stable Passed)",
          suite: "Suite B",
          file: "suite-b.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test 5 (Added)",
          suite: "Suite C",
          file: "suite-c.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
      ] as TestData[],
    };

    const result = computeRunComparison(runA, runB);
    expect(result).not.toBeNull();
    expect(result!.regressions).toHaveLength(1);
    expect(result!.regressions[0].title).toBe("Test 1 (Regression)");
    expect(result!.improvements).toHaveLength(1);
    expect(result!.improvements[0].title).toBe("Test 2 (Improvement)");
    expect(result!.removed).toHaveLength(1);
    expect(result!.removed[0].title).toBe("Test 4 (Removed)");
    expect(result!.added).toHaveLength(1);
    expect(result!.added[0].title).toBe("Test 5 (Added)");
  });

  it("should return empty arrays when runs are identical", () => {
    const run = {
      tests: [
        {
          title: "Test Stable",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
      ] as TestData[],
    };

    const result = computeRunComparison(run, run);
    expect(result).toEqual({
      regressions: [],
      improvements: [],
      added: [],
      removed: [],
    });
  });

  it("should treat flaky tests as passed and not as regressions", () => {
    const runA = {
      tests: [
        {
          title: "Test Passed to Flaky",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "passed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test Failed to Flaky",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "failed",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test Flaky to Failed",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "flaky",
          duration: 100,
          project: "wse",
          results: [],
        },
      ] as TestData[],
    };

    const runB = {
      tests: [
        {
          title: "Test Passed to Flaky",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "flaky",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test Failed to Flaky",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "flaky",
          duration: 100,
          project: "wse",
          results: [],
        },
        {
          title: "Test Flaky to Failed",
          suite: "Suite A",
          file: "suite-a.spec.ts",
          status: "failed",
          duration: 100,
          project: "wse",
          results: [],
        },
      ] as TestData[],
    };

    const result = computeRunComparison(runA, runB);
    expect(result).not.toBeNull();
    // Test Passed to Flaky is NOT a regression
    expect(result!.regressions).toHaveLength(1);
    expect(result!.regressions[0].title).toBe("Test Flaky to Failed");
    expect(result!.regressions[0].statusA).toBe("flaky");
    expect(result!.regressions[0].statusB).toBe("failed");

    // Test Failed to Flaky IS an improvement
    expect(result!.improvements).toHaveLength(1);
    expect(result!.improvements[0].title).toBe("Test Failed to Flaky");
    expect(result!.improvements[0].statusA).toBe("failed");
    expect(result!.improvements[0].statusB).toBe("flaky");
  });
});

describe("Project Storage Helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("should return null if no project is stored", () => {
    expect(getStoredProject()).toBeNull();
  });

  it("should return null if 'all' is stored", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "all");
    expect(getStoredProject()).toBeNull();
  });

  it("should return the stored project id when set", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "wse");
    expect(getStoredProject()).toBe("wse");
  });

  it("should store a specific project id", () => {
    setStoredProject("b4b");
    expect(localStorage.getItem(TMS_PROJECT_STORAGE_KEY)).toBe("b4b");
    expect(getStoredProject()).toBe("b4b");
  });

  it("should remove the stored project when set to 'all' or empty", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "wse");
    setStoredProject("all");
    expect(localStorage.getItem(TMS_PROJECT_STORAGE_KEY)).toBeNull();
    expect(getStoredProject()).toBeNull();

    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "wse");
    setStoredProject(null);
    expect(localStorage.getItem(TMS_PROJECT_STORAGE_KEY)).toBeNull();
  });
});

describe("inferTestCategory", () => {
  it("should classify visual tests correctly", () => {
    expect(inferTestCategory("specs/tpbp/visual/actualisation.feature")).toBe("visual");
    expect(inferTestCategory("tests/tpbp/visual-tests/login.spec.ts")).toBe("visual");
    expect(inferTestCategory("tests/test.spec.ts", "@visual")).toBe("visual");
    expect(inferTestCategory("tests/test.spec.ts", ["@tpbp", "@visual"])).toBe("visual");
  });

  it("should classify component tests correctly", () => {
    expect(inferTestCategory("specs/tpbp/components/date-picker.feature")).toBe("component");
    expect(inferTestCategory("tests/tpbp/components/form-controls.spec.ts")).toBe("component");
    expect(inferTestCategory("tests/tpbp/vue3-migration/modal.spec.ts")).toBe("component");
    expect(inferTestCategory("tests/test.spec.ts", "@components")).toBe("component");
    expect(inferTestCategory("tests/test.spec.ts", ["@tpbp", "@component"])).toBe("component");
  });

  it("should default to functional tests", () => {
    expect(inferTestCategory("specs/tpbp/budget.feature")).toBe("functional");
    expect(inferTestCategory("tests/wse/auth.spec.ts")).toBe("functional");
    expect(inferTestCategory("tests/b4b/operations.spec.ts")).toBe("functional");
  });
});

describe("computeCategoryBreakdown", () => {
  it("should compute breakdown by category accurately", () => {
    const tests: TestData[] = [
      {
        title: "Test Fonctionnel 1",
        suite: "Suite",
        status: "passed",
        duration: 100,
        file: "specs/tpbp/auth.feature",
        project: "tpbp",
        results: [],
      },
      {
        title: "Test Fonctionnel 2",
        suite: "Suite",
        status: "failed",
        duration: 200,
        file: "specs/tpbp/operations.feature",
        project: "tpbp",
        results: [],
      },
      {
        title: "Test Composant 1",
        suite: "Suite",
        status: "passed",
        duration: 50,
        file: "specs/tpbp/components/date-picker.feature",
        project: "tpbp",
        results: [],
      },
      {
        title: "Test Composant 2",
        suite: "Suite",
        status: "flaky",
        duration: 80,
        file: "specs/tpbp/components/modals.feature",
        project: "tpbp",
        results: [],
      },
      {
        title: "Test Visuel 1",
        suite: "Suite",
        status: "passed",
        duration: 300,
        file: "specs/tpbp/visual/actualisation.feature",
        project: "tpbp",
        results: [],
      },
    ];

    const breakdown = computeCategoryBreakdown(tests);

    expect(breakdown.functional.total).toBe(2);
    expect(breakdown.functional.expected).toBe(1);
    expect(breakdown.functional.unexpected).toBe(1);
    expect(breakdown.functional.duration).toBe(300);

    expect(breakdown.component.total).toBe(2);
    expect(breakdown.component.expected).toBe(1);
    expect(breakdown.component.flaky).toBe(1);
    expect(breakdown.component.duration).toBe(130);

    expect(breakdown.visual.total).toBe(1);
    expect(breakdown.visual.expected).toBe(1);
    expect(breakdown.visual.unexpected).toBe(0);
    expect(breakdown.visual.duration).toBe(300);
  });
});

describe("inferFeatureName", () => {
  it("should categorize TPBP components, visual, and bloc-vous correctly", () => {
    expect(
      inferFeatureName("specs/tpbp/components/date-picker.feature.spec.js"),
    ).toBe("Composants");
    expect(
      inferFeatureName("specs/tpbp/visual/actualisation.feature.spec.js"),
    ).toBe("Tests Visuels");
    expect(
      inferFeatureName("specs/tpbp/bloc-vous/marital-status.feature.spec.js"),
    ).toBe("Bloc Vous");
  });

  it("should categorize TPBP individual features matching /testplan", () => {
    expect(
      inferFeatureName("specs/tpbp/auth.feature.spec.js", "Authentification"),
    ).toBe("Authentification");
    expect(
      inferFeatureName("specs/tpbp/indicators.feature.spec.js", "Indicateurs"),
    ).toBe("Indicateurs");
    expect(
      inferFeatureName("specs/tpbp/navigation.spec.ts", "Navigation"),
    ).toBe("Navigation");
    expect(
      inferFeatureName("specs/tpbp/transmission.feature.spec.js", "Transmission"),
    ).toBe("Transmission");
  });

  it("should categorize B4B and WSE features correctly", () => {
    expect(
      inferFeatureName("specs/b4b/gestion-libre/subscription.feature"),
    ).toBe("Souscription Gestion Libre");
    expect(
      inferFeatureName("specs/b4b/gl-actes-gestion.feature"),
    ).toBe("Gestion Libre");
    expect(
      inferFeatureName("specs/wse/operations.feature.spec.js", "Opérations"),
    ).toBe("Opérations");
    expect(
      inferFeatureName("specs/wse/subscription.feature.spec.js", "Souscription"),
    ).toBe("Souscription");
    expect(
      inferFeatureName("specs/wse/simulator.feature.spec.js", "Simulateur"),
    ).toBe("Simulateur");
  });

  it("should fallback gracefully to clean file title case or Autre", () => {
    expect(inferFeatureName("tests/my-custom-feature.spec.ts")).toBe(
      "My Custom Feature",
    );
    expect(inferFeatureName("")).toBe("Autre");
  });
});


