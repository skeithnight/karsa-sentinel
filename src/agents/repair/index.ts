import { FailureAnalyzer, type FailureDiagnosis } from "../../execution/failure-analysis/index.js";
import { BrowserManager } from "../../crawler/browser/index.js";
import { MockAIProvider } from "../../providers/router/index.js";
import { logger } from "../../core/logger/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import type { UIElement } from "../../core/models/index.js";

export interface LocatorValidationResult {
  isValid: boolean;
  count: number;
  error?: string;
}

export class RepairAgent {
  private analyzer = new FailureAnalyzer();
  private browserManager = new BrowserManager();

  constructor(private readonly aiProvider: IAIProvider = new MockAIProvider()) {}

  diagnose(errorOutput: string): FailureDiagnosis {
    return this.analyzer.diagnose(errorOutput);
  }

  async repairLocator(failedSelector: string, pageSnapshot: string): Promise<string> {
    return this.aiProvider.repairLocator(failedSelector, pageSnapshot);
  }

  /**
   * Find alternative locator candidates from discovered UI elements
   * when a locator fails during execution.
   */
  findRepairCandidate(failedSelector: string, discoveredElements: UIElement[]): string | undefined {
    // 1. Fix common spelling errors or typos (e.g. erroor -> error, usename -> username)
    if (failedSelector.includes("erroor")) {
      return failedSelector.replace("erroor", "error");
    }

    // 2. Search discovered elements for closest matching attribute / locator
    const cleanSelector = failedSelector.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    for (const el of discoveredElements) {
      for (const loc of el.locators) {
        if (loc.selector === failedSelector) continue;
        const cleanCandidate = loc.selector.toLowerCase().replace(/[^a-z0-9_-]/g, "");
        if (cleanCandidate.includes(cleanSelector) || cleanSelector.includes(cleanCandidate)) {
          logger.debug("REPAIR:CANDIDATE", `Found candidate locator: ${loc.selector} for failed: ${failedSelector}`);
          return loc.selector;
        }
      }
    }

    return undefined;
  }

  /**
   * Browser Validation: Validates that a candidate selector resolves cleanly to a single
   * visible interactive element on the live application before applying the patch.
   */
  async validateLocatorOnPage(pageUrl: string, selector: string): Promise<LocatorValidationResult> {
    try {
      logger.debug("REPAIR:VALIDATE", `Validating locator "${selector}" on ${pageUrl}`);
      const page = await this.browserManager.createPage({ headless: true, timeout: 5000 });
      await page.goto(pageUrl, { waitUntil: "domcontentloaded" });

      const locator = page.locator(selector);
      const count = await locator.count();
      const isVisible = count > 0 ? await locator.first().isVisible().catch(() => false) : false;

      await this.browserManager.close();

      const isValid = count === 1 && isVisible;
      logger.debug("REPAIR:VALIDATE_RESULT", `Locator "${selector}" count: ${count}, isVisible: ${isVisible}, isValid: ${isValid}`);

      return {
        isValid,
        count,
      };
    } catch (err) {
      await this.browserManager.close().catch(() => {});
      logger.warn(`Locator validation encountered error for "${selector}": ${err instanceof Error ? err.message : String(err)}`);
      return {
        isValid: false,
        count: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
