import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../../src/core/BasePage.js';

export class LoginPage extends BasePage {
  public readonly emailInput: Locator;
  public readonly passwordInput: Locator;
  public readonly submitButton: Locator;
  public readonly errorMessage: Locator;

  constructor(page: Page, baseUrl = '') {
    super(page, baseUrl);
    this.emailInput = page.getByRole('textbox', { name: /email|courriel/i }).or(page.locator('input[type="email"]'));
    this.passwordInput = page.getByLabel(/mot de passe|password/i).or(page.locator('input[type="password"]'));
    this.submitButton = page.getByRole('button', { name: /se connecter|log in|sign in/i });
    this.errorMessage = page.locator('[role="alert"], .alert-danger');
  }

  public async open(): Promise<void> {
    await this.goto('/login');
  }

  public async login(email: string, pass: string): Promise<void> {
    this.logger.step(`Attempting login for user: ${email}`);
    await this.fill(this.emailInput, email, 'Email Field');
    await this.fill(this.passwordInput, pass, 'Password Field');
    await this.click(this.submitButton, 'Submit Login Button');
  }
}
