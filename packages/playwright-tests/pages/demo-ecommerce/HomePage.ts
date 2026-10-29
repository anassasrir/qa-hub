import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../../src/core/BasePage.js';

export class HomePage extends BasePage {
  public readonly header: Locator;
  public readonly logo: Locator;
  public readonly loginButton: Locator;
  public readonly searchInput: Locator;
  public readonly cartIcon: Locator;

  constructor(page: Page, baseUrl = '') {
    super(page, baseUrl);
    this.header = page.locator('header, [role="banner"]');
    this.logo = page.locator('[data-testid="brand-logo"], a.navbar-brand');
    this.loginButton = page.getByRole('link', { name: /connexion|login|sign in/i });
    this.searchInput = page.getByPlaceholder(/rechercher|search/i);
    this.cartIcon = page.locator('[data-testid="cart-badge"], .cart-icon');
  }

  public async open(): Promise<void> {
    await this.goto('/');
  }

  public async goToLogin(): Promise<void> {
    await this.click(this.loginButton, 'Login Button');
  }

  public async searchProduct(query: string): Promise<void> {
    await this.fill(this.searchInput, query, 'Search Input');
    await this.searchInput.press('Enter');
  }
}
