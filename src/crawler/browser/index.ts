import { chromium, type Browser, type Page } from "playwright";

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
}

export class BrowserManager {
  private browser: Browser | null = null;

  async launch(options: BrowserOptions = {}): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: options.headless ?? true,
      });
    }
    return this.browser;
  }

  async createPage(options: BrowserOptions = {}): Promise<Page> {
    const browser = await this.launch(options);
    const context = await browser.newContext();
    const page = await context.newPage();
    if (options.timeout) {
      page.setDefaultTimeout(options.timeout);
    }
    return page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
