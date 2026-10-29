import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DashboardClient from "./DashboardClient";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectSelectorProps } from "../../components/ProjectSelector";
import { RunData, TMS_PROJECT_STORAGE_KEY } from "../../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => ""),
}));

// Mock sub-components
vi.mock("../../components/TestResultPieChart", () => ({
  default: ({ title }: { title?: string }) => <div data-testid="pie-chart">Pie Chart {title}</div>,
}));
vi.mock("../../components/ActivityTrendChart", () => ({
  default: () => <div data-testid="activity-chart">Activity Chart</div>,
}));
vi.mock("../../components/DeviceSuccessCards", () => ({
  default: () => <div data-testid="device-cards">Device Cards</div>,
}));
vi.mock("../../components/FlakinessRadar", () => ({
  default: () => <div data-testid="flakiness-radar">Flakiness Radar</div>,
}));
vi.mock("../../components/FailureRadar", () => ({
  default: () => <div data-testid="failure-radar">Failure Radar</div>,
}));
vi.mock("../../components/ComparisonSummaryChart", () => ({
  ComparisonSummaryChart: () => (
    <div data-testid="comparison-summary">Comparison Summary</div>
  ),
}));
vi.mock("../../components/AdvancedKPIs", () => ({
  FeatureHealthChart: () => (
    <div data-testid="feature-health">Feature Health</div>
  ),
  FailureTypeChart: () => <div data-testid="failure-type">Failure Type</div>,
}));
vi.mock("../../components/ProjectSelector", () => ({
  default: ({ onProjectChange, selectedProject }: ProjectSelectorProps) => (
    <select
      data-testid="project-selector"
      value={selectedProject}
      onChange={(e) => onProjectChange(e.target.value)}
    >
      <option value="all">All</option>
      <option value="wse">WeSave</option>
      <option value="tpbp">TPBP</option>
    </select>
  ),
  PROJECTS_CONFIG: [
    { id: "all", label: "All Projects" },
    { id: "wse", label: "WeSave", keywords: ["wse", "wesave"] },
    {
      id: "tpbp",
      label: "TPBP",
      keywords: ["tpbp"],
    },
  ],
}));

const mockHistory: RunData[] = [
  {
    id: "ci run-1",
    date: "2023-10-01",
    stats: {
      total: 10,
      expected: 10,
      unexpected: 0,
      skipped: 0,
      flaky: 0,
      duration: 1000,
    },
    tests: [
      {
        title: "test",
        suite: "suite",
        project: "wse",
        results: [],
        file: "tests/wse/test.spec.ts",
        status: "passed",
        duration: 100,
      },
    ],
  },
];

describe("DashboardClient", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should render the dashboard title", () => {
    render(<DashboardClient history={mockHistory} />);
    expect(screen.getByText("Tableau de Bord")).toBeInTheDocument();
  });

  it('should render the global board when project is "all"', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );
    render(<DashboardClient history={mockHistory} />);
    // "WeSave" is found in the selector and in the project card
    expect(screen.getAllByText("WeSave")[0]).toBeInTheDocument();
    expect(screen.getByText("Pie Chart WeSave")).toBeInTheDocument();
  });

  it("should render project charts when a project is selected", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<DashboardClient history={mockHistory} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
    expect(screen.getByTestId("activity-chart")).toBeInTheDocument();
    expect(screen.getByTestId("flakiness-radar")).toBeInTheDocument();
    expect(screen.getByTestId("failure-radar")).toBeInTheDocument();
    expect(screen.getByTestId("comparison-summary")).toBeInTheDocument();
  });

  it("should render charts when tpbp is selected", () => {
    const tpbpHistory: RunData[] = [
      {
        id: "ci run-2853962646",
        date: "2026-09-16",
        stats: {
          total: 4,
          expected: 0,
          unexpected: 4,
          skipped: 0,
          flaky: 0,
          duration: 5000,
        },
        tests: [
          {
            title: "tpbp test",
            suite: "visual",
            project: "tpbp",
            results: [],
            file: "specs/tpbp/visual/actualisation.feature",
            status: "failed",
            duration: 100,
          },
        ],
      },
    ];

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=tpbp") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<DashboardClient history={tpbpHistory} />);
    expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
  });

  it("should handle project change", () => {
    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: mockReplace,
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(<DashboardClient history={mockHistory} />);

    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "wse" } });

    expect(mockReplace).toHaveBeenCalledWith("?project=wse", {
      scroll: false,
    });
    expect(localStorage.getItem(TMS_PROJECT_STORAGE_KEY)).toBe("wse");
  });

  it("should clean project parameter and clear localStorage when 'all' is selected", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "wse");
    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: mockReplace,
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(<DashboardClient history={mockHistory} />);

    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "all" } });

    expect(mockReplace).toHaveBeenCalledWith("", {
      scroll: false,
    });
    expect(localStorage.getItem(TMS_PROJECT_STORAGE_KEY)).toBeNull();
  });

  it("should fallback to stored project when searchParams has no project", () => {
    localStorage.setItem(TMS_PROJECT_STORAGE_KEY, "b4b");
    const mockReplace = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: mockReplace,
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("") as unknown as ReturnType<typeof useSearchParams>,
    );

    render(<DashboardClient history={mockHistory} />);

    expect(mockReplace).toHaveBeenCalledWith("?project=b4b", {
      scroll: false,
    });
  });

  it('should show "Aucune donnée disponible" when history is empty', () => {
    render(<DashboardClient history={[]} />);
    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });
});
