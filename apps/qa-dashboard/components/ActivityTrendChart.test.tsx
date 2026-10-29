import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActivityTrendChart from "./ActivityTrendChart";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RunData } from "../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => ""),
}));

const mockHistory: RunData[] = [
  {
    id: "CI Run - 2749114565",
    date: "2026-08-11T02:07:30.187Z",
    stats: {
      total: 10,
      expected: 7,
      unexpected: 1,
      skipped: 1,
      flaky: 1,
      duration: 1000,
    },
    tests: [],
  },
  {
    id: "Local Run - 2026-08-31T12-15-13-726Z",
    date: "2026-08-31T12:15:13.726Z",
    stats: {
      total: 10,
      expected: 8,
      unexpected: 0,
      skipped: 1,
      flaky: 1,
      duration: 1000,
    },
    tests: [],
  },
];

describe("ActivityTrendChart", () => {
  it("should render the chart title", () => {
    render(<ActivityTrendChart history={mockHistory} />);
    expect(screen.getByText("Historique d'activité")).toBeInTheDocument();
  });

  it("should handle bar click and navigate to details", () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      bfcacheId: "",
    } as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<ActivityTrendChart history={mockHistory} />);

    const barChart = screen.getByTestId("bar-chart");

    // Simulate Recharts onClick payload
    fireEvent.click(barChart, {
      activePayload: [
        {
          payload: {
            id: "Local Run - 2026-08-31T12-15-13-726Z",
          },
        },
      ],
    });

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("/details?project=wse&id=Local+Run+-+2026-08-31T12-15-13-726Z"),
    );
  });

  it("should format chart data correctly", () => {
    render(<ActivityTrendChart history={mockHistory} />);
    // The responsive container should exist
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    // The bar chart mock should render our data values
    const bars = screen.getAllByTestId("bar");
    expect(bars.length).toBeGreaterThan(0);
  });
});
