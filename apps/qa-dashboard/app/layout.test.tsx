import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "./layout";
import React from "react";

// Mock the next/font/google to avoid actual font loading logic errors in tests
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "mock-inter" }),
  JetBrains_Mono: () => ({ variable: "mock-jetbrains" }),
}));

// Mock the sidebar to keep the layout simple for this test
vi.mock("../components/Sidebar", () => ({
  default: () => <div data-testid="sidebar">Sidebar Mock</div>,
}));

describe("RootLayout", () => {
  it("renders children inside the layout structure", () => {
    const { getByTestId, getByText } = render(
      <RootLayout>
        <div data-testid="test-child">Child Content</div>
      </RootLayout>
    );

    expect(getByTestId("sidebar")).toBeInTheDocument();
    expect(getByTestId("test-child")).toBeInTheDocument();
    expect(getByText("Child Content")).toBeInTheDocument();
  });
});