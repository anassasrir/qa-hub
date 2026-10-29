import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import VisualPage from "./page";
import React from "react";
import { getAllVisualRuns, VisualRunData } from "../../lib/parseVisual";

vi.mock("../../lib/parseVisual", () => ({
  getAllVisualRuns: vi.fn(),
}));

vi.mock("./VisualClient", () => ({
  default: ({ runs }: { runs: VisualRunData[] }) => (
    <div data-testid="visual-client">{runs.length} visual runs</div>
  ),
}));

describe("VisualPage", () => {
  it("renders suspense and visual client with runs", () => {
    vi.mocked(getAllVisualRuns).mockReturnValue([
      {
        pipelineId: "2874347016",
        jobId: "16675940167",
        branch: "test/tpbp-enable-design-system",
        commitHash: "9cac636",
        commitSubject: "chore(visual): disabled retries",
        runTimestamp: "2026-09-23T12:56:07.064Z",
        environment: "tpbp-visual",
        project: "tpbp-visual",
        stats: {
          total: 1,
          failed: 1,
          avgDiffRatio: 0.1,
          maxDiffRatio: 0.1,
          categories: {},
        },
        items: [],
      },
    ]);

    render(<VisualPage />);
    expect(screen.getByTestId("visual-client")).toHaveTextContent("1 visual runs");
  });
});
