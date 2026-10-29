import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { ConfigLoader } from './src/core/config-loader.js';

// Resolve active project
const activeProjects = ConfigLoader.loadAllProjects();
const defaultProjectId = activeProjects[0]?.id || 'demo-ecommerce';
const selectedProjectId = process.env.PROJECT_ID || defaultProjectId;
const projectConfig = ConfigLoader.getProject(selectedProjectId);

// Generate unique timestamp for artifact folder
if (!process.env.RUN_TIMESTAMP) {
  process.env.RUN_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
}
const timestamp = process.env.RUN_TIMESTAMP;
const baseArtifactDir = `../../artifact/${timestamp}`;

// Resolve target environment
const targetEnvName = process.env.TARGET_ENV || projectConfig.environments.default;
const targetEnv = projectConfig.environments.targets[targetEnvName] || { baseUrl: 'http://localhost:3000' };

// Dynamic BDD Configuration
const testDir = defineBddConfig({
  features: process.env.BDD_FEATURES || `specs/${selectedProjectId}/**/*.feature`,
  steps: [
    `steps/${selectedProjectId}/**/*.steps.ts`,
    `steps/*.steps.ts`,
    `steps/bdd.ts`,
  ],
  outputDir: `.features-gen/${selectedProjectId}`,
});

export default defineConfig({
  testDir,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  metadata: {
    testProject: selectedProjectId,
    environment: targetEnvName,
    runTimestamp: timestamp,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: `${baseArtifactDir}/playwright-report`, open: 'never' }],
    ['json', { outputFile: `${baseArtifactDir}/test-results/results.json` }],
    ['json', { outputFile: '../../apps/qa-dashboard/data/latest-results.json' }],
  ],
  use: {
    baseURL: targetEnv.baseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: `${selectedProjectId}-chromium`,
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: `${selectedProjectId}-mobile`,
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
});
