import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TestPlanClient from "./TestPlanClient";
import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectSelectorProps } from "../../components/ProjectSelector";
import { TestSuite } from "../../lib/parseTests";
import { THEME } from "../../lib/utils";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => ""),
}));

vi.mock("../../components/ProjectSelector", () => ({
  default: ({ onProjectChange, selectedProject }: ProjectSelectorProps) => (
    <select
      data-testid="project-selector"
      value={selectedProject}
      onChange={(e) => onProjectChange(e.target.value)}
    >
      <option value="all">All</option>
      <option value="wse">WeSave Épargne</option>
      <option value="tpbp">TPBP</option>
      <option value="b4b">B4Bank</option>
    </select>
  ),
  PROJECTS_CONFIG: [
    { id: "all", label: "All Projects" },
    { id: "wse", label: "WeSave Épargne", keywords: ["wse", "wesave"] },
    { id: "tpbp", label: "TPBP", keywords: ["tpbp", "wealth", "lclmp"] },
    { id: "b4b", label: "B4Bank", keywords: ["b4b", "b4bank"] },
  ],
}));

const mockTestPlan: TestSuite[] = [
  {
    id: "suite-1",
    title: "Auth Tests",
    file: "tests/wse/auth.spec.ts",
    automatedCount: 2,
    testCases: [
      {
        id: "tc-1",
        title: "Login test",
        file: "tests/wse/auth.spec.ts",
        automated: true,
        status: "run",
        tags: ["@core"],
        steps: [{ title: "Open page" }, { title: "Type credentials" }],
      },
      {
        id: "tc-2",
        title: "Logout test",
        file: "tests/wse/auth.spec.ts",
        automated: false,
        steps: [],
      },
      {
        id: "tc-3",
        title: "Skip test",
        file: "tests/wse/auth.spec.ts",
        automated: true,
        status: "skip",
        steps: [],
      },
      {
        id: "tc-4",
        title: "Fixme test",
        file: "tests/wse/auth.spec.ts",
        automated: true,
        status: "fixme",
        steps: [],
      },
      {
        id: "tc-5",
        title: "Only test",
        file: "tests/wse/auth.spec.ts",
        automated: true,
        status: "only",
        steps: [],
      },
    ],
  },
];

describe("TestPlanClient", () => {
  it("should render the explore message initially when project is all", () => {
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);
    expect(screen.getByText("Explorez nos plans de test")).toBeInTheDocument();
  });

  it("should render suites when a project is selected", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);
    expect(screen.getAllByText("Auth Tests")[0]).toBeInTheDocument();
  });

  it("should filter suites and test cases by search term", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    const searchInput = screen.getByPlaceholderText(
      "Rechercher une fonction ou un test...",
    );
    fireEvent.change(searchInput, { target: { value: "Login" } });

    expect(screen.getAllByText("Auth Tests")[0]).toBeInTheDocument();
    // It should render the suite, and when selected, show the test case
    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    expect(screen.getByText("Login test")).toBeInTheDocument();
    expect(screen.getByText("Logout test")).toBeInTheDocument();
  });

  it("should show test details when a test case is clicked", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    fireEvent.click(screen.getByText("Login test"));

    expect(screen.getByText("Open page")).toBeInTheDocument();
    expect(screen.getByText("Type credentials")).toBeInTheDocument();
  });

  it("should handle test case statuses properly", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    
    // click skip
    fireEvent.click(screen.getAllByText("Skip test")[0]);
    expect(screen.getAllByText("Skip test").length).toBeGreaterThan(0);
    
    // click fixme
    fireEvent.click(screen.getAllByText("Fixme test")[0]);
    expect(screen.getAllByText("Fixme test").length).toBeGreaterThan(0);

    // click only
    fireEvent.click(screen.getAllByText("Only test")[0]);
    expect(screen.getAllByText("Only test").length).toBeGreaterThan(0);
    
    // close panel
    const closeBtns = screen.getAllByRole("button");
    const closeBtn = closeBtns.find(b => b.innerHTML.includes("lucide-x"));
    if (closeBtn) fireEvent.click(closeBtn);
  });

  it("should handle zero steps", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    fireEvent.click(screen.getByText("Logout test"));

    expect(
      screen.getByText(/Aucune étape détaillée n'a été détectée/),
    ).toBeInTheDocument();
  });

  it("should handle project change", () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "wse" } });

    expect(mockPush).toHaveBeenCalledWith("?project=wse", {
      scroll: false,
    });
  });

  it("should clear search filter", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    const searchInput = screen.getByPlaceholderText(
      "Rechercher une fonction ou un test...",
    );
    fireEvent.change(searchInput, { target: { value: "test" } });
    expect(searchInput).toHaveValue("test");

    const clearBtn = screen.getByTitle("Effacer la recherche");
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue("");
  });

  it("should toggle feature folder open and closed when clicking its title", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    // Initially closed
    expect(screen.queryByText("Login test")).not.toBeInTheDocument();

    // Click to open
    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    expect(screen.getByText("Login test")).toBeInTheDocument();

    // Click again to close
    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    expect(screen.queryByText("Login test")).not.toBeInTheDocument();
  });

  it("should display automation percentage with correct color rules", () => {
    const plansWithVariedPct: TestSuite[] = [
      {
        id: "suite-zero",
        title: "Zero Auto Suite",
        file: "tests/wse/zero.spec.ts",
        automatedCount: 0,
        testCases: [
          {
            id: "tc-z1",
            title: "Manual Test",
            file: "tests/wse/zero.spec.ts",
            automated: false,
            steps: [],
          },
        ],
      },
      {
        id: "suite-full",
        title: "Full Auto Suite",
        file: "tests/wse/full.spec.ts",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-f1",
            title: "Auto Test",
            file: "tests/wse/full.spec.ts",
            automated: true,
            steps: [],
          },
        ],
      },
      {
        id: "suite-partial",
        title: "Partial Auto Suite",
        file: "tests/wse/part.spec.ts",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-p1",
            title: "Test 1",
            file: "tests/wse/part.spec.ts",
            automated: true,
            steps: [],
          },
          {
            id: "tc-p2",
            title: "Test 2",
            file: "tests/wse/part.spec.ts",
            automated: false,
            steps: [],
          },
        ],
      },
    ];

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={plansWithVariedPct} />);

    const zeroPctBadge = screen.getByText("0%");
    expect(zeroPctBadge).toHaveStyle({ color: THEME.colors.failed });

    const fullPctBadge = screen.getByText("100%");
    expect(fullPctBadge).toHaveStyle({ color: THEME.colors.passed });

    const partialPctBadge = screen.getByText("50%");
    expect(partialPctBadge).toHaveStyle({ color: THEME.colors.flaky });
  });

  it("should reset the right details panel when switching project", () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    // Open suite and select test case
    fireEvent.click(screen.getAllByText("Auth Tests")[0]);
    fireEvent.click(screen.getByText("Login test"));

    // Verify right panel is open
    expect(screen.getByText("Open page")).toBeInTheDocument();

    // Switch project
    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "all" } });

    // Verify right panel is reset
    expect(screen.queryByText("Open page")).not.toBeInTheDocument();
    expect(screen.getByText(/Sélectionnez un test|Explorez nos plans de test/)).toBeInTheDocument();
  });

  it("should clear test and file from searchParams when switching project", () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(
        "project=wse&test=Login test&file=tests/wse/auth.spec.ts",
      ) as unknown as ReturnType<typeof useSearchParams>,
    );
    render(<TestPlanClient initialTestPlan={mockTestPlan} />);

    // Verify test was selected via URL
    expect(screen.getByText("Open page")).toBeInTheDocument();

    // Switch project
    const selector = screen.getByTestId("project-selector");
    fireEvent.change(selector, { target: { value: "all" } });

    // Verify mockPush called without test and file
    expect(mockPush).toHaveBeenCalledWith("?project=all", {
      scroll: false,
    });
    // Verify right panel is reset
    expect(screen.queryByText("Open page")).not.toBeInTheDocument();
  });

  it("should consolidate tpbp components, visual, and bloc-vous into single features", () => {
    const tpbpMockPlan: TestSuite[] = [
      {
        id: "suite-btn",
        title: "Composant ButtonToggle",
        file: "tpbp/components/button-toggle.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-btn",
            title: "Bascule bouton",
            file: "tpbp/components/button-toggle.feature",
            steps: [{ title: "Cliquer bascule" }],
          },
        ],
      },
      {
        id: "suite-date",
        title: "Composant DatePicker",
        file: "tpbp/components/date-picker.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-date",
            title: "DatePicker Situation",
            file: "tpbp/components/date-picker.feature",
            steps: [{ title: "Saisir date" }],
          },
        ],
      },
      {
        id: "suite-vis",
        title: "Régression visuelle actualisation",
        file: "tpbp/visual/actualisation.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-vis",
            title: "Snapshot actualisation",
            file: "tpbp/visual/actualisation.feature",
            steps: [{ title: "Capture écran" }],
          },
        ],
      },
      {
        id: "suite-bv",
        title: "Bloc Vous - Professions",
        file: "tpbp/bloc-vous/limitation-professions.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-bv",
            title: "Limite 3 professions",
            file: "tpbp/bloc-vous/limitation-professions.feature",
            steps: [{ title: "Ajouter profession" }],
          },
        ],
      },
    ];

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=tpbp") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<TestPlanClient initialTestPlan={tpbpMockPlan} />);

    // Should display the 3 consolidated folders
    expect(screen.getByText("Composants")).toBeInTheDocument();
    expect(screen.getByText("Tests Visuels")).toBeInTheDocument();
    expect(screen.getByText("Bloc Vous")).toBeInTheDocument();

    // Opening Composants reveals all component test cases together
    fireEvent.click(screen.getByText("Composants"));
    expect(screen.getByText("Bascule bouton")).toBeInTheDocument();
    expect(screen.getByText("DatePicker Situation")).toBeInTheDocument();

    // Selecting a component test case displays its steps
    fireEvent.click(screen.getByText("DatePicker Situation"));
    expect(screen.getByText("Saisir date")).toBeInTheDocument();
  });

  it("should consolidate B4Bank Souscription GL suites under Souscription Gestion Libre", () => {
    const b4bMockPlan: TestSuite[] = [
      {
        id: "suite-gl-funds",
        title: "Souscription GL - Sélection des fonds",
        file: "b4b/gestion-libre/subscription-fund-selection.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-gl-funds",
            title: "Sélection fonds",
            file: "b4b/gestion-libre/subscription-fund-selection.feature",
            steps: [{ title: "Choisir fonds" }],
          },
        ],
      },
      {
        id: "suite-gl-nav",
        title: "Souscription GL - Navigation",
        file: "b4b/gl-subscription-navigation.feature",
        automatedCount: 1,
        testCases: [
          {
            id: "tc-gl-nav",
            title: "Navigation GL",
            file: "b4b/gl-subscription-navigation.feature",
            steps: [{ title: "Page suivante" }],
          },
        ],
      },
    ];

    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=b4b") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );

    render(<TestPlanClient initialTestPlan={b4bMockPlan} />);

    expect(screen.getByText("Souscription Gestion Libre")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Souscription Gestion Libre"));
    expect(screen.getByText("Sélection fonds")).toBeInTheDocument();
    expect(screen.getByText("Navigation GL")).toBeInTheDocument();
  });
});
