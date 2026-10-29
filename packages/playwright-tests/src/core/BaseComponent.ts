import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Logger } from './Logger.js';

export abstract class BaseComponent {
  protected readonly root: Locator;
  protected readonly page: Page;
  protected readonly logger: Logger;

  constructor(root: Locator, page: Page) {
    this.root = root;
    this.page = page;
    this.logger = new Logger(this.constructor.name);
  }

  public async isDisplayed(): Promise<boolean> {
    try {
      return await this.root.isVisible();
    } catch {
      return false;
    }
  }

  public async waitForDisplayed(timeout = 5000): Promise<void> {
    await expect(this.root).toBeVisible({ timeout });
  }

  public async waitForHidden(timeout = 5000): Promise<void> {
    await expect(this.root).toBeHidden({ timeout });
  }
}
