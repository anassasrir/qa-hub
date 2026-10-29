import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FeatureHealthChart, FailureTypeChart } from "./AdvancedKPIs";
import React from "react";

const mockTests = [
  {
    file: "tests/auth.spec.ts",
    status: "passed",
    title: "test 1",
    suite: "suite 1",
    duration: 100,
    project: "project",
    results: [],
  },
  {
    file: "tests/auth.spec.ts",
    status: "failed",
    title: "test 2",
    suite: "suite 1",
    duration: 100,
    project: "project",
    results: [
      {
        status: "failed",
        duration: 100,
        error: { message: "timeout", stack: "" },
        attachments: [],
      },
    ],
  },
  {
    file: "tests/payment.spec.ts",
    status: "passed",
    title: "test 3",
    suite: "suite 2",
    duration: 100,
    project: "project",
    results: [],
  },
];

describe("AdvancedKPIs", () => {
  describe("FeatureHealthChart", () => {
    it("should render the chart title", () => {
      render(<FeatureHealthChart tests={mockTests} />);
      expect(screen.getByText(/Santé des Modules/i)).toBeInTheDocument();
      expect(screen.getByText(/% de succès par fichier/i)).toBeInTheDocument();
    });

    it("should render the module names", () => {
      render(<FeatureHealthChart tests={mockTests} />);
      // The component removes .spec.ts
      expect(screen.getByText(/auth/i)).toBeInTheDocument();
      expect(screen.getByText(/payment/i)).toBeInTheDocument();
    });
  });

  describe("FailureTypeChart", () => {
    it("should render the chart title", () => {
      render(<FailureTypeChart tests={mockTests} />);
      expect(screen.getByText("Motifs d'Échec")).toBeInTheDocument();
    });

    it('should show "Aucun échec détecté" when no failures', () => {
      render(<FailureTypeChart tests={[mockTests[0], mockTests[2]]} />);
      expect(screen.getByText("Aucun échec détecté")).toBeInTheDocument();
    });

    it("should group failures by type", () => {
      const failedTests = [
        {
          file: "tests/1.spec.ts",
          status: "failed",
          title: "t1",
          suite: "s",
          duration: 1,
          project: "p",
          results: [
            {
              status: "failed",
              duration: 1,
              error: { message: "timeout occurred", stack: "" },
              attachments: [],
            },
          ],
        },
        {
          file: "tests/2.spec.ts",
          status: "failed",
          title: "t2",
          suite: "s",
          duration: 1,
          project: "p",
          results: [
            {
              status: "failed",
              duration: 1,
              error: { message: "expect(received).toBe(expected)", stack: "" },
              attachments: [],
            },
          ],
        },
        {
          file: "tests/3.spec.ts",
          status: "failed",
          title: "t3",
          suite: "s",
          duration: 1,
          project: "p",
          results: [
            {
              status: "failed",
              duration: 1,
              error: { message: "other error", stack: "" },
              attachments: [],
            },
          ],
        },
      ];
      render(<FailureTypeChart tests={failedTests} />);
      expect(screen.getAllByText("Timeouts")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Assertions")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Autres")[0]).toBeInTheDocument();
    });
  });
});
