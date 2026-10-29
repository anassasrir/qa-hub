import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import DetailsPage from "./page";
import React from "react";
import { getAllRuns } from "../../lib/parseResults";

vi.mock("../../lib/parseResults", () => ({
  getAllRuns: vi.fn(),
}));

// Mock DetailsClient to avoid rendering complex interactive child
vi.mock("./DetailsClient", () => ({
  default: () => <div data-testid="details-client">Details Client Mock</div>,
}));

describe("DetailsPage", () => {
  it("renders suspense and details client with runs", () => {
    vi.mocked(getAllRuns).mockReturnValue([]);
    render(<DetailsPage />);
    expect(screen.getByTestId("details-client")).toBeInTheDocument();
  });
});