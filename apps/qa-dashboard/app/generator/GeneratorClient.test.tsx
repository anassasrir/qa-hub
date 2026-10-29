import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import GeneratorClient from "./GeneratorClient";
import React from "react";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("")),
  usePathname: vi.fn(() => "/generator"),
}));

describe("GeneratorClient", () => {
  it("should render the generator client header and options", () => {
    render(<GeneratorClient />);
    expect(screen.getByText("Gherkin")).toBeInTheDocument();
    expect(screen.getByText("Option A : Google Gem")).toBeInTheDocument();
    expect(screen.getByText(/Option B : Gemini intégré/i)).toBeInTheDocument();
    expect(screen.getByText(/Option C : Assistant hors-ligne/i)).toBeInTheDocument();
  });

  it("should render Google Gem by default", () => {
    render(<GeneratorClient />);
    expect(screen.getByText("Démarrer le Gem WeSave PO")).toBeInTheDocument();
  });

  it("should support switching to Option C (Offline) and inputting text", () => {
    render(<GeneratorClient />);

    // Switch to Option C (Offline Assistant)
    const offlineBtn = screen.getByText(/Option C : Assistant hors-ligne/i);
    fireEvent.click(offlineBtn);

    expect(screen.getByText("Traducteur local instantané")).toBeInTheDocument();
    const textarea = screen.getByPlaceholderText(
      /Collez votre script Playwright ici/i,
    );
    fireEvent.change(textarea, {
      target: { value: "Une description de test" },
    });

    expect(textarea).toHaveValue("Une description de test");
  });

  it("should support switching to Option B (Gemini intégré)", () => {
    render(<GeneratorClient />);

    // Click on Option B (Gemini intégré)
    const aiBtn = screen.getByText(/Option B : Gemini intégré/i);
    fireEvent.click(aiBtn);
    expect(screen.getByText("Génération assistée par IA")).toBeInTheDocument();
  });
});
