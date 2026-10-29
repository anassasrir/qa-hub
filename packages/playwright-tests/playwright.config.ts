import { defineConfig, devices } from '@playwright/test';
import { ConfigLoader } from './src/core/config-loader.js';

// Load active projects dynamically from projects/*.json
const activeProjects = ConfigLoader.loadAllProjects();

// Generate Playwright projects dynamically based on projects/*.json
const playwrightProjects = activeProjects.flatMap((project) => {
  const defaultEnvName = process.env.TARGET_ENV || project.environments.default;
  const targetEnv = project.environments.targets[defaultEnvName] || { baseUrl: 'http://localhost:3000' };

  return [
    {
      name: `${project.id}-chromium`,
      testDir: project.playwright.testDir,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: targetEnv.baseUrl,
      },
    },
    {
      name: `${project.id}-mobile`,
      testDir: project.playwright.testDir,
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
    ['html', { outputFolder: '../../playwright-report', open: 'never' }],
    ['json', { outputFile: '../../artifact/reports/playwright-results.json' }],
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
