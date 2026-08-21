import type { BDDFeature, UIElement, AutomationAction } from "../../core/schemas/index.js";

/**
 * PlaywrightGenerator produces .spec.ts and Page Object files.
 *
 * In 0.3.0, spec generation is driven by AutomationAction[] (the IR),
 * NOT by hardcoded selector heuristics. This makes the generator
 * fully generic — it works for any web application, not just SauceDemo.
 */
export class PlaywrightGenerator {
  /**
   * Generate a Page Object class from discovered UI elements.
   */
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
}
`;
  }

  /**
   * Generate a complete .spec.ts from a BDDFeature + resolved actions per scenario.
   *
   * @param feature - The BDD feature model
   * @param resolvedActions - Map of scenario ID → AutomationAction[]
   * @param targetUrl - Fallback URL if not in actions
   */
  generateSpec(
    feature: BDDFeature,
    resolvedActions: Map<string, AutomationAction[]>,
    targetUrl?: string
  ): string {
    const testCases = feature.scenarios
      .filter((s) => s.title.toLowerCase() !== "scenarios" && s.title.toLowerCase() !== "overview")
      .map((scenario) => {
        const actions = resolvedActions.get(scenario.id) || [];
        const lines = this.actionsToPlaywright(actions, targetUrl);

        return `  test('${scenario.title.replace(/'/g, "\\'")}', async ({ page }) => {
${lines.join("\n")}
  });`;
      })
      .join("\n\n");

    return `import { test, expect } from '@playwright/test';

test.describe('${feature.title.replace(/'/g, "\\'")}', () => {
${testCases}
});
`;
  }

  /**
   * Convert a list of AutomationActions into Playwright code lines.
   * This is the core deterministic transformation — no heuristics, no hardcoding.
   */
  private actionsToPlaywright(actions: AutomationAction[], fallbackUrl?: string): string[] {
    const lines: string[] = [];
    let hasNavigated = false;

    for (const action of actions) {
      if (action.comment) {
        lines.push(`    // ${action.comment}`);
      }

      switch (action.type) {
        case "navigate": {
          const url = action.value || fallbackUrl || "/";
          lines.push(`    await page.goto('${url}');`);
          lines.push(`    await page.waitForLoadState('domcontentloaded');`);
          hasNavigated = true;
          break;
        }

        case "fill": {
          const locator = action.target?.locator;
          const value = action.value || "";
          if (locator) {
            lines.push(`    await page.locator('${locator}').fill('${value}');`);
          } else {
            const semantic = action.target?.semantic || "input";
            lines.push(`    // ❌ Strict Resolution Policy: UI evidence missing for "${semantic}"`);
            lines.push(`    test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${semantic}"');`);
          }
          break;
        }

        case "click": {
          const locator = action.target?.locator;
          if (locator) {
            lines.push(`    await page.locator('${locator}').click();`);
          } else {
            const semantic = action.target?.semantic || "button";
            lines.push(`    // ❌ Strict Resolution Policy: UI evidence missing for "${semantic}"`);
            lines.push(`    test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${semantic}"');`);
          }
          break;
        }

        case "select": {
          const locator = action.target?.locator;
          const value = action.value || "";
          if (locator) {
            lines.push(`    await page.locator('${locator}').selectOption('${value}');`);
          } else {
            const semantic = action.target?.semantic || "dropdown";
            lines.push(`    // ❌ Strict Resolution Policy: UI evidence missing for "${semantic}"`);
            lines.push(`    test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${semantic}"');`);
          }
          break;
        }

        case "assert_visible": {
          const locator = action.target?.locator;
          if (locator) {
            lines.push(`    await expect(page.locator('${locator}')).toBeVisible();`);
          } else {
            const semantic = action.target?.semantic || "element";
            lines.push(`    // ❌ Strict Resolution Policy: UI evidence missing for "${semantic}"`);
            lines.push(`    test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${semantic}"');`);
          }
          break;
        }

        case "assert_text": {
          const locator = action.target?.locator;
          const expected = action.expected || "";
          if (locator) {
            lines.push(`    await expect(page.locator('${locator}').first()).toContainText('${expected.replace(/'/g, "\\'")}');`);
          } else {
            const semantic = action.target?.semantic || "text";
            lines.push(`    // ❌ Strict Resolution Policy: UI evidence missing for "${semantic}"`);
            lines.push(`    test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${semantic}"');`);
          }
          break;
        }

        case "assert_url": {
          const expected = action.expected || ".*";
          lines.push(`    await expect(page).toHaveURL(/${expected.replace(/\//g, "\\/")}/);`);
          break;
        }

        case "wait": {
          lines.push(`    await page.waitForLoadState('domcontentloaded');`);
          break;
        }

        case "unresolved": {
          const reason = action.resolution?.reasons?.join("; ") || "No matching DOM evidence or semantic action found";
          lines.push(`    // ❌ UNRESOLVED STEP: ${action.comment || "Unknown"}`);
          lines.push(`    // Reason: ${reason}`);
          lines.push(`    test.fail(true, 'Step could not be resolved against live DOM evidence: ${this.escapeRegex(action.comment || "")}');`);
          break;
        }

        case "custom": {
          lines.push(`    // Custom action: ${action.value || "unspecified"}`);
          break;
        }
      }
    }

    // If no navigate was found, prepend a goto
    if (!hasNavigated && fallbackUrl) {
      lines.unshift(`    await page.waitForLoadState('domcontentloaded');`);
      lines.unshift(`    await page.goto('${fallbackUrl}');`);
      lines.unshift(`    // Navigate to target application`);
    }

    return lines;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // ── Legacy compatibility ──────────────────────────────────────────────
  // Kept for backward compatibility during migration. Remove in 0.4.0.
  generatePlaywrightSpec(feature: BDDFeature, targetUrl?: string): string {
    // Generate empty resolved actions — produces skeleton specs
    const resolvedActions = new Map<string, AutomationAction[]>();
    for (const scenario of feature.scenarios) {
      const actions: AutomationAction[] = [];
      for (const step of scenario.steps) {
        actions.push({
          type: "wait",
          comment: `${step.keyword} ${step.text}`,
        });
      }
      resolvedActions.set(scenario.id, actions);
    }
    return this.generateSpec(feature, resolvedActions, targetUrl);
  }
}
