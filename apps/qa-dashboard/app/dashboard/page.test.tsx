import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";
import React from "react";
import { getAllRuns } from "../../lib/parseResults";
import { RunData, RunStats } from "../../lib/utils";

vi.mock("../../lib/parseResults", () => ({
  getAllRuns: vi.fn(),
}));

const EMPTY_STATS: RunStats = {
  total: 0,
  expected: 0,
  unexpected: 0,
  skipped: 0,
  flaky: 0,
  duration: 0,
};

// Mock DashboardClient to avoid complex rendering
vi.mock("./DashboardClient", () => ({
  default: ({ history }: { history: RunData[] }) => (
    <div data-testid="dashboard-client">{history.length} runs</div>
  ),
}));

describe("DashboardPage", () => {
  it("should render DashboardClient with history", () => {
    vi.mocked(getAllRuns).mockReturnValue([
      { id: "run-1", date: "2023-10-01", stats: EMPTY_STATS, tests: [] },
      { id: "run-2", date: "2023-10-02", stats: EMPTY_STATS, tests: [] },
    ]);
    render(<DashboardPage />);
    expect(screen.getByTestId("dashboard-client")).toHaveTextContent("2 runs");
  });
});
