import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import QualityClient from "./QualityClient";
import React from "react";
import { ProjectSelectorProps } from "../../components/ProjectSelector";
import { ProjectQuality } from "../../lib/parseQuality";

const mockPush = vi.fn();
let mockSearchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  useSearchParams: vi.fn(() => mockSearchParams),
  usePathname: vi.fn(() => ""),
}));

// Mock Recharts to avoid rendering issues in test environment
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ReferenceArea: () => <div />,
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
      <option value="tpbp">Wealth</option>
    </select>
  ),
  PROJECTS_CONFIG: [
    { id: "all", label: "All Projects" },
    { id: "wse", label: "WeSave", keywords: ["wse", "wesave"] },
    { id: "tpbp", label: "Wealth", keywords: ["wealth"] },
  ],
}));

const mockProjects: ProjectQuality[] = [
  {
    id: "savings-frontend",
    label: "savings-frontend",
    type: "frontend",
    metrics: {
      sonar: {
        label: "Sonar",
        value: "A",
        status: "passed" as const,
        details: { Security: "A", Reliability: "A", Maintainability: "A", "Security Review": "A" },
      },
      eslint: {
        label: "ESLint",
        value: "1",
        warnings: 1,
        errors: 0,
        status: "warning" as const,
        details: { Erreurs: 0, Avertissements: 1 },
        trend: { direction: "down", difference: 1, isGood: true }
      },
      vuetsclint: {
        label: "Vue Lint",
        value: "0",
        warnings: 0,
        errors: 0,
        status: "passed" as const,
        trend: { direction: "up", difference: 0, isGood: true }
      },
      coverage: {
        label: "Couverture",
        value: "80%",
        percentage: 80,
        status: "passed" as const,
        details: { Statements: 80, Branches: 80, Functions: 80, Lines: 80 },
        trend: { direction: "up", difference: 5, isGood: true },
        history: [
            { timestamp: "2023-10-01T10:00:00Z", percentage: 70 },
            { timestamp: "2023-10-27T10:00:00Z", percentage: 80 },
        ]
      },
      auditProd: {
        label: "Audit Prod",
        value: "1 vuln.",
        vulnerabilities: { low: 1, moderate: 0, high: 0, critical: 0 },
        totalDependencies: 100,
        status: "passed" as const,
        vulnerabilitiesList: [
            { severity: "low", title: "Low vuln", package: "pkg-a", vulnerableVersion: "1.0", patchedVersion: "1.1", link: "http://link" }
        ]
      },
      auditDev: {
        label: "Audit Dev",
        value: "5 vuln.",
        vulnerabilities: { low: 0, moderate: 1, high: 5, critical: 0 },
        totalDependencies: 400,
        status: "warning" as const,
        vulnerabilitiesList: [
            { severity: "high", title: "High vuln", package: "pkg-b", vulnerableVersion: "2.0", patchedVersion: "2.1", link: "" },
            { severity: "moderate", title: "Moderate vuln", package: "pkg-c", vulnerableVersion: "3.0", patchedVersion: "3.1", link: "" }
        ]
      },
      typecheck: {
        label: "Typage",
        value: "0",
        errors: 0,
        status: "passed" as const,
      },
    },
    lastUpdate: "2023-10-27T10:00:00Z",
  },
  {
    id: "savings-backend",
    label: "savings-backend",
    type: "backend",
    metrics: {
      sonar: {
        label: "Sonar",
        value: "A",
        status: "passed" as const,
        details: { Security: "A", Reliability: "A", Maintainability: "B", "Security Review": "A" },
      },
      eslint: {
        label: "ESLint",
        value: "5",
        warnings: 0,
        errors: 5,
        status: "failed" as const,
        details: { Erreurs: 5, Avertissements: 0 },
        trend: { direction: "up", difference: 2, isGood: false }
      },
      vuetsclint: {
        label: "Vue Lint",
        value: "N/A",
        warnings: 0,
        errors: 0,
        status: "unknown" as const,
      },
      coverage: {
        label: "Couverture",
        value: "40%",
        percentage: 40,
        status: "failed" as const,
        details: { Statements: 40, Branches: 40, Functions: 40, Lines: 40 },
      },
      auditProd: {
        label: "Audit Prod",
        value: "0",
        vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 },
        totalDependencies: 0,
        status: "passed" as const,
      },
      auditDev: {
        label: "Audit Dev",
        value: "0",
        vulnerabilities: { low: 0, moderate: 0, high: 0, critical: 0 },
        totalDependencies: 0,
        status: "passed" as const,
      },
      typecheck: {
        label: "Typage",
        value: "0",
        errors: 0,
        status: "passed" as const,
      },
    },
    lastUpdate: "2023-10-27T10:00:00Z",
  }
];

describe("QualityClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams("");
  });

  it("renders correctly with projects", () => {
    render(<QualityClient projects={mockProjects} />);
    expect(screen.getByText(/Qualité du Code/i)).toBeInTheDocument();
    expect(screen.getByText("Par type")).toBeInTheDocument();
    expect(screen.getByText("savings-frontend")).toBeInTheDocument();
    expect(screen.getByText("savings-backend")).toBeInTheDocument();
  });

  it("filters projects based on search text", async () => {
    render(<QualityClient projects={mockProjects} />);
    const searchInput = screen.getByPlaceholderText("Rechercher un repository...");
    
    fireEvent.change(searchInput, { target: { value: "backend" } });
    
    expect(screen.queryByText("savings-frontend")).not.toBeInTheDocument();
    expect(screen.getByText("savings-backend")).toBeInTheDocument();
  });

  it("filters projects based on type", async () => {
    render(<QualityClient projects={mockProjects} />);
    
    // Toggle backend off
    const backendBtn = screen.getByTestId("type-filter-backend");
    fireEvent.click(backendBtn); 
    
    expect(screen.queryByText("savings-backend")).not.toBeInTheDocument();
    expect(screen.getByText("savings-frontend")).toBeInTheDocument();
  });

  it("filters projects based on status", async () => {
    render(<QualityClient projects={mockProjects} />);
    
    expect(screen.getByText("savings-frontend")).toBeInTheDocument(); 
    
    // Toggle Attention (warning) off
    const warningBtn = screen.getByTestId("status-filter-warning");
    fireEvent.click(warningBtn); 
    
    expect(screen.queryByText("savings-frontend")).not.toBeInTheDocument();
    expect(screen.getByText("savings-backend")).toBeInTheDocument();
  });

  it("resets filters when reset button is clicked", async () => {
    render(<QualityClient projects={mockProjects} />);
    const searchInput = screen.getByPlaceholderText("Rechercher un repository...");
    
    fireEvent.change(searchInput, { target: { value: "nothing-matches" } });
    expect(screen.queryByText("savings-backend")).not.toBeInTheDocument();
    
    const resetButton = screen.getByTitle("Réinitialiser tous les filtres");
    
    fireEvent.click(resetButton);
    
    expect(searchInput).toHaveValue("");
    expect(screen.getByText("savings-backend")).toBeInTheDocument();
  });

  it("handles project selector changes", async () => {
    render(<QualityClient projects={mockProjects} />);
    const select = screen.getByTestId("project-selector");
    
    fireEvent.change(select, { target: { value: "wse" } });
    
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("project=wse"), expect.any(Object));
  });

  it("shows and closes the details modal", async () => {
    // We need to render the detailed view to have clickable metric cells.
    mockSearchParams = new URLSearchParams("project=wse");
    
    render(<QualityClient projects={mockProjects} />);
    
    const auditCells = screen.getAllByText("Sécurité Dev");
    const cell = auditCells[0].closest('div.flex.flex-col.rounded-2xl');
    if (cell) fireEvent.click(cell);
    
    await waitFor(() => {
        expect(screen.getByText(/Liste des vulnérabilités/i)).toBeInTheDocument();
        expect(screen.getByText("pkg-b")).toBeInTheDocument();
        expect(screen.getByText("High vuln")).toBeInTheDocument();
    });
  });

  it("sorts vulnerabilities in modal", async () => {
    const complexProject: ProjectQuality = {
        ...mockProjects[0],
        metrics: {
            ...mockProjects[0].metrics,
            auditDev: {
                ...mockProjects[0].metrics.auditDev,
                vulnerabilitiesList: [
                    { severity: "low", title: "A", package: "z-pkg", vulnerableVersion: "1", patchedVersion: "1.1", link: "" },
                    { severity: "high", title: "Z", package: "a-pkg", vulnerableVersion: "2", patchedVersion: "2.1", link: "" }
                ]
            }
        }
    };

    mockSearchParams = new URLSearchParams("project=wse");
    render(<QualityClient projects={[complexProject]} />);
    
    const auditCells = screen.getAllByText("Sécurité Dev");
    fireEvent.click(auditCells[0].closest('div.flex.flex-col.rounded-2xl')!);
    
    await waitFor(() => expect(screen.getByText("Liste des vulnérabilités")).toBeInTheDocument());
    
    const packageHeader = screen.getByText("Package");
    fireEvent.click(packageHeader); 
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("a-pkg");
    
    fireEvent.click(packageHeader); 
    const updatedRows = screen.getAllByRole("row");
    expect(updatedRows[1]).toHaveTextContent("z-pkg");

    const severityHeader = screen.getByText("Séverité");
    fireEvent.click(severityHeader);
    const titleHeader = screen.getByText("Titre");
    fireEvent.click(titleHeader);
  });

  it("filters vulnerabilities in modal", async () => {
    mockSearchParams = new URLSearchParams("project=wse");
    render(<QualityClient projects={mockProjects} />);
    
    const auditCells = screen.getAllByText("Sécurité Dev");
    fireEvent.click(auditCells[0].closest('div.flex.flex-col.rounded-2xl')!);
    
    await waitFor(() => expect(screen.getByPlaceholderText(/Filtrer par package/i)).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Filtrer par package/i);
    fireEvent.change(searchInput, { target: { value: "non-existent" } });
    
    expect(screen.getByText(/Aucune vulnérabilité ne correspond/i)).toBeInTheDocument();
  });

  it("handles projects with missing data gracefully", () => {
    mockSearchParams = new URLSearchParams("project=tpbp");
    render(<QualityClient projects={mockProjects} />);
    
    expect(screen.getByText("lclmp-frontend")).toBeInTheDocument();
    expect(screen.getAllByText("N/A").length).toBeGreaterThan(0);
  });

  it("navigates to parent project when clicking a card in all view", () => {
    mockSearchParams = new URLSearchParams("");
    render(<QualityClient projects={mockProjects} />);
    
    const cardTitle = screen.getByText("savings-frontend");
    const card = cardTitle.closest('.cursor-pointer');
    
    if (card) fireEvent.click(card);
    
    // savings-frontend belongs to wesave parent
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining("project=wse"), expect.any(Object));
  });

  it("renders Sonar section with correct ratings", () => {
    render(<QualityClient projects={mockProjects} />);
    const sonarTitles = screen.getAllByText("Sonar");
    expect(sonarTitles.length).toBeGreaterThan(0);
    const ratingsA = screen.getAllByText("A");
    expect(ratingsA.length).toBeGreaterThan(0);
  });

  it("renders Sonar as a div when not in project view", () => {
    mockSearchParams = new URLSearchParams(""); 
    render(<QualityClient projects={mockProjects} />);
    // On cherche le texte Sonar mais on ignore celui du filtre (qui est un bouton)
    // On cible celui qui est dans une div cursor-default
    const sonarTitle = screen.getAllByText("Sonar").find(el => el.closest('div.cursor-default'));
    expect(sonarTitle).toBeDefined();
    const sonarContainer = sonarTitle!.closest('div.cursor-default');
    expect(sonarContainer).toBeInTheDocument();
    expect(sonarContainer?.tagName).toBe("DIV");
  });

  it("renders Sonar as a link when in project view", () => {
    mockSearchParams = new URLSearchParams("project=wse");
    render(<QualityClient projects={mockProjects} />);
    const sonarLinks = screen.getAllByRole("link").filter(l => l.getAttribute("href")?.includes("sonarcloud.io"));
    expect(sonarLinks.length).toBeGreaterThan(0);
    expect(sonarLinks[0]).toHaveAttribute("href", "https://sonarcloud.io/project/overview?id=anatec_savings-frontend");
  });

  it("renders trend badges correctly", () => {
    render(<QualityClient projects={mockProjects} />);
    expect(screen.getByText("+5")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("opens and closes modal from project view", async () => {
    mockSearchParams = new URLSearchParams("project=wse");
    render(<QualityClient projects={mockProjects} />);
    // On cherche le texte Couverture mais on ignore celui du filtre
    const coverageCellLabel = screen.getAllByText("Couverture").find(el => el.closest('div.flex.flex-col.rounded-2xl'));
    const coverageCell = coverageCellLabel!.closest('div.flex.flex-col.rounded-2xl');
    fireEvent.click(coverageCell!);
    await waitFor(() => expect(screen.getByText("Détails Couverture")).toBeInTheDocument());
    const closeButton = screen.getByText("Fermer");
    fireEvent.click(closeButton);
    await waitFor(() => expect(screen.queryByText("Détails Couverture")).not.toBeInTheDocument());
  });

  it("shows empty state when no projects match", () => {
    render(<QualityClient projects={[]} />);
    expect(screen.getByText("Aucune donnée disponible")).toBeInTheDocument();
  });

  describe("KPI Filtering", () => {
    it("renders all KPI filter pills", () => {
      render(<QualityClient projects={mockProjects} />);
      expect(screen.getByText("Indicateurs (KPIs) affichés")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-pill-eslint")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-pill-coverage")).toBeInTheDocument();
      expect(screen.getByTestId("kpi-pill-sonar")).toBeInTheDocument();
    });

    it("toggles KPI visibility", () => {
      mockSearchParams = new URLSearchParams("project=wse");
      render(<QualityClient projects={mockProjects} />);
      
      // Coverage is initially visible
      expect(screen.getAllByText("Couverture").find(el => el.closest('div.flex.flex-col.rounded-2xl'))).toBeDefined();
      
      // Click the pill to hide Coverage
      const coveragePill = screen.getByTestId("kpi-pill-coverage");
      fireEvent.click(coveragePill);
      
      // Coverage should now be hidden in the project view
      expect(screen.getAllByText("Couverture").find(el => el.closest('div.flex.flex-col.rounded-2xl'))).toBeUndefined();
      
      // Sonar is initially visible
      // On cherche celui qui est un lien (isLinkable est vrai dans cette vue)
      const sonarLink = screen.getAllByText("Sonar").find(el => el.closest('a'));
      expect(sonarLink).toBeDefined();
      expect(sonarLink!.closest('a')).toBeInTheDocument();
      
      // Click the pill to hide Sonar
      const sonarPill = screen.getByTestId("kpi-pill-sonar");
      fireEvent.click(sonarPill);
      
      // Sonar should now be hidden
      // Il ne doit rester que le texte "Sonar" du bouton du filtre
      const remainingSonar = screen.getAllByText("Sonar");
      expect(remainingSonar.length).toBe(1);
      expect(remainingSonar[0].closest('button')).toBeInTheDocument();
      expect(remainingSonar[0].closest('a')).toBeNull();
    });

    it("resets KPI visibility when reset button is clicked", () => {
      render(<QualityClient projects={mockProjects} />);
      
      const coveragePill = screen.getByTestId("kpi-pill-coverage");
      fireEvent.click(coveragePill); // Hide it
      
      const resetButton = screen.getByTitle("Réinitialiser tous les filtres");
      fireEvent.click(resetButton);
      
      // Should be visible again
      expect(screen.getAllByText("Couverture").length).toBeGreaterThan(0);
    });
  });

  describe("Line Coverage Improvements", () => {
    it("displays 'Inconnu' status when all metrics are unknown", () => {
      const unknownMetrics: ProjectQuality["metrics"] = {
        sonar: { ...mockProjects[0].metrics.sonar, status: "unknown" },
        eslint: { ...mockProjects[0].metrics.eslint, status: "unknown" },
        vuetsclint: { ...mockProjects[0].metrics.vuetsclint, status: "unknown" },
        coverage: { ...mockProjects[0].metrics.coverage, status: "unknown" },
        auditProd: { ...mockProjects[0].metrics.auditProd, status: "unknown" },
        auditDev: { ...mockProjects[0].metrics.auditDev, status: "unknown" },
        typecheck: { ...mockProjects[0].metrics.typecheck, status: "unknown" },
      };
      const unknownProject: ProjectQuality = {
        ...mockProjects[0],
        id: "unknown-project",
        label: "Unknown Project",
        metrics: unknownMetrics,
      };

      render(<QualityClient projects={[unknownProject]} />);
      expect(screen.getByText("Inconnu")).toBeInTheDocument();
    });

    it("displays 'Stable' status when mixed passed and unknown metrics", () => {
      const mixedMetrics: ProjectQuality["metrics"] = {
        sonar: { ...mockProjects[0].metrics.sonar, status: "unknown" },
        eslint: { ...mockProjects[0].metrics.eslint, status: "unknown" },
        vuetsclint: { ...mockProjects[0].metrics.vuetsclint, status: "unknown" },
        coverage: { ...mockProjects[0].metrics.coverage, status: "passed" },
        auditProd: { ...mockProjects[0].metrics.auditProd, status: "unknown" },
        auditDev: { ...mockProjects[0].metrics.auditDev, status: "unknown" },
        typecheck: { ...mockProjects[0].metrics.typecheck, status: "unknown" },
      };
      const mixedProject: ProjectQuality = {
        ...mockProjects[0],
        id: "mixed-project",
        label: "Mixed Project",
        metrics: mixedMetrics,
      };

      render(<QualityClient projects={[mixedProject]} />);
      expect(screen.getByText("Stable")).toBeInTheDocument();
    });

    it("opens DetailsModal and shows 'Évolution historique' when MetricCell is clicked", async () => {
      mockSearchParams = new URLSearchParams("project=wse");
      render(<QualityClient projects={mockProjects} />);
      
      const coverageCellLabel = screen.getAllByText("Couverture").find(el => el.closest('div.flex.flex-col.rounded-2xl'));
      const cell = coverageCellLabel!.closest('div.flex.flex-col.rounded-2xl');
      
      expect(cell).toBeInTheDocument();
      fireEvent.click(cell!);
      
      await waitFor(() => {
        expect(screen.getByText("Évolution historique")).toBeInTheDocument();
        expect(screen.getByText("Détails Couverture")).toBeInTheDocument();
      });
    });

    it("renders audit details in MetricCell when details prop is present", () => {
      mockSearchParams = new URLSearchParams("project=wse");
      // mockProjects[0].metrics.coverage has details: { Statements: 80, Branches: 80, Functions: 80, Lines: 80 }
      render(<QualityClient projects={mockProjects} />);
      
      expect(screen.getAllByText("Statements").length).toBeGreaterThan(0);
      expect(screen.getAllByText("80%").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Branches").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Functions").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Lines").length).toBeGreaterThan(0);
    });
  });

  it("triggers legacy trend fallback", () => {
    const legacyTrendProject: ProjectQuality = {
      ...mockProjects[0],
      id: "legacy-trend",
      metrics: {
        ...mockProjects[0].metrics,
        coverage: {
          ...mockProjects[0].metrics.coverage,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          trend: { status: "up", difference: 10, isGood: true } as any
        }
      }
    };
    render(<QualityClient projects={[legacyTrendProject]} />);
    expect(screen.getByText("+10")).toBeInTheDocument();
  });
});
