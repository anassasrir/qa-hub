import { defineConfig, devices } from '@playwright/test';
import { ConfigLoader } from './src/core/config-loader.js';

// Load active projects dynamically from projects/*.json
const activeProjects = ConfigLoader.loadAllProjects();

// Generate unique timestamp for artifact folder
if (!process.env.RUN_TIMESTAMP) {
  process.env.RUN_TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');
}
const timestamp = process.env.RUN_TIMESTAMP;
const baseArtifactDir = `../../artifact/${timestamp}`;

// Generate Playwright projects dynamically based on projects/*.json
const playwrightProjects = activeProjects.flatMap((project) => {
  const defaultEnvName = process.env.TARGET_ENV || project.environments.default;
  const targetEnv = project.environments.targets[defaultEnvName] || { baseUrl: 'http://localhost:3000' };

  return [
    {
      name: `${project.id}-chromium`,
      testDir: project.playwright.testDir,
      metadata: {
        testProject: project.id,
        environment: defaultEnvName,
      },
      use: {
        ...devices['Desktop Chrome'],
        baseURL: targetEnv.baseUrl,
      },
    },
    {
      name: `${project.id}-mobile`,
      testDir: project.playwright.testDir,
      metadata: {
        testProject: project.id,
        environment: defaultEnvName,
      },
      use: {
        ...devices['Pixel 5'],
        baseURL: targetEnv.baseUrl,
      },
    },
  ];
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['list'],
    ['html', { outputFolder: `${baseArtifactDir}/playwright-report`, open: 'never' }],
    ['json', { outputFile: `${baseArtifactDir}/test-results/results.json` }],
    ['json', { outputFile: '../../apps/qa-dashboard/data/latest-results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: playwrightProjects.length > 0 ? playwrightProjects : [
    {
      name: 'default-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
