import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parsePlaywrightJson, getAllRuns } from "./parseResults";
import fs from "fs";
import { RunData } from "./utils";

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    lstatSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));

describe("parseResults", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("parsePlaywrightJson", () => {
    it("should return null if file does not exist or is invalid", () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("File not found");
      });
      const result = parsePlaywrightJson(
        "non-existent.json",
        "run-1",
        "2023-01-01",
      );
      expect(result).toBeNull();
    });

    it("should parse a complex Playwright JSON correctly", () => {
      const mockData = {
        config: { projects: [{ name: "chromium" }] },
        suites: [
          {
            title: "auth.spec.ts",
            file: "auth.spec.ts",
            suites: [
              {
                title: "nested suite",
                specs: [
                  {
                    title: "Login test",
                    file: "auth.spec.ts",
                    tests: [
                      {
                        projectName: "chromium",
                        status: "unexpected",
                        results: [
                          {
                            status: "failed",
                            duration: 1000,
                            error: {
                              message: "Error msg",
                              stack: "stack trace",
                            },
                            attachments: [
                              {
                                name: "screenshot",
                                contentType: "image/png",
                                path: "artifact/screenshot.png",
                              },
                              {
                                name: "trace",
                                contentType: "application/zip",
                                path: "data/runs/run-1/trace.zip",
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        stats: {
          expected: 0,
          unexpected: 1,
          skipped: 0,
          flaky: 0,
          duration: 2000,
        },
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));

      const result = parsePlaywrightJson("valid.json", "run-1", "2023-01-01");

      expect(result).not.toBeNull();
      expect(result?.tests).toHaveLength(1);
      expect(result?.tests[0].status).toBe("failed");
      expect(result?.tests[0].suite).toBe("nested suite");
      expect(result?.tests[0].results[0].attachments[0].path).toBe(
        "/artifacts/screenshot.png",
      );
      expect(result?.tests[0].results[0].attachments[1].path).toBe(
        "/runs/run-1/trace.zip",
      );
    });

    it("should calculate stats if missing in JSON", () => {
      const mockData = {
        config: { projects: [{ name: "chromium" }] },
        suites: [
          {
            specs: [
              {
                title: "Test 1",
                tests: [
                  { status: "expected" },
                  { status: "unexpected" },
                  { status: "flaky" },
                ],
              },
            ],
          },
        ],
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));
      const result = parsePlaywrightJson(
        "no-stats.json",
        "run-1",
        "2023-01-01",
      );
      expect(result?.stats.expected).toBe(1);
      expect(result?.stats.unexpected).toBe(1);
      expect(result?.stats.flaky).toBe(1);
    });
  });

  describe("getAllRuns", () => {
    it("should handle errors in CI run parsing", () => {
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        p.toString().includes("public/runs"),
      );
      vi.mocked(fs.readdirSync).mockReturnValue(["bad-run"] as unknown as ReturnType<typeof fs.readdirSync>);
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("Bad JSON");
      });

      const runs = getAllRuns();
      expect(runs).toEqual([]);
    });

    it("should read local runs when not in CI", () => {
      delete process.env.CI;

      vi.mocked(fs.existsSync).mockImplementation(
        (p) =>
          p.toString().includes("artifact") ||
          p.toString().includes("public/runs"),
      );
      vi.mocked(fs.readdirSync).mockImplementation(((p: fs.PathLike) => {
        if (p.toString().includes("artifact")) return ["run-local-1"];
        return [];
      }) as unknown as typeof fs.readdirSync);
      vi.mocked(fs.lstatSync).mockReturnValue({
        isDirectory: () => true,
      } as unknown as fs.Stats);

      // Mock parsePlaywrightJson to return a dummy run
      const mockData = {
        config: { projects: [{ name: "chromium" }] },
        suites: [],
        stats: { duration: 100 },
      };
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockData));
      vi.mocked(fs.existsSync).mockImplementation(() => true); // All files exist for this test

      const results = getAllRuns();
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toContain("Local Run");
    });

    it("should read CI runs and fix attachment paths", () => {
      process.env.CI = "true";
      vi.mocked(fs.existsSync).mockImplementation((p) =>
        p.toString().includes("public/runs"),
      );
      vi.mocked(fs.readdirSync).mockImplementation(((p: fs.PathLike) => {
        if (p.toString().includes("public/runs")) return ["run-ci-1"];
        return [];
      }) as unknown as typeof fs.readdirSync);

      const mockCiRun = {
        id: "CI-123",
        date: "2023-01-01",
        tests: [
          {
            title: "CI test",
            status: "passed",
            results: [
              {
                status: "passed",
                attachments: [
                  {
                    name: "trace",
                    path: "/builds/repo/test-results/trace.zip",
                  },
                  { name: "video", path: "video.webm" },
                ],
              },
            ],
          },
        ],
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockCiRun));
      vi.mocked(fs.existsSync).mockImplementation(
        (p) =>
          p.toString().includes("results.json") ||
          p.toString().includes("public/runs"),
      );

      const runs = getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0].id).toBe("CI Run - 123");
      expect(runs[0].tests[0].results?.[0].attachments[0].path).toBe(
        "/runs/run-ci-1/test-results/trace.zip",
      );
      expect(runs[0].tests[0].results?.[0].attachments[1].path).toBe(
        "/runs/run-ci-1/video.webm",
      );
    });

    it("should filter out local runs when in CI", () => {
      process.env.CI = "true";

      // Need to mock the filesystem so getAllRuns actually runs its logic
      vi.mocked(fs.existsSync).mockReturnValue(false); // Simplest way to return empty then inject

      vi.mocked(fs.existsSync).mockImplementation((p) =>
        p.toString().includes("public/runs"),
      );
      vi.mocked(fs.readdirSync).mockImplementation((() => [
        "ci-folder",
        "local-folder",
      ]) as unknown as typeof fs.readdirSync);

      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        if (p.toString().includes("ci-folder"))
          return JSON.stringify({ id: "CI-1", date: "2023-01-01", tests: [] });
        if (p.toString().includes("local-folder"))
          return JSON.stringify({
            id: "Local Run - 1",
            date: "2023-01-02",
            tests: [],
          });
        return "";
      });

      const results = getAllRuns();
      expect(results.every((r: RunData) => !r.id.includes("Local Run"))).toBe(true);
    });

    it("should categorize tests and normalize tpbp-visual to tpbp", () => {
      const mockCiRun = {
        id: "CI-999",
        project: "tpbp-visual",
        tests: [
          {
            title: "Visual actualisation @visual",
            file: "specs/tpbp/visual/actualisation.feature",
            project: "tpbp-visual",
            status: "passed",
          },
          {
            title: "Datepicker component test",
            file: "specs/tpbp/components/date-picker.feature",
            project: "tpbp",
            status: "passed",
          },
          {
            title: "Login standard test",
            file: "specs/tpbp/login.feature",
            project: "tpbp",
            status: "passed",
          },
        ],
      };

      vi.mocked(fs.readdirSync).mockImplementation((() => [
        "run-tpbp",
      ]) as unknown as typeof fs.readdirSync);
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockCiRun));
      vi.mocked(fs.existsSync).mockImplementation(
        (p) =>
          p.toString().includes("results.json") ||
          p.toString().includes("public/runs"),
      );

      const runs = getAllRuns();
      expect(runs).toHaveLength(1);
      expect(runs[0].project).toBe("tpbp");
      expect(runs[0].tests[0].category).toBe("visual");
      expect(runs[0].tests[0].project).toBe("tpbp");
      expect(runs[0].tests[1].category).toBe("component");
      expect(runs[0].tests[2].category).toBe("functional");
    });
  });
});
