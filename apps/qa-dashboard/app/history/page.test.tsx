import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HistoryPage from "./page";
import React from "react";
import { getAllRuns } from "../../lib/parseResults";

vi.mock("../../lib/parseResults", () => ({
  getAllRuns: vi.fn(),
}));

vi.mock("./HistoryClient", () => ({
  default: () => <div data-testid="history-client">History Client Mock</div>,
}));

describe("HistoryPage", () => {
  it("renders suspense and history client with runs", () => {
    vi.mocked(getAllRuns).mockReturnValue([]);
    render(<HistoryPage />);
    expect(screen.getByTestId("history-client")).toBeInTheDocument();
  });
});