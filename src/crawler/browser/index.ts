import { chromium, type Browser, type Page } from "playwright";
import { logger } from "../../core/logger/index.js";

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
}

export class BrowserManager {
  private browser: Browser | null = null;

  async launch(options: BrowserOptions = {}): Promise<Browser> {
    if (!this.browser) {
      const headless = options.headless ?? true;
      logger.debug("BROWSER:LAUNCH", `Launching Chromium browser (headless=${headless})`);
      this.browser = await chromium.launch({
        headless,
      });
    }
    return this.browser;
  }

  async createPage(options: BrowserOptions = {}): Promise<Page> {
    const browser = await this.launch(options);
    logger.debug("BROWSER:PAGE", "Creating new browser context & page");
    const context = await browser.newContext();
    const page = await context.newPage();
    if (options.timeout) {
      page.setDefaultTimeout(options.timeout);
      logger.debug("BROWSER:TIMEOUT", `Default timeout set to ${options.timeout}ms`);
    }
    return page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      logger.debug("BROWSER:CLOSE", "Closing browser instance");
      await this.browser.close();
      this.browser = null;
    }
  }
}
