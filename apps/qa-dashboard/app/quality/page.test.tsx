import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import QualityPage from "./page";
import React from "react";
import { getQualityData } from "../../lib/parseQuality";

vi.mock("../../lib/parseQuality", () => ({
  getQualityData: vi.fn(),
}));

vi.mock("./QualityClient", () => ({
  default: () => <div data-testid="quality-client">Quality Client Mock</div>,
}));

describe("QualityPage", () => {
  it("renders suspense and quality client with projects", () => {
    vi.mocked(getQualityData).mockReturnValue([]);
    render(<QualityPage />);
    expect(screen.getByTestId("quality-client")).toBeInTheDocument();
  });
});