import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { Logger } from './Logger.js';

export interface VisualComparisonOptions {
  mask?: Locator[];
  maxDiffPixelRatio?: number;
  maxDiffPixels?: number;
  fullPage?: boolean;
}

export class VisualComparator {
  private page: Page;
  private logger: Logger;

  constructor(page: Page) {
    this.page = page;
    this.logger = new Logger('VisualComparator');
  }

  /**
   * Compares the full page or viewport against a golden snapshot
   */
  public async comparePage(snapshotName: string, options?: VisualComparisonOptions): Promise<void> {
    const filename = `${snapshotName}.png`;
    this.logger.step(`Visual snapshot comparison: ${filename}`);

    await expect(this.page).toHaveScreenshot(filename, {
      fullPage: options?.fullPage ?? false,
      mask: options?.mask,
      maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.02,
      maxDiffPixels: options?.maxDiffPixels,
      animations: 'disabled',
    });
  }

  /**
   * Compares a specific component against a golden snapshot
   */
  public async compareElement(locator: Locator, snapshotName: string, options?: VisualComparisonOptions): Promise<void> {
    const filename = `${snapshotName}.png`;
    this.logger.step(`Element visual snapshot comparison: ${filename}`);

    await expect(locator).toHaveScreenshot(filename, {
      mask: options?.mask,
      maxDiffPixelRatio: options?.maxDiffPixelRatio ?? 0.02,
      maxDiffPixels: options?.maxDiffPixels,
      animations: 'disabled',
    });
  }
}
