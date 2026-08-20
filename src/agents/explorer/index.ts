import { BrowserManager } from "../../crawler/browser/index.js";
import { PageExplorer } from "../../crawler/discovery/index.js";
import type { UIElement } from "../../core/models/index.js";

export class ExplorerAgent {
  private browserManager = new BrowserManager();
  private explorer = new PageExplorer();

  async exploreUrl(url: string): Promise<UIElement[]> {
    try {
      const page = await this.browserManager.createPage();
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const elements = await this.explorer.explorePage(page);
      return elements;
    } finally {
      await this.browserManager.close();
    }
  }
}
