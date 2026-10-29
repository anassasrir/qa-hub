import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectSelector from "./ProjectSelector";
import React from "react";

describe("ProjectSelector", () => {
  const mockOnProjectChange = vi.fn();

  it("should render all project buttons", () => {
    render(
      <ProjectSelector
        selectedProject="all"
        onProjectChange={mockOnProjectChange}
      />,
    );

    expect(screen.getByText("Tous les projets")).toBeInTheDocument();
    expect(screen.getByText("TPBP")).toBeInTheDocument();
    expect(screen.getByText("WeSaveEpargne")).toBeInTheDocument();
    expect(screen.getByText("B4Bank")).toBeInTheDocument();
    expect(screen.getByText("Advisory")).toBeInTheDocument();
    //expect(screen.getByText("QA Dashboard")).toBeInTheDocument();
  });

  it("should highlight the selected project", () => {
    render(
      <ProjectSelector
        selectedProject="wse"
        onProjectChange={mockOnProjectChange}
      />,
    );

    const wesaveButton = screen.getByText("WeSaveEpargne");
    expect(wesaveButton).toHaveClass("bg-white");
    expect(wesaveButton).toHaveClass("text-blue-600");
  });

  it("should call onProjectChange when a button is clicked", () => {
    render(
      <ProjectSelector
        selectedProject="all"
        onProjectChange={mockOnProjectChange}
      />,
    );

    fireEvent.click(screen.getByText("WeSaveEpargne"));
    expect(mockOnProjectChange).toHaveBeenCalledWith("wse");
  });

  it('should call onProjectChange("all") when reset button is clicked', () => {
    render(
      <ProjectSelector
        selectedProject="wse"
        onProjectChange={mockOnProjectChange}
      />,
    );

    const resetButton = screen.getByTitle("Réinitialiser le projet");
    fireEvent.click(resetButton);
    expect(mockOnProjectChange).toHaveBeenCalledWith("all");
  });

  it('should disable reset button when "all" is selected', () => {
    render(
      <ProjectSelector
        selectedProject="all"
        onProjectChange={mockOnProjectChange}
      />,
    );

    const resetButton = screen.getByTitle("Réinitialiser le projet");
    expect(resetButton).toBeDisabled();
  });
});
