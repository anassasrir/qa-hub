import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TestResultPieChart from "./TestResultPieChart";
import React from "react";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => "/dashboard"),
}));

const mockStats = {
  expected: 80,
  unexpected: 10,
  flaky: 5,
  skipped: 5,
  total: 100,
};

describe("TestResultPieChart", () => {
  it("should render the chart", () => {
    render(<TestResultPieChart stats={mockStats} />);
    expect(screen.getByText("Derniers résultats")).toBeInTheDocument();
  });

  it("should render the custom title", () => {
    render(<TestResultPieChart stats={mockStats} title="Custom Project" />);
    expect(
      screen.getByText("Derniers résultats — Custom Project"),
    ).toBeInTheDocument();
  });

  it("should render the total count and success rate", () => {
    render(<TestResultPieChart stats={mockStats} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText(/80% de succès/)).toBeInTheDocument();
  });

  it("should render correctly with empty stats", () => {
    render(
      <TestResultPieChart
        stats={{ expected: 0, unexpected: 0, flaky: 0, skipped: 0, total: 0 }}
      />,
    );
    expect(screen.getAllByText("0")[0]).toBeInTheDocument();
  });

  it("should trigger onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<TestResultPieChart stats={mockStats} onClick={handleClick} />);
    const card = screen.getByText("Derniers résultats").closest("div");
    expect(card).toBeInTheDocument();
    if (card) {
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);
    }
  });

  it("should navigate to /details when runId is provided and clicked", () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    render(
      <TestResultPieChart stats={mockStats} runId="run-123" project="wse" />,
    );
    const card = screen.getByText("Derniers résultats").closest("div");
    if (card) {
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith("/details?id=run-123&project=wse");
    }
  });
});
