import { test as base, createBdd } from 'playwright-bdd';
import { ConfigLoader } from '../src/core/config-loader.js';
import type { ProjectConfig, TargetEnvironment } from '../src/core/types.js';
import { Logger } from '../src/core/Logger.js';
import { VisualComparator } from '../src/core/VisualComparator.js';

export interface BddCustomFixtures {
  projectConfig: ProjectConfig;
  targetEnv: { name: string; env: TargetEnvironment };
  visual: VisualComparator;
  logger: Logger;
}

export const test = base.extend<BddCustomFixtures>({
  projectConfig: async ({}, use) => {
    const projectId = process.env.PROJECT_ID || 'demo-ecommerce';
    const config = ConfigLoader.getProject(projectId);
    await use(config);
  },

  targetEnv: async ({ projectConfig }, use) => {
    const envInfo = ConfigLoader.getTargetEnvironment(projectConfig);
    await use(envInfo);
  },

  visual: async ({ page }, use) => {
    const comparator = new VisualComparator(page);
    await use(comparator);
  },

  logger: async ({}, use, testInfo) => {
    const logger = new Logger(testInfo.title);
    await use(logger);
  },
});

export const { Given, When, Then, Step, Before, After } = createBdd(test);
