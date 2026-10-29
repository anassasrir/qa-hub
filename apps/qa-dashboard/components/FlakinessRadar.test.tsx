import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FlakinessRadar from "./FlakinessRadar";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => ""),
}));

describe("FlakinessRadar", () => {
  const mockPush = vi.fn();
  const mockSearchParams = new URLSearchParams("project=tms");

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
    );
  });

  it("should render empty state when no tests", () => {
    render(<FlakinessRadar tests={[]} runId="run-1" />);
    expect(screen.getByText("Aucune donnée")).toBeInTheDocument();
  });

  it("should render success state when all tests pass perfectly", () => {
    const mockTests = [
      {
        title: "Test 1",
        status: "passed",
        results: [{ status: "passed", duration: 100, error: null, attachments: [] }],
      },
    ];
    render(<FlakinessRadar tests={mockTests} runId="run-1" />);
    expect(screen.getByText("Tout est au vert")).toBeInTheDocument();
  });

  it("should render failure warning when there are failed tests but no flakiness", () => {
    const mockTests = [
      {
        title: "Test 1",
        status: "failed",
        results: [{ status: "failed", duration: 100, error: { message: "Fail", stack: "" }, attachments: [] }],
      },
    ];
    render(<FlakinessRadar tests={mockTests} runId="run-1" />);
    expect(screen.getByText(/Pas d'instabilité/i)).toBeInTheDocument();
    expect(screen.getByText(/Des échecs sont présents/i)).toBeInTheDocument();
  });

  it("should render flaky tests list with attempt counts", () => {
    const mockTests = [
      {
        title: "Flaky Test 1",
        status: "flaky",
        results: [
          { status: "failed", duration: 100, error: { message: "Fail", stack: "" }, attachments: [] },
          { status: "passed", duration: 100, error: null, attachments: [] },
        ],
      }, // 2 attempts
      {
        title: "Very Flaky Test 2",
        status: "flaky",
        results: [
          { status: "failed", duration: 100, error: { message: "Fail", stack: "" }, attachments: [] },
          { status: "failed", duration: 100, error: { message: "Fail", stack: "" }, attachments: [] },
          { status: "passed", duration: 100, error: null, attachments: [] },
        ],
      }, // 3 attempts
    ];
    render(<FlakinessRadar tests={mockTests} runId="run-1" />);

    expect(screen.getByText("Flaky Test 1")).toBeInTheDocument();
    expect(screen.getByText("Very Flaky Test 2")).toBeInTheDocument();
  });

  it("should navigate to details on flaky test click", () => {
    const mockTests = [
      {
        title: "Flaky Test 1",
        status: "flaky",
        results: [
          { status: "failed", duration: 100, error: { message: "Fail", stack: "" }, attachments: [] },
          { status: "passed", duration: 100, error: null, attachments: [] },
        ],
      },
    ];
    render(<FlakinessRadar tests={mockTests} runId="run-1" />);

    fireEvent.click(screen.getByText("Flaky Test 1"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/details?"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("id=run-1"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("test=Flaky+Test+1"),
    );
  });

  it("should sort and limit flaky tests", () => {
    const mockTests = Array.from({ length: 10 }, (_, i) => ({
      title: `Flaky ${i}`,
      status: "flaky",
      results: Array(i + 1).fill({ status: "passed", duration: 100, error: null, attachments: [] }),
    }));
    render(<FlakinessRadar tests={mockTests} runId="run-1" />);
    const items = screen.getAllByText(/Flaky \d/);
    expect(items.length).toBe(5);
    // The most flaky (Flaky 9) should be first
    expect(items[0]).toHaveTextContent("Flaky 9");
  });
});
