import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HistoryClient from "./HistoryClient";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RunData, TestData } from "../../lib/utils";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => ""),
}));

vi.mock("../../components/ProjectSelector", () => ({
  default: ({
    onProjectChange,
    selectedProject,
  }: {
    onProjectChange: (v: string) => void;
    selectedProject: string;
  }) => (
    <select
      data-testid="project-selector"
      value={selectedProject}
      onChange={(e) => onProjectChange(e.target.value)}
    >
      <option value="all">All</option>
      <option value="wse">WeSave</option>
    </select>
  ),
  PROJECTS_CONFIG: [
    { id: "all", label: "All Projects" },
    { id: "wse", label: "WeSave", keywords: ["wse", "wesave"] },
  ],
}));

const mockHistory: RunData[] = Array.from({ length: 25 }, (_, i) => ({
  id: `run-${i}`,
  date: `2023-10-${(i + 1).toString().padStart(2, "0")}T12:00:00Z`,
  stats: {
    total: 10,
    expected: i % 2 === 0 ? 10 : 9,
    unexpected: i % 2 === 0 ? 0 : 1,
    skipped: 0,
    flaky: i % 3 === 0 ? 1 : 0,
    duration: 1000 + i * 100,
  },
  tests: [
    {
      file: i % 2 === 0 ? "tests/wse/pass.spec.ts" : "tests/tpbp/fail.spec.ts",
      status: i % 2 === 0 ? "passed" : "failed",
      duration: 1000,
    } as unknown as TestData,
  ],
}));

mockHistory[24] = {
  id: "CI-12345",
  date: "2023-11-01T12:00:00Z",
  project: "iphone",
  stats: {
    total: 10,
    expected: 10,
    unexpected: 0,
    skipped: 0,
    flaky: 0,
    duration: 5000,
  },
  tests: [
    {
      file: "tests/wse/pass.spec.ts",
      status: "passed",
      duration: 1000,
    } as unknown as TestData,
  ],
};

describe("HistoryClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      bfcacheId: "",
    } as ReturnType<typeof useRouter>);
  });

  it("should render the list of runs", () => {
    render(<HistoryClient history={mockHistory} />);
    expect(screen.getByText("CI-12345")).toBeInTheDocument();
  });

  it("should handle project selector changes", () => {
    render(<HistoryClient history={mockHistory} />);

    const projectSelector = screen.getByTestId("project-selector");
    fireEvent.change(projectSelector, { target: { value: "wse" } });

    expect(mockPush).toHaveBeenCalledWith("?project=wse", {
      scroll: false,
    });

    fireEvent.change(projectSelector, { target: { value: "all" } });

    expect(mockPush).toHaveBeenCalledWith("?project=all", {
      scroll: false,
    });
  });

  it("should filter by search input", () => {
    render(<HistoryClient history={mockHistory} />);
    const searchInput = screen.getByPlaceholderText(/Rechercher par ID/i);
    fireEvent.change(searchInput, { target: { value: "nothing" } });
    
    expect(screen.queryByText("CI-12345")).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun résultat pour cette recherche/i)).toBeInTheDocument();
  });

  it("should trigger status and sort selects with all options", () => {
    render(<HistoryClient history={mockHistory} />);
    const selects = screen.getAllByRole("combobox");
    
    // Status select
    fireEvent.change(selects[1], { target: { value: "failed" } });
    expect(screen.queryByText("CI-12345")).not.toBeInTheDocument();

    fireEvent.change(selects[1], { target: { value: "success" } });
    expect(screen.getByText("CI-12345")).toBeInTheDocument();

    fireEvent.change(selects[1], { target: { value: "all" } });

    // Sort select
    fireEvent.change(selects[2], { target: { value: "date-asc" } });
    fireEvent.change(selects[2], { target: { value: "failures-desc" } });
    fireEvent.change(selects[2], { target: { value: "duration-desc" } });
  });

  it("should toggle flaky checkbox", () => {
    render(<HistoryClient history={mockHistory} />);
    const flakyCheckbox = screen.getByLabelText("Flaky uniquement");
    fireEvent.click(flakyCheckbox);
    expect(screen.queryByText("CI-12345")).not.toBeInTheDocument(); // CI run is not flaky
  });

  it("should allow selecting up to 2 runs and display floating comparison bar", () => {
    render(<HistoryClient history={mockHistory} />);
    
    // Initially comparison bar is hidden
    expect(screen.queryByText("Comparaison de Runs")).not.toBeInTheDocument();

    // Select first run
    const checkboxes = screen.getAllByRole("checkbox");
    // index 0 is flaky filter, index 1 is first row's checkbox
    fireEvent.click(checkboxes[1]);

    // Comparison bar should be visible now
    expect(screen.getByText("Comparaison de Runs")).toBeInTheDocument();
    expect(screen.getByText("1 run sélectionné")).toBeInTheDocument();

    // Select second run
    fireEvent.click(checkboxes[2]);
    expect(screen.getByText("2 runs sélectionnés")).toBeInTheDocument();

    // Clear selection
    fireEvent.click(screen.getByText("Vider"));
    expect(screen.queryByText("Comparaison de Runs")).not.toBeInTheDocument();
  });

  it("should navigate to compare page with selected run ids when clicking Compare button", () => {
    render(<HistoryClient history={mockHistory} />);
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // select first run
    fireEvent.click(checkboxes[2]); // select second run

    const compareBtn = screen.getByText(/Comparer \(/);
    fireEvent.click(compareBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/compare"),
    );
  });

  it("should filter history by date using interactive calendar picker", () => {
    render(<HistoryClient history={mockHistory} />);
    const dateBtn = screen.getByTestId("date-picker-button");
    fireEvent.click(dateBtn);

    // Popover is open
    expect(screen.getByTestId("date-picker-popover")).toBeInTheDocument();

    // Test month navigation
    const prevMonthBtn = screen.getByTitle("Mois précédent");
    const nextMonthBtn = screen.getByTitle("Mois suivant");
    fireEvent.click(nextMonthBtn);
    fireEvent.click(prevMonthBtn);

    // Click day 1 (1st click: selects day)
    const dayButtons = screen.getAllByRole("button", { name: /^[0-9]+$/ });
    expect(dayButtons.length).toBeGreaterThan(0);
    fireEvent.click(dayButtons[0]);

    // Popover is still open after 1st click
    expect(screen.getByTestId("date-picker-popover")).toBeInTheDocument();

    // Click day 1 again (2nd click on same day: confirms and closes popover)
    fireEvent.click(dayButtons[0]);

    // Popover is closed now!
    expect(screen.queryByTestId("date-picker-popover")).not.toBeInTheDocument();

    // Re-open popover to test presets
    fireEvent.click(dateBtn);
    expect(screen.getByTestId("date-picker-popover")).toBeInTheDocument();

    // Quick presets test (clicking preset closes popover)
    fireEvent.click(screen.getByText("7 jours"));
    expect(screen.queryByTestId("date-picker-popover")).not.toBeInTheDocument();

    // Clear filter
    const clearBtn = screen.getByTitle("Effacer le filtre date");
    fireEvent.click(clearBtn);
    expect(screen.getByText("Date")).toBeInTheDocument();
  });

  it("should handle pagination clicks if available", () => {
      const { container } = render(<HistoryClient history={mockHistory} />);
      // Just click all buttons to trigger all paths (CI, Local, Pagination, Reset)
      const buttons = container.querySelectorAll("button");
      buttons.forEach(btn => fireEvent.click(btn));
      
      // Ensure it renders something without crashing
      const headings = screen.getAllByText(/Historique/i);
      expect(headings.length).toBeGreaterThan(0);
  });

  it("should filter history appropriately when project filter is set and has 0 tests", () => {
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("project=savings") as unknown as ReturnType<typeof useSearchParams>);

    const customMockHistory: RunData[] = [
      {
        id: "run-no-savings",
        date: "2023-10-01",
        stats: { total: 0, expected: 0, unexpected: 0, skipped: 0, flaky: 0, duration: 0 },
        tests: [{ file: "tests/tpbp/test.spec.ts", status: "passed", duration: 100 } as unknown as TestData],
      }
    ];
    render(<HistoryClient history={customMockHistory} />);
    expect(screen.queryByText("run-no-savings")).not.toBeInTheDocument();
  });
});
