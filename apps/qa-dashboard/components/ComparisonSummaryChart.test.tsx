import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonSummaryChart } from "./ComparisonSummaryChart";
import React from "react";
import { RunData } from "../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => "/dashboard"),
}));

const mockRunsWithDiffs: RunData[] = [
  // history[0] = Latest Run (Run B)
  {
    id: "CI Run - 200",
    date: "2026-09-02T10:00:00.000Z",
    stats: {
      total: 3,
      expected: 2,
      unexpected: 1,
      skipped: 0,
      flaky: 0,
      duration: 5000,
    },
    tests: [
      {
        title: "Test Regression",
        suite: "Auth Suite",
        project: "wse",
        file: "tests/auth.spec.ts",
        status: "failed",
        duration: 200,
        results: [],
      },
      {
        title: "Test Improvement",
        suite: "Auth Suite",
        project: "wse",
        file: "tests/auth.spec.ts",
        status: "passed",
        duration: 150,
        results: [],
      },
      {
        title: "Test Added",
        suite: "Billing Suite",
        project: "wse",
        file: "tests/billing.spec.ts",
        status: "passed",
        duration: 180,
        results: [],
      },
      {
        title: "Test Stable",
        suite: "Profile Suite",
        project: "wse",
        file: "tests/profile.spec.ts",
        status: "passed",
        duration: 120,
        results: [],
      },
    ],
  },
  // history[1] = Previous Run (Run A)
  {
    id: "CI Run - 199",
    date: "2026-09-01T10:00:00.000Z",
    stats: {
      total: 3,
      expected: 2,
      unexpected: 1,
      skipped: 0,
      flaky: 0,
      duration: 4800,
    },
    tests: [
      {
        title: "Test Regression",
        suite: "Auth Suite",
        project: "wse",
        file: "tests/auth.spec.ts",
        status: "passed",
        duration: 210,
        results: [],
      },
      {
        title: "Test Improvement",
        suite: "Auth Suite",
        project: "wse",
        file: "tests/auth.spec.ts",
        status: "failed",
        duration: 160,
        results: [],
      },
      {
        title: "Test Removed",
        suite: "Legacy Suite",
        project: "wse",
        file: "tests/legacy.spec.ts",
        status: "passed",
        duration: 110,
        results: [],
      },
      {
        title: "Test Stable",
        suite: "Profile Suite",
        project: "wse",
        file: "tests/profile.spec.ts",
        status: "passed",
        duration: 120,
        results: [],
      },
    ],
  },
];

describe("ComparisonSummaryChart", () => {
  it("should render empty state when history has fewer than 2 runs", () => {
    const { rerender } = render(<ComparisonSummaryChart history={[]} />);
    expect(
      screen.getByTestId("comparison-summary-empty"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Comparaison inter-runs"),
    ).toBeInTheDocument();

    rerender(<ComparisonSummaryChart history={[mockRunsWithDiffs[0]]} />);
    expect(
      screen.getByTestId("comparison-summary-empty"),
    ).toBeInTheDocument();
  });

  it("should render compact square card with signed deltas when changes exist", () => {
    render(
      <ComparisonSummaryChart
        history={mockRunsWithDiffs}
        project="wse"
      />,
    );

    // Card link
    const card = screen.getByTestId("comparison-summary-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute(
      "href",
      "/compare?run1=CI+Run+-+199&run2=CI+Run+-+200&project=wse",
    );

    // Header runs
    expect(screen.getByText("Évolution Inter-Runs")).toBeInTheDocument();
    expect(screen.getByText("#199")).toBeInTheDocument();
    expect(screen.getByText("#200")).toBeInTheDocument();

    // Deltas
    expect(screen.getByTestId("delta-improvements")).toHaveTextContent(
      "1 test repassé au vert",
    );
    expect(screen.getByTestId("delta-regressions")).toHaveTextContent(
      "1 test en régression",
    );
    expect(screen.getByTestId("delta-added")).toHaveTextContent("1 test en plus");
    expect(screen.getByTestId("delta-removed")).toHaveTextContent("1 test en moins");
    expect(screen.getByText("Voir le comparatif")).toBeInTheDocument();
  });

  it("should render 'Pas de différence de résultat des tests' when there are no changes between runs", () => {
    const identicalRunA = {
      ...mockRunsWithDiffs[0],
      id: "CI Run - 100",
    };
    const identicalRunB = {
      ...mockRunsWithDiffs[0],
      id: "CI Run - 101",
    };

    render(
      <ComparisonSummaryChart
        history={[identicalRunB, identicalRunA]}
        project="wse"
      />,
    );

    const noChangesView = screen.getByTestId("no-changes-view");
    expect(noChangesView).toBeInTheDocument();
    expect(
      screen.getByText("Pas de différence de résultat des tests"),
    ).toBeInTheDocument();
  });
});
