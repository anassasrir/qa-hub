import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatMetric, getQualityData } from "./parseQuality";
import fs from "fs";

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    statSync: vi.fn(),
  },
}));

describe("parseQuality", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("formatMetric", () => {
    it("should format eslint metrics correctly", () => {
      expect(formatMetric("eslint", { errors: 2, warnings: 5 })).toEqual({
        value: "2 err, 5 warn",
        status: "failed",
        details: { Erreurs: 2, Warnings: 5 },
      });
      expect(formatMetric("eslint", { errors: 0, warnings: 5 })).toEqual({
        value: "0 err, 5 warn",
        status: "warning",
        details: { Erreurs: 0, Warnings: 5 },
      });
      expect(formatMetric("eslint", { errors: 0, warnings: 0 })).toEqual({
        value: "0 err, 0 warn",
        status: "passed",
        details: { Erreurs: 0, Warnings: 0 },
      });
      expect(formatMetric("eslint", {})).toEqual({
        value: "N/A",
        status: "unknown",
      });
    });

    it("should format coverage metrics correctly", () => {
      expect(formatMetric("coverage", { percentage: 40 })).toEqual({
        value: "40%",
        status: "failed",
        details: undefined,
      });
      expect(formatMetric("coverage", { percentage: 70 })).toEqual({
        value: "70%",
        status: "warning",
        details: undefined,
      });
      expect(formatMetric("coverage", { percentage: 85 })).toEqual({
        value: "85%",
        status: "passed",
        details: undefined,
      });
      expect(formatMetric("coverage", {})).toEqual({
        value: "N/A",
        status: "unknown",
      });
    });

    it("should format audit metrics correctly", () => {
      expect(
        formatMetric("auditProd", { vulnerabilities: { high: 1 }, dependencies: 10 }),
      ).toEqual({
        value: "1 (1 high)",
        status: "failed",
        totalDependencies: 10,
        details: { Critical: 0, High: 1, Moderate: 0, Low: 0 },
      });

      expect(
        formatMetric("auditDev", { vulnerabilities: { high: 1 } }),
      ).toEqual({
        value: "1 (1 high)",
        status: "warning",
        totalDependencies: 0,
        details: { Critical: 0, High: 1, Moderate: 0, Low: 0 },
      });

      expect(
        formatMetric("auditProd", { vulnerabilities: { moderate: 1 } }),
      ).toEqual({
        value: "1 vuln.",
        status: "warning",
        totalDependencies: 0,
        details: { Critical: 0, High: 0, Moderate: 1, Low: 0 },
      });

      expect(formatMetric("auditProd", {})).toEqual({
        value: "N/A",
        status: "unknown",
      });

      expect(formatMetric("auditProd", { vulnerabilities: 5, details: { Critical: 2 } })).toEqual({
        value: "5 (2 crit.)",
        status: "failed",
        totalDependencies: 0,
        details: { Critical: 2 },
      });
    });

    it("should format typecheck metrics correctly", () => {
      expect(formatMetric("typecheck", { errors: 0 })).toEqual({
        value: "0 erreurs",
        status: "passed",
      });
      expect(formatMetric("typecheck", { errors: 5 })).toEqual({
        value: "Erreurs détectées",
        status: "failed",
      });
      expect(formatMetric("typecheck", {})).toEqual({
        value: "N/A",
        status: "unknown",
      });
    });

    it("should return unknown for unrecognized type", () => {
      expect(formatMetric("unknown_type", {})).toEqual({
        value: "N/A",
        status: "unknown",
      });
    });
  });

  describe("getQualityData", () => {
    it("should return projects with metrics from files", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      const mockStatSync = vi.mocked(fs.statSync);

      // Mock that only wesave-test-qa/eslint.json exists
      mockExistsSync.mockImplementation((p: import("fs").PathLike) =>
        p.toString().endsWith("wesave-test-qa/eslint.json"),
      );
      mockReadFileSync.mockReturnValue(
        JSON.stringify({ errors: 0, warnings: 2 }),
      );
      mockStatSync.mockReturnValue({
        mtimeMs: 1000,
      } as unknown as import("fs").Stats);

      const data = getQualityData();

      const tms = data.find((p) => p.id === "tms");
      expect(tms).toBeDefined();
      expect(tms?.metrics.eslint).toMatchObject({
        errors: 0,
        warnings: 2,
        value: "0 err, 2 warn",
        status: "warning",
      });

      // Check for default values on missing files
      expect(tms?.metrics.coverage.status).toBe("unknown");
      expect(tms?.metrics.coverage.value).toBe("N/A");
    });
    
    it("should handle JSON parse errors gracefully", () => {
      const mockExistsSync = vi.mocked(fs.existsSync);
      const mockReadFileSync = vi.mocked(fs.readFileSync);
      const mockStatSync = vi.mocked(fs.statSync);

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue("invalid json");
      mockStatSync.mockReturnValue({ mtimeMs: 1000 } as unknown as import("fs").Stats);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const data = getQualityData();
      expect(data).toBeDefined();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
