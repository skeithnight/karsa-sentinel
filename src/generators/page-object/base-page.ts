/**
 * Generates the abstract BasePage class used by all domain Page Objects.
 */
export function generateBasePageContent(): string {
  return `import { type Page, type Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('[data-test="title"], .title, h1, .header_secondary_container');
    this.errorMessage = page.locator('[data-test="error"], .error-message-container, [role="alert"]');
  }

  async navigate(path: string = ''): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' });
  }

  async getErrorMessage(): Promise<string> {
    try {
      if (await this.errorMessage.first().isVisible()) {
        return (await this.errorMessage.first().innerText()).trim();
      }
    } catch {
      // ignore if not visible
    }
    return '';
  }

  async getTitleText(): Promise<string> {
    try {
      if (await this.pageTitle.first().isVisible()) {
        return (await this.pageTitle.first().innerText()).trim();
      }
    } catch {
      // ignore
    }
    return '';
  }
}
`;
}
