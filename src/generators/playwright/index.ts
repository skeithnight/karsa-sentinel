import type { BDDFeature, UIElement } from "../../core/models/index.js";

export class PlaywrightGenerator {
  generatePageObject(pageName: string, elements: UIElement[]): string {
    const className = `${pageName.replace(/[^a-zA-Z0-9]/g, "")}Page`;
    const locatorEntries: string[] = [];

    const seenKeys = new Set<string>();

    for (const el of elements) {
      const bestLocator = el.locators[0]?.selector;
      if (!bestLocator) continue;

      let varName = el.name || el.attributes["data-test"] || el.attributes["placeholder"] || el.id || "element";
      varName = varName
        .replace(/[^a-zA-Z0-9]/g, " ")
        .trim()
        .split(/\s+/)
        .map((w, i) => (i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
        .join("");

      if (el.tag === "button" && !varName.toLowerCase().includes("button") && !varName.toLowerCase().includes("btn")) {
        varName += "Button";
      } else if (el.tag === "input" && !varName.toLowerCase().includes("input") && !varName.toLowerCase().includes("field")) {
        varName += "Input";
      }

      if (!seenKeys.has(varName) && varName.length > 1) {
        seenKeys.add(varName);
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

        for (const step of scenario.steps) {
          const text = step.text.toLowerCase();

          if (text.includes("enter") || text.includes("type") || text.includes("fill")) {
            if (text.includes("username") || text.includes("user")) {
              const usernameMatch = step.text.match(/['"`]([^'"`]+)['"`]/) || step.text.match(/username\s+(\w+)/i);
              const usernameVal = usernameMatch ? usernameMatch[1] : "standard_user";
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              stepActions.push(`    if (await page.locator('[data-test="username"]').count() > 0) {`);
              stepActions.push(`      await page.fill('[data-test="username"]', '${usernameVal}');`);
              stepActions.push(`    }`);
            } else if (text.includes("password")) {
              const passMatch = step.text.match(/['"`]([^'"`]+)['"`]/) || step.text.match(/password\s+(\w+)/i);
              const passVal = passMatch ? passMatch[1] : "secret_sauce";
              stepActions.push(`    // ${step.keyword} ${step.text}`);
              stepActions.push(`    if (await page.locator('[data-test="password"]').count() > 0) {`);
              stepActions.push(`      await page.fill('[data-test="password"]', '${passVal}');`);
              stepActions.push(`    }`);
            }
          } else if (text.includes("click") || text.includes("press") || text.includes("submit") || text.includes("login button")) {
            stepActions.push(`    // ${step.keyword} ${step.text}`);
            if (text.includes("login") || text.includes("sign in")) {
              stepActions.push(`    await page.click('[data-test="login-button"]');`);
            } else if (text.includes("add to cart") || text.includes("backpack")) {
              stepActions.push(`    await page.click('[data-test="add-to-cart-sauce-labs-backpack"]');`);
            } else {
              stepActions.push(`    const submitBtn = page.locator('button, [type="submit"], [data-test*="button"]').first();`);
              stepActions.push(`    if (await submitBtn.isVisible()) await submitBtn.click();`);
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
            stepActions.push(`    await expect(page.locator('[data-test="error"], [class*="error"]').first()).toBeVisible();`);
            if (expectedMsg && expectedMsg.length > 3) {
              stepActions.push(`    await expect(page.locator('[data-test="error"], [class*="error"]').first()).toContainText('${expectedMsg.replace(/'/g, "\\'")}');`);
            }
          } else if (text.includes("cart badge") || text.includes("badge") || text.includes("count")) {
            stepActions.push(`    // ${step.keyword} ${step.text}`);
            stepActions.push(`    await expect(page.locator('.shopping_cart_badge')).toBeVisible();`);
          } else {
            stepActions.push(`    // ${step.keyword} ${step.text}`);
            stepActions.push(`    await page.waitForLoadState('domcontentloaded');`);
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
