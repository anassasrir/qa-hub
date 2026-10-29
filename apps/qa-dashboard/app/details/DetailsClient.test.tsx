import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DetailsClient from "./DetailsClient";
import React from "react";
import { ProjectSelectorProps } from "../../components/ProjectSelector";
import { RunData } from "../../lib/utils";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams("id=run-123");
const mockRouter = {
  push: mockPush,
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
  usePathname: () => "",
}));

vi.mock("../../components/ProjectSelector", () => ({
  default: ({ onProjectChange, selectedProject }: ProjectSelectorProps) => (
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
    { id: "wse", label: "WeSave", keywords: ["wse", "wesave", "savings"] },
  ],
}));

// mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockRuns: RunData[] = [
  {
    id: "run-123",
    date: "2023-10-01",
    tests: [
      {
        title: "Login success",
        suite: "auth",
        file: "tests/savings/auth.spec.ts",
        project: "chrome",
        status: "passed",
        duration: 1000,
        results: [
          {
            status: "passed",
            duration: 1000,
            error: null,
            attachments: [],
          },
        ],
      },
      {
        title: "Login failed @flaky",
        suite: "auth",
        file: "tests/savings/auth.spec.ts",
        project: "iphone",
        status: "flaky",
        duration: 2000,
        results: [
          {
            status: "failed",
            duration: 1000,
            error: { message: "Timeout Error", stack: "" },
            attachments: [],
            steps: [
              {
                title: "Step 1 failed",
                duration: 100,
                error: { message: "Fail", stack: "" },
              },
            ],
          },
          {
            status: "passed",
            duration: 1000,
            error: null,
            attachments: [],
          },
        ],
      },
      {
        title: "Some unknown test",
        suite: "unknown",
        file: "unknown.spec.ts",
        project: "firefox",
        status: "skipped",
        duration: 0,
        results: [],
      },
      {
        title: "Datepicker component test",
        suite: "components",
        file: "specs/tpbp/components/date-picker.feature",
        project: "chrome",
        status: "passed",
        duration: 500,
        category: "component",
        results: [],
      },
    ],
    stats: {
      total: 4,
      expected: 2,
      unexpected: 0,
      flaky: 1,
      skipped: 1,
      duration: 3500,
    },
  },
];

describe("DetailsClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("id=run-123");
  });

  it("should render the list of tests", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    expect(screen.getByText("Login success")).toBeInTheDocument();
    expect(screen.getByText("Login failed")).toBeInTheDocument(); // Title is stripped of tags
  });

  it("should filter by search term", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    const searchInput = screen.getByPlaceholderText(
      "Rechercher un scénario...",
    );
    fireEvent.change(searchInput, { target: { value: "failed" } });

    expect(screen.queryByText("Login success")).not.toBeInTheDocument();
    expect(screen.getByText("Login failed")).toBeInTheDocument();
  });

  it("should filter by tag", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    const selects = screen.getAllByRole("combobox");
    const tagSelect = selects[1];
    fireEvent.change(tagSelect, { target: { value: "@flaky" } });

    expect(screen.queryByText("Login success")).not.toBeInTheDocument();
    expect(screen.getByText("Login failed")).toBeInTheDocument();
  });

  it("should filter by category", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    const selects = screen.getAllByRole("combobox");
    const categorySelect = selects[2];
    fireEvent.change(categorySelect, { target: { value: "component" } });

    expect(screen.queryByText("Login success")).not.toBeInTheDocument();
    expect(screen.getByText("Datepicker component test")).toBeInTheDocument();
  });

  it("should expand and collapse features", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    // The feature group row has the text "Authentification"
    const featureRow = screen.getByText("Authentification");

    // Collapse
    fireEvent.click(featureRow);
    expect(screen.queryByText("Login success")).not.toBeInTheDocument();

    // Expand
    fireEvent.click(featureRow);
    expect(screen.getByText("Login success")).toBeInTheDocument();
  });

  it("should show test details and handle retries", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    // Click test to show details
    fireEvent.click(screen.getByText("Login failed"));

    // By default, the failed retry should be selected
    // The failed attempt has "Timeout Error"
    expect(screen.getByText("Timeout Error")).toBeInTheDocument();
    expect(screen.getByText("Step 1 failed")).toBeInTheDocument();

    // Click on the passed retry (Nouvelle tentative (1))
    const retryButton = screen.getByText(/Nouvelle tentative/i);
    fireEvent.click(retryButton);

    // Error should not be visible anymore
    expect(screen.queryByText("Timeout Error")).not.toBeInTheDocument();
  });

  it("should render attachments and handle image click", () => {
    const runWithAttachments: RunData = {
      ...mockRuns[0],
      tests: [
        {
          ...mockRuns[0].tests[0],
          results: [
            {
              status: "failed",
              duration: 1000,
              error: { message: "Error with trace", stack: "Some stack trace" },
              attachments: [
                { name: "screenshot", contentType: "image/png", path: "/img.png" },
                { name: "video", contentType: "video/webm", path: "/vid.webm" },
              ],
              steps: [],
            },
          ],
        },
      ],
    };
    render(<DetailsClient allRuns={[runWithAttachments]} />);
    fireEvent.click(screen.getByText("Login success")); // Select the test

    expect(screen.getByText("Capture d'écran")).toBeInTheDocument();
    expect(screen.getByText("Vidéo")).toBeInTheDocument();
    expect(screen.getByText("Stacktrace")).toBeInTheDocument();
    expect(screen.getByText("Some stack trace")).toBeInTheDocument();

    // Trigger window.open
    const image = screen.getByAltText("screenshot");
    const windowOpenSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    fireEvent.click(image);
    expect(windowOpenSpy).toHaveBeenCalledWith("/img.png", "_blank");
  });

  it("should handle project change via selector", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "wse" } });
    expect(mockPush).toHaveBeenCalledWith("?id=run-123&project=wse", {
      scroll: false,
    });
  });

  it("should select test automatically if URL has test title", () => {
    mockSearchParams = new URLSearchParams(
      "id=run-123&test=Login success&file=tests/wse/auth.spec.ts",
    );
    render(<DetailsClient allRuns={mockRuns} />);

    // Details panel should be open, showing "Aucun détail supplémentaire" since it's a pass with no steps/error
    expect(screen.getByText("Aucun détail supplémentaire")).toBeInTheDocument();
  });

  it("should reset selected test and clear test/file params when switching project in DetailsClient", () => {
    mockSearchParams = new URLSearchParams(
      "id=run-123&project=wse&test=Login success&file=tests/wse/auth.spec.ts",
    );
    render(<DetailsClient allRuns={mockRuns} />);

    // Details panel should be open
    expect(screen.getByText("Aucun détail supplémentaire")).toBeInTheDocument();

    // Switch project
    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "all" } });

    // Details panel should be reset
    expect(
      screen.queryByText("Aucun détail supplémentaire"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Sélectionnez un scénario"),
    ).toBeInTheDocument();

    // router.push should be called with test and file removed
    expect(mockPush).toHaveBeenCalledWith("?id=run-123&project=all", {
      scroll: false,
    });
  });

  it("should render a composite run if project is all and no id is passed", () => {
    mockSearchParams = new URLSearchParams("");
    render(<DetailsClient allRuns={mockRuns} />);

    expect(screen.getByText("Login success")).toBeInTheDocument();
  });

  it("should copy only clean test title to clipboard when clicking copy button", () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<DetailsClient allRuns={mockRuns} />);

    const copyButtons = screen.getAllByTitle("Copier le nom du test");
    fireEvent.click(copyButtons[0]);

    expect(writeTextSpy).toHaveBeenCalledWith("Login failed");
  });

  it("should copy test title to clipboard from the details panel header", () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    render(<DetailsClient allRuns={mockRuns} />);
    fireEvent.click(screen.getByText("Login success"));

    const copyButtons = screen.getAllByTitle("Copier le nom du test");
    // Find the one in the details header (last rendered or clicked)
    fireEvent.click(copyButtons[copyButtons.length - 1]);

    expect(writeTextSpy).toHaveBeenCalledWith("Login success");
  });

  it("should group component tests under Composants feature node", () => {
    render(<DetailsClient allRuns={mockRuns} />);
    // "Composants" should be present in the category filter and the feature tree
    const compElements = screen.getAllByText("Composants");
    expect(compElements.length).toBeGreaterThanOrEqual(2);
  });
});
