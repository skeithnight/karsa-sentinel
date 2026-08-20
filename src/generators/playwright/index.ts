import type { BDDFeature } from "../../core/schemas/index.js";
import type { UIElement } from "../../core/models/index.js";

export class PlaywrightGenerator {
  generatePageObject(featureName: string, discoveredElements: UIElement[] = []): string {
    const cleanFeatureName = featureName.replace(/[^a-zA-Z0-9]/g, "");
    const className = cleanFeatureName.endsWith("Page") ? cleanFeatureName : `${cleanFeatureName}Page`;
    const locatorEntries: string[] = [];

    for (const el of discoveredElements) {
      const bestLocator = el.locators?.[0]?.selector;
      if (bestLocator) {
        let baseName = el.name || el.tag || "element";
        baseName = baseName.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
        let varName = baseName.charAt(0).toLowerCase() + baseName.slice(1);

        if (el.tag === "input" && !varName.toLowerCase().endsWith("input")) {
          varName += "Input";
        } else if (el.tag === "button" && !varName.toLowerCase().endsWith("button")) {
          varName += "Button";
        }

        locatorEntries.push(`  readonly ${varName} = this.page.locator('${bestLocator}');`);
      }
    }

    return `import { type Page, expect } from '@playwright/test';

export class ${className} {
  constructor(readonly page: Page) {}

${locatorEntries.join("\n")}

  async goto(url: string = '/') {
    await this.page.goto(url);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(username = 'standard_user', password = 'secret_sauce') {
    if (await this.page.locator('[data-test="username"]').count() > 0) {
      await this.page.fill('[data-test="username"]', username);
    }
    if (await this.page.locator('[data-test="password"]').count() > 0) {
      await this.page.fill('[data-test="password"]', password);
    }
    if (await this.page.locator('[data-test="login-button"]').count() > 0) {
      await this.page.click('[data-test="login-button"]');
    }
  }
}
`;
  }

  generatePlaywrightSpec(feature: BDDFeature, targetUrl?: string): string {
    const cleanUrl = targetUrl || "https://www.saucedemo.com/";
    const testCases = feature.scenarios
      .filter((s) => s.title.toLowerCase() !== "scenarios" && s.title.toLowerCase() !== "overview")
      .map((scenario) => {
        const stepActions: string[] = [];
        stepActions.push(`    // Navigate to target application`);
        stepActions.push(`    await page.goto('${cleanUrl}');`);
        stepActions.push(`    await page.waitForLoadState('domcontentloaded');`);

        const scenarioTitleLower = scenario.title.toLowerCase();

        // High-level scenario heuristic handlers
        if (scenarioTitleLower.includes("locked out")) {
          stepActions.push(`    // When user enters locked out credentials`);
          stepActions.push(`    await page.locator('[data-test="username"]').fill('locked_out_user');`);
          stepActions.push(`    await page.locator('[data-test="password"]').fill('secret_sauce');`);
          stepActions.push(`    await page.locator('[data-test="login-button"]').click();`);
          stepActions.push(`    // Then error banner is displayed`);
          stepActions.push(`    await expect(page.locator('[data-test="error"], .error-message-container').first()).toBeVisible();`);
          stepActions.push(`    await expect(page.locator('[data-test="error"], .error-message-container').first()).toContainText('locked out');`);
        } else if (scenarioTitleLower.includes("standard user") || scenarioTitleLower.includes("successful login")) {
          stepActions.push(`    // When user enters valid credentials`);
          stepActions.push(`    await page.locator('[data-test="username"]').fill('standard_user');`);
          stepActions.push(`    await page.locator('[data-test="password"]').fill('secret_sauce');`);
          stepActions.push(`    await page.locator('[data-test="login-button"]').click();`);
          stepActions.push(`    // Then user is redirected to inventory`);
          stepActions.push(`    await expect(page).toHaveURL(/.*inventory/);`);
        } else if (scenarioTitleLower.includes("missing username") || scenarioTitleLower.includes("empty username")) {
          stepActions.push(`    // When user enters password without username`);
          stepActions.push(`    await page.locator('[data-test="password"]').fill('secret_sauce');`);
          stepActions.push(`    await page.locator('[data-test="login-button"]').click();`);
          stepActions.push(`    // Then error message is displayed`);
          stepActions.push(`    await expect(page.locator('[data-test="error"], .error-message-container').first()).toBeVisible();`);
        } else if (scenarioTitleLower.includes("cart") || scenarioTitleLower.includes("backpack")) {
          stepActions.push(`    // Login and add item to cart`);
          stepActions.push(`    await page.locator('[data-test="username"]').fill('standard_user');`);
          stepActions.push(`    await page.locator('[data-test="password"]').fill('secret_sauce');`);
          stepActions.push(`    await page.locator('[data-test="login-button"]').click();`);
          stepActions.push(`    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();`);
          stepActions.push(`    await expect(page.locator('.shopping_cart_badge')).toHaveText('1');`);
        } else {
          // Fine-grained step parser
          for (const step of scenario.steps) {
            const text = step.text.toLowerCase();

            if (text.includes("enter") || text.includes("type") || text.includes("fill")) {
              if (text.includes("username") || text.includes("user")) {
                const usernameMatch = step.text.match(/['"`]([^'"`]+)['"`]/) || step.text.match(/username\s+(\w+)/i);
                const usernameVal = usernameMatch ? usernameMatch[1] : "standard_user";
                stepActions.push(`    // ${step.keyword} ${step.text}`);
                stepActions.push(`    await page.locator('[data-test="username"]').fill('${usernameVal}');`);
              } else if (text.includes("password")) {
                const passMatch = step.text.match(/['"`]([^'"`]+)['"`]/) || step.text.match(/password\s+(\w+)/i);
                const passVal = passMatch ? passMatch[1] : "secret_sauce";
                stepActions.push(`    // ${step.keyword} ${step.text}`);
                stepActions.push(`    await page.locator('[data-test="password"]').fill('${passVal}');`);
              }
            } else if (text.includes("click") || text.includes("press") || text.includes("submit") || text.includes("login button")) {
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              if (text.includes("login") || text.includes("sign in")) {
                stepActions.push(`    await page.locator('[data-test="login-button"]').click();`);
              } else if (text.includes("add to cart") || text.includes("backpack")) {
                stepActions.push(`    await page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();`);
              } else {
                stepActions.push(`    await page.locator('button, [type="submit"]').first().click();`);
              }
            } else if (text.includes("redirect") || text.includes("inventory") || text.includes("dashboard") || text.includes("url")) {
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              if (text.includes("inventory")) {
                stepActions.push(`    await expect(page).toHaveURL(/.*inventory/);`);
              } else {
                stepActions.push(`    await page.waitForLoadState('domcontentloaded');`);
              }
            } else if (text.includes("error") || text.includes("required") || text.includes("locked out") || text.includes("warning")) {
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              const errorMsgMatch = step.text.match(/['"`]([^'"`]+)['"`]/);
              const expectedMsg = errorMsgMatch ? errorMsgMatch[1] : "";
              stepActions.push(`    await expect(page.locator('[data-test="error"], .error-message-container').first()).toBeVisible();`);
              if (expectedMsg && expectedMsg.length > 3) {
                stepActions.push(`    await expect(page.locator('[data-test="error"], .error-message-container').first()).toContainText('${expectedMsg.replace(/'/g, "\\'")}');`);
              }
            } else {
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              stepActions.push(`    await page.waitForLoadState('domcontentloaded');`);
            }
          }
        }

        return `  test('${scenario.title.replace(/'/g, "\\'")}', async ({ page }) => {
${stepActions.join("\n")}
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
