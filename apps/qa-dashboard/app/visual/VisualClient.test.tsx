import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import VisualClient, { getBranchFriendlyLabel } from "./VisualClient";
import React from "react";
import { VisualRunData } from "../../lib/parseVisual";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockPush,
  })),
  useSearchParams: vi.fn(() => mockSearchParams),
  usePathname: vi.fn(() => "/visual"),
}));

const mockVisualRun: VisualRunData = {
  pipelineId: "2874347016",
  jobId: "16675940167",
  branch: "test/tpbp-enable-design-system",
  commitHash: "9cac636",
  commitSubject: "chore(visual): disabled retries",
  runTimestamp: "2026-09-23T12:56:07.064Z",
  environment: "tpbp-visual",
  project: "tpbp-visual",
  stats: {
    total: 3,
    failed: 3,
    avgDiffRatio: 0.25,
    maxDiffRatio: 0.83,
    categories: {
      "Refonte Modale / Drawer (Impact Majeur)": 1,
      "Décalage Vertical / Hauteur (Layout Shift)": 1,
      "Erreur Fonctionnelle / Timeout": 1,
    },
  },
  items: [
    {
      id: "diff-1",
      file: "visual-tests/actualisation.spec.ts",
      specTitle: "Actualiser votre situation",
      testStatus: "failed",
      snapshot: "actualisations/1-situation.png",
      expectedDim: "2560px by 2353px",
      receivedDim: "2560px by 2219px",
      deltaHeight: 134,
      diffPixels: 124702,
      diffRatio: 0.03,
      diffPercent: "3.0%",
      category: "Décalage Vertical / Hauteur (Layout Shift)",
      explanation: "Hauteur modifiée causant un décalage vertical",
      expectedImageRelPath: "/visual-runs/2874347016/images/actualisations__1-situation-expected.png",
      actualImageRelPath: "/visual-runs/2874347016/images/actualisations__1-situation-actual.png",
      diffImageRelPath: "/visual-runs/2874347016/images/actualisations__1-situation-diff.png",
    },
    {
      id: "diff-2",
      file: "visual-tests/operations.spec.ts",
      specTitle: "Popup compte dépôt",
      testStatus: "failed",
      snapshot: "nouvelle-souscription/4-popup-compte-depot.png",
      expectedDim: "2560px by 1440px",
      receivedDim: "2560px by 1440px",
      deltaHeight: 0,
      diffPixels: 3025606,
      diffRatio: 0.83,
      diffPercent: "83.0%",
      category: "Refonte Modale / Drawer (Impact Majeur)",
      explanation: "Composant d overlay complètement restructuré",
      expectedImageRelPath: "/visual-runs/2874347016/images/nouvelle-souscription__4-popup-compte-depot-expected.png",
      actualImageRelPath: "/visual-runs/2874347016/images/nouvelle-souscription__4-popup-compte-depot-actual.png",
      diffImageRelPath: "/visual-runs/2874347016/images/nouvelle-souscription__4-popup-compte-depot-diff.png",
    },
    {
      id: "diff-3",
      file: "visual-tests/bloc-vous.spec.ts",
      specTitle: "Parcours complet Bloc Vous",
      testStatus: "failed",
      snapshot: null,
      expectedDim: null,
      receivedDim: null,
      deltaHeight: null,
      diffPixels: null,
      diffRatio: null,
      diffPercent: null,
      category: "Erreur Fonctionnelle / Timeout",
      explanation: "expect(locator).toBeHidden() failed",
      rawError: "expect(locator).toBeHidden() failed",
    },
  ],
};

describe("VisualClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("");
  });

  it("renders correctly with visual run data and divided branch and run selectors", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText("Tests Visuels")).toBeInTheDocument();
    expect(screen.getByText("Choisir la branche")).toBeInTheDocument();
    expect(screen.getByText("Choisir le run de test visuel")).toBeInTheDocument();
    expect(screen.getByTestId("branch-selector-trigger")).toHaveTextContent(
      "DEV avec FF",
    );
    expect(screen.getByText("Run #2874347016")).toBeInTheDocument();
    // Branch name should not appear inside RunSelector
    expect(screen.queryByText(`(${mockVisualRun.branch})`)).not.toBeInTheDocument();
    // Run count should not appear inside BranchSelector
    expect(screen.getByTestId("branch-selector-trigger")).not.toHaveTextContent(/1 run/i);
    // Run selector trigger should display the total écarts badge and test count badge
    expect(screen.getByTestId("run-selector-trigger")).toHaveTextContent("12 tests");
    expect(screen.getByTestId("run-selector-trigger")).toHaveTextContent("9 conformes");
    expect(screen.getByTestId("run-selector-trigger")).toHaveTextContent("3 échecs");
    expect(screen.getByTestId("run-selector-trigger")).toHaveTextContent("3 écarts");
    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(screen.getByText("nouvelle-souscription/4-popup-compte-depot.png")).toBeInTheDocument();
    expect(screen.getByText("Slider")).toBeInTheDocument();
    expect(screen.getByText("3 Vues")).toBeInTheDocument();
  });

  it("allows filtering visual diffs by specific test scenario via TestScenarioSelector", () => {
    const { rerender } = render(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(
      screen.getByText("nouvelle-souscription/4-popup-compte-depot.png"),
    ).toBeInTheDocument();

    // Reset button is disabled when not filtered
    const resetBtn = screen.getByTestId("reset-filters-btn");
    expect(resetBtn).toBeDisabled();

    // Open TestScenarioSelector dropdown
    const testTrigger = screen.getByTestId("test-filter-trigger");
    fireEvent.click(testTrigger);

    // Click on the specific test option in the list
    const option = screen.getByText("Actualiser votre situation");
    fireEvent.click(option);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("test=Actualiser"),
      { scroll: false },
    );

    mockSearchParams = new URLSearchParams("test=Actualiser votre situation");
    rerender(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(
      screen.queryByText("nouvelle-souscription/4-popup-compte-depot.png"),
    ).not.toBeInTheDocument();

    // Reset button is now enabled
    expect(screen.getByTestId("reset-filters-btn")).not.toBeDisabled();
  });

  it("allows searching visual diffs by snapshot or keyword via visual-search-input", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const searchInput = screen.getByTestId("visual-search-input");
    fireEvent.change(searchInput, { target: { value: "popup-compte" } });

    expect(
      screen.getByText("nouvelle-souscription/4-popup-compte-depot.png"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("actualisations/1-situation.png"),
    ).not.toBeInTheDocument();
  });

  it("displays branches with friendly labels in BranchSelector and allows searching and selecting a branch", () => {
    const secondRun: VisualRunData = {
      ...mockVisualRun,
      pipelineId: "2881932490",
      jobId: "16732083309",
      branch: "feat/TD-1866-visual-tests-dev3-tailwind4",
    };

    render(<VisualClient runs={[mockVisualRun, secondRun]} />);

    // Friendly branch label displayed in branch trigger
    const branchTrigger = screen.getByTestId("branch-selector-trigger");
    expect(branchTrigger).toHaveTextContent("DEV avec FF");

    // Open branch dropdown
    fireEvent.click(branchTrigger);

    // All branches and "Toutes les branches" displayed in options
    expect(screen.getByText("Toutes les branches")).toBeInTheDocument();
    expect(
      screen.getAllByText("DEV avec FF").length,
    ).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("DEV3 (Vue3)")).toBeInTheDocument();

    // Search in branch selector by friendly label
    const searchBranchInput = screen.getByPlaceholderText(
      "Rechercher une branche...",
    );
    fireEvent.change(searchBranchInput, { target: { value: "DEV3" } });
    expect(screen.getByText("DEV3 (Vue3)")).toBeInTheDocument();
    // Option should no longer be in dropdown list (only trigger has it)
    expect(screen.getAllByText("DEV avec FF").length).toBe(1);

    // Select the branch
    fireEvent.click(screen.getByText("DEV3 (Vue3)"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining(`branch=${encodeURIComponent(secondRun.branch)}`),
      { scroll: false },
    );
  });

  it("allows selecting 'Toutes les branches' to view all runs across branches", () => {
    const secondRun: VisualRunData = {
      ...mockVisualRun,
      pipelineId: "2881932490",
      jobId: "16732083309",
      branch: "feat/TD-1866-visual-tests-dev3-tailwind4",
    };

    mockSearchParams = new URLSearchParams("branch=all");
    render(<VisualClient runs={[mockVisualRun, secondRun]} />);

    const branchTrigger = screen.getByTestId("branch-selector-trigger");
    expect(branchTrigger).toHaveTextContent("Toutes les branches");

    // Open RunSelector: both runs should be visible with their 'écarts' tag in run selector
    const runTrigger = screen.getByTestId("run-selector-trigger");
    fireEvent.click(runTrigger);

    expect(screen.getAllByText("Run #2874347016").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Run #2881932490")).toBeInTheDocument();
    expect(screen.getAllByText("3 écarts").length).toBeGreaterThanOrEqual(2);
  });

  it("resets branch to 'all' via the clear button on BranchSelector", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const clearBranchBtn = screen.getByTitle(
      "Réinitialiser la branche (Toutes les branches)",
    );
    fireEvent.click(clearBranchBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("branch=all"),
      { scroll: false },
    );
  });

  it("renders category KPI cards with badges and counts", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText("Tous les écarts")).toBeInTheDocument();
    expect(screen.getByText("Global")).toBeInTheDocument();

    expect(screen.getByText("Modales / Drawers")).toBeInTheDocument();
    expect(screen.getByText("> 40%")).toBeInTheDocument();

    expect(screen.getByText("Layout Shift")).toBeInTheDocument();
    expect(screen.getByText("Hauteur")).toBeInTheDocument();

    expect(screen.getByText("Cosmétique")).toBeInTheDocument();
    expect(screen.getByText("< 5%")).toBeInTheDocument();

    expect(screen.getByText("Erreurs / Timeouts")).toBeInTheDocument();
    expect(screen.getByText("Alerte")).toBeInTheDocument();
  });

  it("filters items by category card, toggles selection, and resets filter", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    // Reset button should be disabled initially when not filtered
    expect(screen.getByTestId("reset-filters-btn")).toBeDisabled();

    const allCard = screen.getByText("Tous les écarts").closest("div[title]");
    const modalFilterCard = screen.getByText("Modales / Drawers").closest("div[title]");
    const shiftFilterCard = screen.getByText("Layout Shift").closest("div[title]");

    if (
      !(allCard instanceof HTMLElement) ||
      !(modalFilterCard instanceof HTMLElement) ||
      !(shiftFilterCard instanceof HTMLElement)
    ) {
      throw new Error("Card elements not found");
    }

    // 'Tous les écarts' card is initially active
    expect(within(allCard).getByText("Actif")).toBeInTheDocument();
    expect(within(modalFilterCard).queryByText("Actif")).not.toBeInTheDocument();

    fireEvent.click(modalFilterCard);

    expect(screen.queryByText("actualisations/1-situation.png")).not.toBeInTheDocument();
    expect(screen.getByText("nouvelle-souscription/4-popup-compte-depot.png")).toBeInTheDocument();
    expect(within(modalFilterCard).getByText("Actif")).toBeInTheDocument();
    expect(within(allCard).queryByText("Actif")).not.toBeInTheDocument();

    // Clicking the same active category card again toggles back to 'all'
    fireEvent.click(modalFilterCard);
    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(screen.getByText("nouvelle-souscription/4-popup-compte-depot.png")).toBeInTheDocument();
    expect(within(modalFilterCard).queryByText("Actif")).not.toBeInTheDocument();
    expect(within(allCard).getByText("Actif")).toBeInTheDocument();

    // Switch to Layout Shift
    fireEvent.click(shiftFilterCard);

    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(screen.queryByText("nouvelle-souscription/4-popup-compte-depot.png")).not.toBeInTheDocument();
    expect(within(shiftFilterCard).getByText("Actif")).toBeInTheDocument();

    // Reset filter
    const resetBtn = screen.getByTestId("reset-filters-btn");
    expect(resetBtn).not.toBeDisabled();
    fireEvent.click(resetBtn);

    expect(screen.getByText("actualisations/1-situation.png")).toBeInTheDocument();
    expect(screen.getByText("nouvelle-souscription/4-popup-compte-depot.png")).toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
    expect(within(allCard).getByText("Actif")).toBeInTheDocument();
  });

  it("opens and closes modal image on click", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const expandButtons = screen.getAllByTitle("Agrandir");
    expect(expandButtons.length).toBeGreaterThan(0);

    fireEvent.click(expandButtons[0]);
    expect(screen.getByAltText("Full View")).toBeInTheDocument();

    const closeBtn = screen.getByTitle("Fermer");
    fireEvent.click(closeBtn);
    expect(screen.queryByAltText("Full View")).not.toBeInTheDocument();
  });

  it("toggles between slider mode and 3 vues mode", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    // By default in slider mode
    expect(screen.getAllByText(/Slider Avant \/ Après/i).length).toBeGreaterThan(0);

    // Switch to 3 Vues
    const threeViewsBtn = screen.getByText("3 Vues");
    fireEvent.click(threeViewsBtn);

    expect(screen.getAllByText(/1\. Baseline \(Attendu\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2\. Exécution \(Reçu\)/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/3\. Différence/i).length).toBeGreaterThan(0);

    // Switch back to Slider
    const sliderBtn = screen.getByText("Slider");
    fireEvent.click(sliderBtn);
    expect(screen.getAllByText(/Slider Avant \/ Après/i).length).toBeGreaterThan(0);
  });

  it("handles slider mouse movement and dragging", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const sliderContainer = screen.getAllByText(/Slider Avant \/ Après/i)[0].closest(".flex-col")?.querySelector(".cursor-ew-resize");
    expect(sliderContainer).toBeInTheDocument();

    if (sliderContainer) {
      fireEvent.mouseDown(sliderContainer, { clientX: 100 });
      fireEvent.mouseMove(sliderContainer, { clientX: 200 });
      fireEvent.mouseUp(sliderContainer);
      fireEvent.touchMove(sliderContainer, { touches: [{ clientX: 150 }] });
    }
  });

  it("handles zoom in, zoom out and zoom reset", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const zoomInBtn = screen.getAllByTitle("Zoom avant")[0];
    const zoomOutBtn = screen.getAllByTitle("Zoom arrière")[0];
    const resetZoomBtn = screen.getAllByTitle("Réinitialiser le zoom")[0];

    expect(resetZoomBtn).toHaveTextContent("1x");

    fireEvent.click(zoomInBtn);
    expect(resetZoomBtn).toHaveTextContent("1.5x");

    fireEvent.click(zoomOutBtn);
    expect(resetZoomBtn).toHaveTextContent("1x");

    fireEvent.click(zoomInBtn);
    fireEvent.click(resetZoomBtn);
    expect(resetZoomBtn).toHaveTextContent("1x");
  });

  it("displays empty state when no visual runs exist", () => {
    render(<VisualClient runs={[]} />);
    expect(screen.getByText(/Aucun rapport de test visuel disponible/i)).toBeInTheDocument();
  });

  it("displays empty state when selected project has no visual runs while keeping toolbar visible", () => {
    mockSearchParams = new URLSearchParams("project=wse");
    render(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText(/Aucun rapport visuel disponible pour ce projet/i)).toBeInTheDocument();
    expect(screen.getByText("Choisir la branche")).toBeInTheDocument();
    expect(screen.getByText("Aucune branche disponible...")).toBeInTheDocument();
    expect(screen.getByText("Choisir le run de test visuel")).toBeInTheDocument();
    expect(screen.getByText("Aucun run disponible...")).toBeInTheDocument();
  });

  it("displays neutral placeholder state when run is deselected via URL", () => {
    mockSearchParams = new URLSearchParams("id=none");
    render(<VisualClient runs={[mockVisualRun]} />);

    expect(screen.getByText("Aucun run sélectionné")).toBeInTheDocument();
    expect(screen.getByText(/Veuillez sélectionner une exécution dans le menu déroulant/i)).toBeInTheDocument();
    expect(screen.getByText("Sélectionner un run de test visuel...")).toBeInTheDocument();
  });

  it("handles run deselection via clear button in RunSelector", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const clearBtn = screen.getByTitle("Effacer la sélection");
    fireEvent.click(clearBtn);

    expect(mockPush).toHaveBeenCalledWith("/visual?id=none", {
      scroll: false,
    });
  });

  it("handles selecting a run in RunSelector", () => {
    const secondRun: VisualRunData = {
      ...mockVisualRun,
      pipelineId: "2874347999",
      jobId: "16675949999",
      branch: mockVisualRun.branch,
    };

    render(<VisualClient runs={[mockVisualRun, secondRun]} />);

    const runTrigger = screen.getByTestId("run-selector-trigger");
    fireEvent.click(runTrigger);

    const secondRunBtn = screen.getByText("Run #2874347999");
    fireEvent.click(secondRunBtn);

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("id=2874347999"),
      { scroll: false },
    );
  });

  it("closes BranchSelector dropdown when clicking outside", () => {
    render(<VisualClient runs={[mockVisualRun]} />);

    const branchTrigger = screen.getByTestId("branch-selector-trigger");
    fireEvent.click(branchTrigger);
    expect(screen.getByText("Toutes les branches")).toBeInTheDocument();

    fireEvent.click(document.body);
    expect(screen.queryByText("Toutes les branches")).not.toBeInTheDocument();
  });

  describe("getBranchFriendlyLabel", () => {
    it("maps known TPBP cascade branches to friendly human-readable names", () => {
      expect(getBranchFriendlyLabel("main")).toBe("Homologation");
      expect(getBranchFriendlyLabel("master")).toBe("Homologation");
      expect(
        getBranchFriendlyLabel("test/TD-1867-visual-tests-dev-isDesignSystemDisabled"),
      ).toBe("DEV sans FF");
      expect(
        getBranchFriendlyLabel("test/TD-1867-visual-tests-dev-isDesignSystemEnabled"),
      ).toBe("DEV avec FF");
      expect(
        getBranchFriendlyLabel("test/TD-1866-visual-tests-dev3-tailwind4"),
      ).toBe("DEV3 (Vue3)");
    });

    it("handles all and unknown branch fallbacks properly", () => {
      expect(getBranchFriendlyLabel("all")).toBe("Toutes les branches");
      expect(getBranchFriendlyLabel("feat/my-custom-feature")).toBe(
        "feat/my-custom-feature",
      );
      expect(getBranchFriendlyLabel("")).toBe("");
    });
  });
});

