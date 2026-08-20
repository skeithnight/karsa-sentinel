import type { BDDFeature } from "../../core/models/index.js";

export class PlaywrightGenerator {
  generatePageObject(pageName: string, locators: Record<string, string>): string {
    const className = `${pageName.replace(/[^a-zA-Z0-9]/g, "")}Page`;
    const locatorEntries = Object.entries(locators)
      .map(([key, selector]) => `  readonly ${key} = this.page.locator('${selector}');`)
      .join("\n");

    return `import { type Page } from '@playwright/test';

export class ${className} {
  constructor(private readonly page: Page) {}

${locatorEntries}

  async goto(url: string = '/') {
    await this.page.goto(url);
  }
}
`;
  }

  generatePlaywrightSpec(feature: BDDFeature): string {
    const testCases = feature.scenarios
      .map((scenario) => {
        const stepComments = scenario.steps.map((s) => `    // ${s.keyword} ${s.text}`).join("\n");
        return `  test('${scenario.title.replace(/'/g, "\\'")}', async ({ page }) => {
${stepComments}
    // Automated assertion placeholder
    await page.waitForLoadState('domcontentloaded');
  });`;
      })
      .join("\n\n");

    return `import { test, expect } from '@playwright/test';

test.describe('${feature.title.replace(/'/g, "\\'")}', () => {
${testCases}
});
`;
  }
}
