import type { Locator, Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';
import { Logger } from './Logger.js';

export abstract class BasePage {
  protected readonly page: Page;
  protected readonly logger: Logger;
  protected readonly baseUrl: string;

  constructor(page: Page, baseUrl = '') {
    this.page = page;
    this.baseUrl = baseUrl;
    this.logger = new Logger(this.constructor.name);
  }

  /**
   * Navigates to a path relative to the baseUrl or an absolute URL
   */
  public async goto(path = '', options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<Response | null> {
    const targetUrl = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    this.logger.step(`Navigating to ${targetUrl}`);
    return this.page.goto(targetUrl, {
      waitUntil: options?.waitUntil ?? 'domcontentloaded',
    });
  }

  /**
   * Safe click with auto-scroll and visibility wait
   */
  public async click(locator: Locator, description?: string): Promise<void> {
    const desc = description ?? locator.toString();
    this.logger.debug(`Clicking on: ${desc}`);
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
    await locator.click();
  }

  /**
   * Safe input fill with clearing and verification
   */
  public async fill(locator: Locator, value: string, description?: string): Promise<void> {
    const desc = description ?? locator.toString();
    this.logger.debug(`Filling '${desc}'`);
    await locator.scrollIntoViewIfNeeded();
    await expect(locator).toBeVisible();
    await locator.fill(value);
  }

  /**
   * Waits for element to be visible
   */
  public async waitForVisible(locator: Locator, timeout = 10000): Promise<void> {
    await expect(locator).toBeVisible({ timeout });
  }

  /**
   * Checks if element is visible without throwing assertion failure
   */
  public async isVisible(locator: Locator): Promise<boolean> {
    try {
      return await locator.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Returns current page title
   */
  public async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Returns current page URL
   */
  public getUrl(): string {
    return this.page.url();
  }

  /**
   * Captures full page screenshot
   */
  public async takeScreenshot(name: string): Promise<Buffer> {
    this.logger.debug(`Taking screenshot: ${name}`);
    return this.page.screenshot({
      fullPage: true,
      path: `artifact/screenshots/${name}.png`,
    });
  }
}
