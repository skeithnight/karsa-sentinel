import type { BDDFeature, BDDStep, AutomationAction } from "../../core/models/index.js";

export interface StepGeneratorOptions {
  pageFixtureName?: string; // e.g. "sauceDemoUserAuthenticationPage"
  targetUrl?: string;
  resolvedActions?: Map<string, AutomationAction[]>;
}

export class StepDefinitionGenerator {
  /**
   * Generate `src/steps/<feature>.steps.ts` using playwright-bdd's createBdd(test).
   */
  generateStepDefinitions(feature: BDDFeature, options: StepGeneratorOptions = {}): string {
    const fixtureName = options.pageFixtureName || "loginPage";
    const seenPatterns = new Set<string>();
    const stepBlocks: string[] = [];

    for (const scenario of feature.scenarios) {
      let currentKeyword: "Given" | "When" | "Then" = "Given";
      const scenarioActions = options.resolvedActions?.get(scenario.id) || [];

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const correspondingAction = scenarioActions[i];

        if (step.keyword === "Given" || step.keyword === "When" || step.keyword === "Then") {
          currentKeyword = step.keyword;
        }

        const generated = this.generateStepBlock(step, currentKeyword, fixtureName, options.targetUrl, correspondingAction);
        if (generated && !seenPatterns.has(generated.pattern)) {
          seenPatterns.add(generated.pattern);
          stepBlocks.push(generated.code);
        }
      }
    }

    return `import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures/base.fixture.js';
import { expect } from '@playwright/test';

const { Given, When, Then } = createBdd(test);

${stepBlocks.join("\n\n")}
`;
  }

  private generateStepBlock(
    step: BDDStep,
    inferredKeyword: "Given" | "When" | "Then",
    fixtureName: string,
    targetUrl?: string,
    action?: AutomationAction
  ): { pattern: string; code: string } | null {
    const text = step.text.trim();
    const keyword = inferredKeyword;
    const lower = text.toLowerCase();

    // 0. If ActionResolver determined this step is explicitly unresolved
    if (action?.type === "unresolved") {
      const pattern = this.parameterizePattern(text);
      const reason = action.resolution?.reasons?.join("; ") || "Could not resolve step against DOM evidence";
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }) => {
  // ❌ UNRESOLVED STEP: ${step.text}
  // Reason: ${reason}
  test.fail(true, 'Step could not be resolved against live DOM evidence: ${step.text}');
});`,
      };
    }

    // 1. Navigation: Given user navigates to {string}
    if (keyword === "Given" && (lower.includes("navigates to") || lower.includes("on the") || lower.includes("opens") || lower.includes("visits") || lower.includes("is on"))) {
      const pattern = this.parameterizePattern(text);
      if (pattern.includes("{string}")) {
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ ${fixtureName} }, url: string) => {
  await ${fixtureName}.goto(url);
});`,
        };
      }
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ ${fixtureName} }) => {
  await ${fixtureName}.goto('${targetUrl || "/"}');
});`,
      };
    }

    // 2. Multi-param Login: When user enters username {string} and password {string}
    if (lower.includes("login") || (lower.includes("username") && lower.includes("password"))) {
      const quoteCount = (text.match(/['"`][^'"`]+['"`]/g) || []).length;
      if (quoteCount >= 2) {
        const pattern = this.parameterizePattern(text);
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ ${fixtureName} }, username: string, password: string) => {
  const pageObj = ${fixtureName} as any;
  if (typeof pageObj.login === 'function') {
    await pageObj.login(username, password);
  }
});`,
        };
      }
    }

    // 3. Fill specific inputs
    if (lower.includes("enter") || lower.includes("type") || lower.includes("fill") || lower.includes("input")) {
      const pattern = this.parameterizePattern(text);
      if (pattern.includes("{string}")) {
        let fieldStatements: string[] = [];
        if (action?.target?.locator) {
          if (lower.includes("empty") || lower.includes("blank") || lower.includes("clear")) {
            fieldStatements.push(`await page.locator('${action.target.locator}').clear();`);
          } else {
            fieldStatements.push(`await page.locator('${action.target.locator}').fill(value);`);
          }
        } else {
          fieldStatements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
          fieldStatements.push(`test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${text}"');`);
        }

        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ page }, value: string) => {
  ${fieldStatements.join("\n  ")}
});`,
        };
      }
    }

    // 4. Click button: user clicks the Login button
    if (lower.includes("click") || lower.includes("press") || lower.includes("submit") || lower.includes("tap")) {
      const pattern = this.parameterizePattern(text);
      let statements = [];
      if (action?.target?.locator) {
        statements.push(`await page.locator('${action.target.locator}').click();`);
      } else {
        statements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
        statements.push(`test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${text}"');`);
      }
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }) => {
  ${statements.join("\n  ")}
});`,
      };
    }

    // 5. Assert URL: user is redirected to {string}
    if (lower.includes("redirect") || lower.includes("url") || lower.includes("navigated to")) {
      const pattern = this.parameterizePattern(text);
      if (pattern.includes("{string}")) {
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ page }, expectedPath: string) => {
  await expect(page).toHaveURL(new RegExp(expectedPath.replace(/\\//g, '\\\\/')));
});`,
        };
      }
      const urlMatch = text.match(/([/a-zA-Z0-9._-]+\.html?)/);
      const expectedPath = urlMatch ? urlMatch[1] : ".*";
      return {
        pattern: `${keyword}:${this.escapeCucumberSpecialChars(text)}`,
        code: `${keyword}('${this.escapeCucumberSpecialChars(text)}', async ({ page }) => {
  await expect(page).toHaveURL(/${expectedPath.replace(/\//g, "\\/")}/);
});`,
      };
    }

    // 6. Assert Header / Title Text
    if (lower.includes("header") || lower.includes("title")) {
      const pattern = this.parameterizePattern(text);
      if (pattern.includes("{string}")) {
        let statements = [];
        if (action?.target?.locator) {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toContainText(expectedMessage);`);
        } else {
          statements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
          statements.push(`test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${text}"');`);
        }
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ page }, expectedMessage: string) => {
  ${statements.join("\n  ")}
});`,
        };
      }
    }

    // 7. Assert Error Text
    if (lower.includes("error") || lower.includes("display") || lower.includes("show")) {
      const pattern = this.parameterizePattern(text);
      if (pattern.includes("{string}")) {
        let statements = [];
        if (action?.target?.locator) {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toContainText(expectedMessage);`);
        } else {
          statements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
          statements.push(`test.fail(true, 'Strict Resolution Policy: UI evidence missing for "${text}"');`);
        }
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ page }, expectedMessage: string) => {
  ${statements.join("\n  ")}
});`,
        };
      }
    }

    // 8. General Fallback
    const pattern = this.parameterizePattern(text);
    return {
      pattern: `${keyword}:${pattern}`,
      code: `${keyword}('${pattern}', async ({ ${fixtureName}, page }) => {
  await page.waitForLoadState('domcontentloaded');
});`,
    };
  }

  /**
   * Replaces quoted values with `{string}` for standard Cucumber Expression parameterization.
   */
  private parameterizePattern(text: string): string {
    let clean = text;
    // Replace unquoted URLs with {string}
    clean = clean.replace(/(?<!["'])(https?:\/\/[^\s`'"]+)(?!["'])/g, '{string}');
    // Replace quoted segments (including the quotes) with {string}
    clean = clean.replace(/`([^`]+)`/g, '{string}').replace(/"([^"]+)"/g, '{string}').replace(/'([^']+)'/g, '{string}');
    return this.escapeCucumberSpecialChars(clean);
  }

  private escapeCucumberSpecialChars(text: string): string {
    // In Cucumber Expressions, / outside of {string} needs escaping
    const parts = text.split('{string}');
    const escapedParts = parts.map((part) => part.replace(/\//g, "\\/"));
    return escapedParts.join('{string}');
  }
}
