import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CompareClient from "./CompareClient";
import React from "react";
import { useSearchParams } from "next/navigation";
import { RunData } from "../../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => "/compare"),
}));

const mockHistory: RunData[] = [
  {
    id: "CI Run - A",
    date: "2026-08-10T02:07:30.187Z",
    stats: {
      total: 2,
      expected: 1,
      unexpected: 1,
      skipped: 0,
      flaky: 0,
      duration: 1000,
    },
    tests: [
      {
        title: "Test Regression",
        suite: "Suite 1",
        project: "wse",
        results: [],
        file: "tests/wse/test.spec.ts",
        status: "passed",
        duration: 100,
      },
      {
        title: "Test Improvement",
        suite: "Suite 1",
        project: "wse",
        results: [],
        file: "tests/wse/test.spec.ts",
        status: "failed",
        duration: 100,
      },
    ],
  },
  {
    id: "CI Run - B",
    date: "2026-08-11T02:07:30.187Z",
    stats: {
      total: 3,
      expected: 2,
      unexpected: 1,
      skipped: 0,
      flaky: 0,
      duration: 1000,
    },
    tests: [
      {
        title: "Test Regression",
        suite: "Suite 1",
        project: "wse",
        results: [],
        file: "tests/wse/test.spec.ts",
        status: "failed",
        duration: 100,
      },
      {
        title: "Test Improvement",
        suite: "Suite 1",
        project: "wse",
        results: [],
        file: "tests/wse/test.spec.ts",
        status: "passed",
        duration: 100,
      },
      {
        title: "Test Added",
        suite: "Suite 2",
        project: "wse",
        results: [],
        file: "tests/wse/added.spec.ts",
        status: "passed",
        duration: 100,
      },
    ],
  },
];

describe("CompareClient", () => {
  it("should render selection empty state when no runs selected", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<CompareClient history={mockHistory} />);
    expect(screen.getByText("En attente de comparaison")).toBeInTheDocument();
    expect(
      screen.getByText(/Sélectionnez deux runs de la CI différents/i),
    ).toBeInTheDocument();
  });

  it("should render comparison metrics and test differences when two runs are provided", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "run1=CI Run - A&run2=CI Run - B",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<CompareClient history={mockHistory} />);

    // Check headings
    expect(screen.getByText("Comparaison des Runs")).toBeInTheDocument();
    expect(screen.getByText("TESTS EN RÉGRESSION (1)")).toBeInTheDocument();
    expect(screen.getByText("TESTS REPASSÉS AU VERT (1)")).toBeInTheDocument();
    expect(screen.getByText("TESTS EN PLUS (1)")).toBeInTheDocument();

    // Check specific tests
    expect(screen.getByText("Test Regression")).toBeInTheDocument();
    expect(screen.getByText("Test Improvement")).toBeInTheDocument();
    expect(screen.getByText("Test Added")).toBeInTheDocument();
  });

  it("should handle project specific filtering correctly", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "run1=CI Run - A&run2=CI Run - B&project=wse",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<CompareClient history={mockHistory} />);
    expect(screen.getByText("Test Regression")).toBeInTheDocument();
    expect(screen.getByText("Test Improvement")).toBeInTheDocument();
    expect(screen.queryByText(/Passé dans A/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Passé dans B/i)).not.toBeInTheDocument();
  });

  it("should link regression tests to details page with preselected test and run", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "run1=CI Run - A&run2=CI Run - B&project=wse",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<CompareClient history={mockHistory} />);
    const regressionLink = screen.getByText("Test Regression").closest("a");
    expect(regressionLink).toHaveAttribute(
      "href",
      "/details?id=CI%20Run%20-%20B&test=Test%20Regression&project=wse",
    );
  });

  it("should allow selecting runs via dropdown and resetting selection", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<CompareClient history={mockHistory} />);

    // Open first RunSelector
    const triggerA = screen.getByText("Sélectionner un run de référence...");
    fireEvent.click(triggerA);

    // Search input should be visible
    const searchInputs = screen.getAllByPlaceholderText(
      "Rechercher une CI pipeline...",
    );
    expect(searchInputs.length).toBeGreaterThan(0);
    fireEvent.change(searchInputs[0], { target: { value: "Run - A" } });

    // Select CI Run - A
    const optionA = screen.getAllByText("CI Run - A");
    fireEvent.click(optionA[0]);

    // Reset button should now be visible
    const resetBtn = screen.getByTitle("Réinitialiser");
    expect(resetBtn).toBeInTheDocument();
    fireEvent.click(resetBtn);

    // Trigger should revert to placeholder
    expect(
      screen.getByText("Sélectionner un run de référence..."),
    ).toBeInTheDocument();
  });
});
