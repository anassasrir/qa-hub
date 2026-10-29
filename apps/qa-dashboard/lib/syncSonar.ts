import axios from "axios";
import fs from "fs";
import path from "path";

const SONAR_URL = (process.env.SONAR_URL || "https://sonarcloud.io").trim();
const SONAR_TOKEN = process.env.SONAR_TOKEN?.trim();
const SONAR_ORGANIZATION = (process.env.SONAR_ORGANIZATION || "").trim();

const PROJECT_SONAR_MAP: Record<string, string> = {
  "demo-ecommerce": "demo-ecommerce",
};

const METRICS = [
  "alert_status",
  "bugs",
  "reliability_rating",
  "vulnerabilities",
  "security_rating",
  "code_smells",
  "sqale_rating",
  "security_hotspots_reviewed",
  "security_review_rating",
  "coverage",
  "duplicated_lines_density",
  "ncloc",
];

const RATING_MAP: Record<string, string> = {
  "1.0": "A",
  "2.0": "B",
  "3.0": "C",
  "4.0": "D",
  "5.0": "E",
};

interface SonarMeasure {
  metric: string;
  value: string;
}

interface SonarComponent {
  measures: SonarMeasure[];
}

interface SonarResponse {
  component: SonarComponent;
}

async function fetchSonarData(projectKey: string) {
  try {
    const token = SONAR_TOKEN || "";
    const authHeader = `Basic ${Buffer.from(token + ":").toString("base64")}`;
    
    const response = await axios.get<SonarResponse>(`${SONAR_URL}/api/measures/component`, {
      params: {
        component: projectKey,
        metricKeys: METRICS.join(","),
        organization: SONAR_ORGANIZATION,
      },
      headers: {
        Authorization: authHeader,
      },
    });

    const measures = response.data.component.measures;
    const data: Record<string, string> = {};

    measures.forEach((m: SonarMeasure) => {
      data[m.metric] = m.value;
    });

    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(`Error fetching Sonar data for ${projectKey}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Error fetching Sonar data for ${projectKey}:`, (error as Error).message);
    }
    return null;
  }
}

function formatSonarData(sonarData: Record<string, string> | null) {
  if (!sonarData) return null;

  const status = sonarData.alert_status === "OK" ? "passed" : "failed";
  const value = sonarData.alert_status === "OK" ? "Passed" : "Failed";

  const details: Record<string, string | number> = {
    "Lines of Code": sonarData.ncloc || "N/A",
    "Security": RATING_MAP[sonarData.security_rating] || "N/A",
    "Security (count)": sonarData.vulnerabilities || 0,
    "Reliability": RATING_MAP[sonarData.reliability_rating] || "N/A",
    "Reliability (count)": sonarData.bugs || 0,
    "Maintainability": RATING_MAP[sonarData.sqale_rating] || "N/A",
    "Maintainability (count)": sonarData.code_smells || 0,
    "Security Review": RATING_MAP[sonarData.security_review_rating] || "N/A",
    "Hotspots Reviewed": `${sonarData.security_hotspots_reviewed || 0}%`,
    "Coverage": `${sonarData.coverage || 0}%`,
    "Duplications": `${sonarData.duplicated_lines_density || 0}%`,
  };

  return {
    status,
    value,
    details,
  };
}

async function syncSonar() {
  if (!SONAR_TOKEN) {
    console.warn("SONAR_TOKEN is not defined. Skipping Sonar synchronization.");
    return;
  }

  const dataDir = path.join(process.cwd(), "data");

  for (const [projectId, projectKey] of Object.entries(PROJECT_SONAR_MAP)) {
    console.log(`Syncing Sonar data for ${projectId} (${projectKey})...`);
    const rawData = await fetchSonarData(projectKey);
    const formattedData = formatSonarData(rawData);

    if (formattedData) {
      const projectDir = path.join(dataDir, projectId);
      if (!fs.existsSync(projectDir)) {
        fs.mkdirSync(projectDir, { recursive: true });
      }

      const filePath = path.join(projectDir, "sonar.json");
      fs.writeFileSync(filePath, JSON.stringify(formattedData, null, 2));
      console.log(`✅ Saved Sonar data to ${filePath}`);
    }
  }
}

if (import.meta.url.startsWith("file:")) {
  const modulePath = new URL(import.meta.url).pathname;
  if (process.argv[1] === modulePath || process.argv[1]?.endsWith("syncSonar.ts")) {
    syncSonar();
  }
}

export { syncSonar };
