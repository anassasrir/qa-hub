import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FailureRadar from "./FailureRadar";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TestData } from "../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
  usePathname: vi.fn(() => ""),
}));

describe("FailureRadar", () => {
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
      bfcacheId: "",
    } as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      mockSearchParams as unknown as ReturnType<typeof useSearchParams>,
    );
  });

  it("should render empty state when no tests", () => {
    render(<FailureRadar tests={[]} runId="run-1" />);
    expect(screen.getByText("Aucune donnée")).toBeInTheDocument();
  });

  it("should render success state when all tests pass", () => {
    const mockTests = [{ title: "Test 1", status: "passed" } as TestData];
    render(<FailureRadar tests={mockTests} runId="run-1" />);
    expect(screen.getByText("Tout est au vert")).toBeInTheDocument();
  });

  it("should render flaky warning when there are flaky tests but no failures", () => {
    const mockTests = [{ title: "Test 1", status: "flaky" } as TestData];
    render(<FailureRadar tests={mockTests} runId="run-1" />);
    expect(screen.getByText("Aucun échec")).toBeInTheDocument();
    expect(
      screen.getByText(/des instabilités sont présentes/i),
    ).toBeInTheDocument();
  });

  it("should render failed tests list", () => {
    const mockTests = [
      { title: "Failed Test 1", status: "failed" } as TestData,
      { title: "Unexpected Test 2", status: "unexpected" } as TestData,
    ];
    render(<FailureRadar tests={mockTests} runId="run-1" />);
    expect(screen.getByText("Failed Test 1")).toBeInTheDocument();
    expect(screen.getByText("Unexpected Test 2")).toBeInTheDocument();
  });

  it("should navigate to details on test click", () => {
    const mockTests = [{ title: "Failed Test 1", status: "failed" } as TestData];
    render(<FailureRadar tests={mockTests} runId="run-1" />);

    fireEvent.click(screen.getByText("Failed Test 1"));

    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("/details?"));
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("id=run-1"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("test=Failed+Test+1"),
    );
  });

  it("should limit failed tests to top 5", () => {
    const mockTests = Array.from({ length: 10 }, (_, i) => ({
      title: `Failed Test ${i}`,
      status: "failed",
    } as TestData));
    render(<FailureRadar tests={mockTests} runId="run-1" />);
    const items = screen.getAllByText(/Failed Test/);
    expect(items.length).toBe(5);
  });
});
