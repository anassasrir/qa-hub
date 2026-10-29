import { test as baseTest, expect } from '@playwright/test';
import { ConfigLoader } from '../core/config-loader.js';
import type { ProjectConfig, TargetEnvironment } from '../core/types.js';
import { Logger } from '../core/Logger.js';
import { VisualComparator } from '../core/VisualComparator.js';

export interface ExtendedFixtures {
  projectConfig: ProjectConfig;
  targetEnv: { name: string; env: TargetEnvironment };
  visual: VisualComparator;
  logger: Logger;
}

export const test = baseTest.extend<ExtendedFixtures>({
  // Automatically resolves project configuration based on PROJECT_ID env or default
  projectConfig: async ({}, use) => {
    const projectId = process.env.PROJECT_ID || 'demo-ecommerce';
    const config = ConfigLoader.getProject(projectId);
    await use(config);
  },

  // Automatically resolves target environment and base URLs
  targetEnv: async ({ projectConfig }, use) => {
    const envInfo = ConfigLoader.getTargetEnvironment(projectConfig);
    await use(envInfo);
  },

  // Provides visual comparator helper
  visual: async ({ page }, use) => {
    const comparator = new VisualComparator(page);
    await use(comparator);
  },

  // Contextual logger for tests
  logger: async ({}, use, testInfo) => {
    const logger = new Logger(testInfo.title);
    await use(logger);
  },
});

export { expect };
