import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import fs from "fs";

// Mock dependencies
vi.mock("axios");
vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
  },
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe("syncSonar", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.stubEnv("SONAR_TOKEN", "test-token");
    vi.stubEnv("SONAR_URL", "https://sonarcloud.io");
    vi.stubEnv("SONAR_ORGANIZATION", "anatec");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("should skip sync if SONAR_TOKEN is missing", async () => {
    vi.stubEnv("SONAR_TOKEN", "");
    const { syncSonar } = await import("./syncSonar");
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    await syncSonar();
    
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("SONAR_TOKEN is not defined"));
    expect(axios.get).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should fetch and save sonar data for mapped projects", async () => {
    const { syncSonar } = await import("./syncSonar");
    const mockSonarData = {
      component: {
        measures: [
          { metric: "alert_status", value: "OK" },
          { metric: "bugs", value: "5" },
          { metric: "reliability_rating", value: "1.0" },
          { metric: "vulnerabilities", value: "2" },
          { metric: "security_rating", value: "1.0" },
          { metric: "code_smells", value: "10" },
          { metric: "sqale_rating", value: "1.0" },
          { metric: "security_hotspots_reviewed", value: "100" },
          { metric: "security_review_rating", value: "1.0" },
          { metric: "coverage", value: "85.5" },
          { metric: "duplicated_lines_density", value: "1.2" },
          { metric: "ncloc", value: "1500" },
        ],
      },
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockSonarData });
    vi.mocked(fs.existsSync).mockReturnValue(true);

    await syncSonar();

    // Verify it called axios
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/measures/component"),
      expect.any(Object)
    );

    // Verify it wrote to disk
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining("sonar.json"),
      expect.stringContaining('"Security": "A"')
    );
  });

  it("should handle axios errors gracefully", async () => {
    const { syncSonar } = await import("./syncSonar");
    vi.mocked(axios.get).mockRejectedValue(new Error("Network Error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await syncSonar();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error fetching Sonar data"),
      "Network Error"
    );
    consoleSpy.mockRestore();
  });
});
