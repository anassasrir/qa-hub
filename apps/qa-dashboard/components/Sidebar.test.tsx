import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "./Sidebar";
import React from "react";
import { usePathname, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => ""),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
}));

describe("Sidebar", () => {
  it("should render all navigation links in top header and not contain Accueil", () => {
    render(<Sidebar />);
    expect(screen.getByText("WeSave QA Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Accueil")).not.toBeInTheDocument();
    expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
    expect(screen.getByText("Comparaison des Runs")).toBeInTheDocument();

    // Check brand logo links to dashboard cleanly without ?project=all
    const brandLogo = screen.getByText("WeSave QA Dashboard").closest("a");
    expect(brandLogo).toHaveAttribute("href", "/dashboard");

    // Check dashboard link default
    const dashboardLink = screen.getByText("Tableau de bord").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("should link cleanly without query params when project is 'all'", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=all") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<Sidebar />);

    const brandLogo = screen.getByText("WeSave QA Dashboard").closest("a");
    expect(brandLogo).toHaveAttribute("href", "/dashboard");

    const dashboardLink = screen.getByText("Tableau de bord").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  it("should highlight the active link", () => {
    vi.mocked(usePathname).mockReturnValue("/dashboard");
    render(<Sidebar />);

    const dashboardLink = screen.getByText("Tableau de bord").closest("a");
    expect(dashboardLink).toHaveClass("bg-blue-600");
  });

  it("should include project param in links if present", () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams("project=wse") as unknown as ReturnType<
        typeof useSearchParams
      >,
    );
    render(<Sidebar />);

    const brandLogo = screen.getByText("WeSave QA Dashboard").closest("a");
    expect(brandLogo).toHaveAttribute("href", "/dashboard?project=wse");

    const dashboardLink = screen.getByText("Tableau de bord").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard?project=wse");
  });

  it("should open and close mobile menu when mobile toggle button is clicked", () => {
    render(<Sidebar />);

    const mobileToggle = screen.getByTestId("mobile-toggle");

    // Initially, desktop links only
    expect(screen.getAllByText("Tableau de bord")).toHaveLength(1);

    // Click mobile menu toggle
    fireEvent.click(mobileToggle);
    expect(screen.getAllByText("Tableau de bord")).toHaveLength(2);

    // Click again to close
    fireEvent.click(mobileToggle);
    expect(screen.getAllByText("Tableau de bord")).toHaveLength(1);
  });
});
