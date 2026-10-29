import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import TestPlanPage from "./page";
import React from "react";

vi.mock("./TestPlanClient", () => ({
  default: () => <div data-testid="testplan-client">Test Plan Mock</div>,
}));

describe("TestPlanPage", () => {
  it("renders suspense and test plan client", () => {
    render(<TestPlanPage />);
    expect(screen.getByTestId("testplan-client")).toBeInTheDocument();
  });
});