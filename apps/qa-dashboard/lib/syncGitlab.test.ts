import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseEslint,
  parseCoverage,
  syncQualityData,
  extractAndSaveVisualRun,
} from "./syncGitlab";
import { VisualRunData } from "./parseVisual";
import fs from "fs";
import axios, { AxiosInstance } from "axios";

// Mock dependencies
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    lstatSync: vi.fn(),
    unlinkSync: vi.fn(),
    rmdirSync: vi.fn(),
    readFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    copyFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
  },
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  lstatSync: vi.fn(),
  unlinkSync: vi.fn(),
  rmdirSync: vi.fn(),
  readFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  copyFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  statSync: vi.fn(),
}));

vi.mock("axios");
vi.mock("adm-zip", () => {
  return {
    default: class AdmZipMock {
      extractAllTo() {}
    },
  };
});

// Mock syncSonar to prevent side effects and errors
vi.mock("./syncSonar", () => ({
  syncSonar: vi.fn().mockResolvedValue(undefined),
}));

describe("syncGitlab", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.resetAllMocks();
    process.env.GITLAB_URL = "https://gitlab.com";
    process.env.GITLAB_PROJECT_ID = "123";
    process.env.GITLAB_TOKEN = "token";
    process.env.CI_PIPELINE_ID = "456";
    process.env.CI = "true";
    vi.stubEnv("NODE_ENV", "test");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("Parsers", () => {
    it("parseEslint should count errors and warnings", () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([
        { errorCount: 2, warningCount: 3 },
        { errorCount: 1, warningCount: 0 }
      ]));
      expect(parseEslint("path")).toEqual({ errors: 3, warnings: 3 });
    });

    it("parseEslint should handle object format", () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ errors: 5, warnings: 2 }));
      expect(parseEslint("path")).toEqual({ errors: 5, warnings: 2 });
    });

    it("parseCoverage should extract percentages", () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
        total: {
          lines: { pct: 80.5 },
          statements: { pct: 81.2 },
          branches: { pct: 75 },
          functions: { pct: 90 }
        }
      }));
      expect(parseCoverage("path")).toEqual({
        percentage: 80.5,
        details: { Lines: 80.5, Statements: 81.2, Branches: 75, Functions: 90 }
      });
    });
  });

  describe("syncQualityData", () => {
    it("should fetch pipelines and jobs artifacts", async () => {
      const mockApi = {
        get: vi.fn().mockImplementation((url) => {
          if (url.includes("/jobs") && !url.includes("/artifacts")) {
            return Promise.resolve({ data: [{ id: 10, name: "quality-gate", status: "success", artifacts_file: {} }] });
          }
          if (url.includes("/pipelines") && !url.includes("/jobs")) {
            return Promise.resolve({ data: [{ id: 1, created_at: "2023-01-01", status: "success" }] });
          }
          if (url.includes("/artifacts")) {
            return Promise.resolve({ data: new ArrayBuffer(0) });
          }
          return Promise.resolve({ data: [] });
        }),
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockImplementation((pathArg) => {
        if (pathArg.toString().includes("projects.json")) {
          return JSON.stringify([{ id: "test-project", projectId: "123", branch: "main" }]);
        }
        // Return valid ESLint data to avoid early return in processQualityFile
        return JSON.stringify({ errors: 0, warnings: 0 });
      });

      vi.mocked(fs.readdirSync).mockImplementation(((dir: fs.PathLike) => {
          if (dir.toString().includes("temp-quality")) return ["eslint-results.json"];
          return [];
      }) as unknown as typeof fs.readdirSync);
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false } as unknown as fs.Stats);

      await syncQualityData(mockApi as unknown as AxiosInstance);

      expect(mockApi.get).toHaveBeenCalledWith(expect.stringContaining("/pipelines"), expect.any(Object));
      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe("syncGitlab main", () => {
    it("should process pipelines and extract artifacts", async () => {
      const { syncGitlab } = await import("./syncGitlab");
      
      const mockApi = {
        get: vi.fn().mockImplementation((url) => {
          if (url.includes("/pipelines") && !url.includes("/jobs") && !url.includes("/artifacts")) {
            return Promise.resolve({
              data: [
                { id: 100, name: "CI | wse | staging", created_at: "2023-01-01T00:00:00Z" }
              ]
            });
          }
          if (url.includes("/jobs") && !url.includes("/artifacts")) {
            return Promise.resolve({
              data: [
                { id: 200, name: "test-wse-e2e", status: "success", artifacts_file: { filename: "artifacts.zip" } }
              ]
            });
          }
          if (url.includes("/artifacts")) {
            return Promise.resolve({ data: new ArrayBuffer(0) });
          }
          return Promise.resolve({ data: [] });
        }),
        create: vi.fn().mockReturnThis(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(axios.create).mockReturnValue(mockApi as any);
      
      vi.mocked(fs.existsSync).mockImplementation((pathArg) => {
          const pathStr = pathArg.toString();
          if (pathStr.includes("results.json")) return false; // Force write
          return true;
      });
      
      vi.mocked(fs.readdirSync).mockImplementation(((dir: fs.PathLike) => {
          const dirStr = dir.toString();
          if (dirStr.match(/\/\d+$/)) return ["artifact"];
          if (dirStr.endsWith("/artifact")) return ["2026-09-22T08-13-31-821Z"];
          if (dirStr.endsWith("/2026-09-22T08-13-31-821Z")) return ["test-results"];
          if (dirStr.endsWith("/test-results")) return ["results.json"];
          return [];
      }) as unknown as typeof fs.readdirSync);
      
      vi.mocked(fs.lstatSync).mockImplementation(((pathArg: fs.PathLike) => {
          const isDir = !pathArg.toString().endsWith(".json");
          return { isDirectory: () => isDir } as unknown as fs.Stats;
      }) as unknown as typeof fs.lstatSync);

      vi.mocked(fs.readFileSync).mockImplementation((pathArg) => {
        const pathStr = pathArg.toString();
        if (pathStr.includes("results.json")) {
          return JSON.stringify({
            metadata: { jobId: "200" },
            suites: [{
              title: "Suite",
              specs: [{
                title: "Spec",
                file: "test.spec.ts",
                tests: [{
                  projectName: "chromium",
                  status: "expected",
                  results: [{ status: "passed", duration: 100 }]
                }]
              }]
            }],
            stats: { expected: 1, unexpected: 0, skipped: 0, flaky: 0, duration: 100 }
          });
        }
        if (pathStr.includes("projects.json")) {
          return JSON.stringify([{ id: "wse", projectId: "123", label: "WeSave" }]);
        }
        return "{}";
      });

      await syncGitlab();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("results.json"),
        expect.stringContaining('"project": "wse"')
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("results.json"),
        expect.stringContaining('"reportUrl": "https://anatec.gitlab.io/-/frontend/qa/wesave-test-qa/-/jobs/200/artifacts/artifact/2026-09-22T08-13-31-821Z/playwright-report/index.html"')
      );
    });

    it("should handle flaky tests and job failures", async () => {
      const { syncGitlab } = await import("./syncGitlab");
      
      const mockApi = {
        get: vi.fn().mockImplementation((url) => {
          if (url.includes("/pipelines") && !url.includes("/jobs")) {
            return Promise.resolve({
              data: [{ id: 101, name: "CI | wse | dev", created_at: "2023-01-01T00:00:00Z" }]
            });
          }
          if (url.includes("/jobs") && !url.includes("/artifacts")) {
            return Promise.resolve({
              data: [
                { id: 201, name: "test-wse-1", status: "success", artifacts_file: { filename: "a.zip" } },
                { id: 202, name: "test-wse-2", status: "failed", artifacts_file: { filename: "b.zip" } }
              ]
            });
          }
          if (url.includes("/artifacts")) {
            return Promise.resolve({ data: new ArrayBuffer(0) });
          }
          return Promise.resolve({ data: [] });
        }),
        create: vi.fn().mockReturnThis(),
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.mocked(axios.create).mockReturnValue(mockApi as any);
      
      vi.mocked(fs.existsSync).mockImplementation((pathArg) => {
          const pathStr = pathArg.toString();
          if (pathStr.includes("results.json")) return false;
          if (pathStr.match(/\/\d+$/)) return true; // job dirs exist
          return true;
      });
      
      vi.mocked(fs.readdirSync).mockImplementation(((dir: fs.PathLike) => {
          if (dir.toString().match(/\/\d+$/)) return ["results.json"];
          return [];
      }) as unknown as typeof fs.readdirSync);
      
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false } as unknown as fs.Stats);

      vi.mocked(fs.readFileSync).mockImplementation((pathArg) => {
        const pathStr = pathArg.toString();
        if (pathStr.includes("results.json")) {
          const status = pathStr.includes("201") ? "passed" : "failed";
          return JSON.stringify({
            suites: [{
              title: "Suite",
              specs: [{
                title: "Spec",
                file: "test.spec.ts",
                tests: [{
                  projectName: "chromium",
                  status: status === "passed" ? "expected" : "unexpected",
                  results: [{ status: status, duration: 100 }]
                }]
              }]
            }]
          });
        }
        if (pathStr.includes("projects.json")) {
          return JSON.stringify([{ id: "wse", projectId: "123" }]);
        }
        return "{}";
      });

      await syncGitlab();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("results.json"),
        expect.stringContaining('"status": "flaky"')
      );
    });
  });

  describe("extractAndSaveVisualRun", () => {
    it("should extract all failed screenshot comparisons from res.errors instead of only the first one", () => {
      const mockPipeline = {
        id: 2874347016,
        ref: "test/tpbp-enable-design-system",
        sha: "9cac636",
        created_at: "2026-09-23T09:11:27.000Z",
        status: "failed",
        name: "# | tpbp | tpbp-visual (scheduled)",
      };

      const mockJob = {
        id: 16675940167,
        name: "test-tpbp-visual-desktop",
        status: "failed",
      };

      const mockResultsData = {
        suites: [
          {
            title: "Actualisation Suite",
            file: "actualisation.spec.ts",
            specs: [
              {
                title: "Actualiser votre situation",
                tests: [
                  {
                    projectName: "chromium",
                    status: "unexpected",
                    results: [
                      {
                        status: "failed",
                        duration: 12000,
                        errors: [
                          {
                            message:
                              "Error: expect(page).toHaveScreenshot(expected) failed\n\nExpected an image 2560px by 2353px, received 2560px by 2219px. 124702 pixels (ratio 0.03 of all image pixels) are different.\n\nSnapshot: actualisations/1-situation.png",
                          },
                          {
                            message:
                              "Error: expect(page).toHaveScreenshot(expected) failed\n\nExpected an image 2560px by 1453px, received 2560px by 1442px. 48599 pixels (ratio 0.02 of all image pixels) are different.\n\nSnapshot: dashboards/1-synthèse.png",
                          },
                          {
                            message:
                              "Error: expect(page).toHaveScreenshot(expected) failed\n\nExpected an image 2560px by 800px, received 2560px by 800px. 300000 pixels (ratio 0.65 of all image pixels) are different.\n\nSnapshot: nouvelle-souscription/4-popup-compte-depot.png",
                          },
                        ],
                        attachments: [
                          {
                            name: "actualisations/1-situation-expected.png",
                            path: "actualisations/1-situation-expected.png",
                          },
                          {
                            name: "actualisations/1-situation-actual.png",
                            path: "actualisations/1-situation-actual.png",
                          },
                          {
                            name: "actualisations/1-situation-diff.png",
                            path: "actualisations/1-situation-diff.png",
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
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(mockResultsData),
      );

      let savedPayload: VisualRunData | null = null;
      vi.mocked(fs.writeFileSync).mockImplementation((pathArg, data) => {
        if (pathArg.toString().includes("2874347016.json")) {
          savedPayload = JSON.parse(data.toString());
        }
      });

      extractAndSaveVisualRun(
        mockPipeline,
        mockJob,
        "/mock/jobDir",
        "/mock/results.json",
      );

      expect(savedPayload).not.toBeNull();
      expect(savedPayload!.items).toHaveLength(3);
      expect(savedPayload!.items[0].snapshot).toBe(
        "actualisations/1-situation.png",
      );
      expect(savedPayload!.items[1].snapshot).toBe(
        "dashboards/1-synthèse.png",
      );
      expect(savedPayload!.items[2].snapshot).toBe(
        "nouvelle-souscription/4-popup-compte-depot.png",
      );
      expect(savedPayload!.items[2].category).toBe(
        "Refonte Modale / Drawer (Impact Majeur)",
      );
      expect(savedPayload!.stats.total).toBe(3);
    });

    it("should deduplicate screenshots across retries within a test", () => {
      const mockPipeline = {
        id: 2881932490,
        ref: "test/tpbp-enable-design-system",
        sha: "abc1234",
        created_at: "2026-09-25T10:22:40.000Z",
        status: "failed",
      };

      const mockJob = {
        id: 16732083309,
        name: "test-tpbp-visual-desktop",
        status: "failed",
      };

      const retryError = {
        message:
          "Error: expect(page).toHaveScreenshot(expected) failed\n\nExpected an image 2560px by 2353px, received 2560px by 2219px. 124702 pixels (ratio 0.03 of all image pixels) are different.\n\nSnapshot: actualisations/1-situation.png",
      };

      const mockResultsData = {
        suites: [
          {
            title: "Suite",
            file: "actualisation.spec.ts",
            specs: [
              {
                title: "Actualiser votre situation",
                tests: [
                  {
                    projectName: "chromium",
                    status: "unexpected",
                    results: [
                      { status: "failed", errors: [retryError], attachments: [] },
                      { status: "failed", errors: [retryError], attachments: [] },
                      { status: "failed", errors: [retryError], attachments: [] },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(
        JSON.stringify(mockResultsData),
      );

      let savedPayload: VisualRunData | null = null;
      vi.mocked(fs.writeFileSync).mockImplementation((pathArg, data) => {
        if (pathArg.toString().includes("2881932490.json")) {
          savedPayload = JSON.parse(data.toString());
        }
      });

      extractAndSaveVisualRun(
        mockPipeline,
        mockJob,
        "/mock/jobDir",
        "/mock/results.json",
      );

      expect(savedPayload).not.toBeNull();
      // Should be 1 item, not 3
      expect(savedPayload!.items).toHaveLength(1);
      expect(savedPayload!.items[0].snapshot).toBe(
        "actualisations/1-situation.png",
      );
    });
  });
});
