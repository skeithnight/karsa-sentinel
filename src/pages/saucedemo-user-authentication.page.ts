import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

export class SauceDemoUserAuthenticationPage extends BasePage {
  readonly loginContainer: Locator;
  readonly userNameInput: Locator;
  readonly passwordInput: Locator;
  readonly div: Locator;
  readonly loginButton: Locator;
  readonly loginCredentialsContainer: Locator;
  readonly loginCredentials: Locator;
  readonly loginPassword: Locator;

  constructor(page: Page) {
    super(page);
    this.loginContainer = page.locator('[data-test="login-container"]');
    this.userNameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.div = page.locator('.error-message-container');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.loginCredentialsContainer = page.locator('[data-test="login-credentials-container"]');
    this.loginCredentials = page.locator('[data-test="login-credentials"]');
    this.loginPassword = page.locator('[data-test="login-password"]');
  }

  async goto(url: string = 'https://www.saucedemo.com/'): Promise<void> {
    await this.navigate(url);
  }

  async login(username?: string, password?: string): Promise<void> {
    if (username !== undefined && username !== '') {
      await this.userNameInput.fill(username);
    } else if (username === '') {
      await this.userNameInput.clear();
    }

    if (password !== undefined && password !== '') {
      await this.passwordInput.fill(password);
    } else if (password === '') {
      await this.passwordInput.clear();
    }

    await this.loginButton.click();
  }

  async isLoaded(): Promise<boolean> {
    return await this.loginButton.isVisible();
  }
}
