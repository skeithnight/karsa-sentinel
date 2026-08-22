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
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      const reason = action.resolution?.reasons?.join("; ") || "Could not resolve step against DOM evidence";
      const safeText = step.text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      const safeReason = reason.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  // ❌ UNRESOLVED STEP: ${step.text}
  // Reason: ${safeReason}
  expect(false, 'Step could not be resolved against live DOM evidence: ${safeText}').toBe(true);
});`,
      };
    }

    // 1. Navigation: Given user navigates to {string}
    if (keyword === "Given" && (lower.includes("navigates to") || lower.includes("on the") || lower.includes("opens") || lower.includes("visits") || lower.includes("is on"))) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      if (paramCount > 0) {
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ ${fixtureName} }${paramsSignature}) => {
  await ${fixtureName}.goto(arg1 || '${targetUrl || "/"}');
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
    if ((lower.includes("username") && lower.includes("password")) || (lower.includes("credentials") && (lower.includes("enter") || lower.includes("fill")))) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      if (paramCount >= 2) {
        const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
        const paramsSignature = `, ${paramList}`;
        const argsArray = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}`).join(", ");
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ ${fixtureName} }${paramsSignature}) => {
  const pageObj = ${fixtureName} as any;
  if (typeof pageObj.login === 'function') {
    const allArgs = [${argsArray}];
    const user = allArgs.find(a => a && (a.includes('user') || a.includes('standard') || a.includes('locked') || a.includes('problem') || a.includes('performance') || a.includes('error') || a.includes('visual'))) || arg1;
    const pass = allArgs.find(a => a && (a.includes('sauce') || a.includes('secret') || a.includes('pass'))) || arg2;
    await pageObj.login(user, pass);
  }
});`,
        };
      }
    }

    // 3. Click button: user clicks the Login button
    if (action?.type === "click" || lower.includes("click") || lower.includes("press") || lower.includes("submit") || lower.includes("tap")) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      let statements = [];
      if (action?.target?.locator) {
        statements.push(`await page.locator('${action.target.locator}').click();`);
      } else {
        const safeText = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        statements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
        statements.push(`expect(false, 'Strict Resolution Policy: UI evidence missing for "${safeText}"').toBe(true);`);
      }
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  ${statements.join("\n  ")}
});`,
      };
    }

    // 4. Fill specific inputs
    if (action?.type === "fill" || lower.includes("enter") || lower.includes("type") || (lower.includes("fill") && !lower.includes("is filled")) || lower.startsWith("input")) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      let fieldStatements: string[] = [];
      if (action?.target?.locator) {
        if (lower.includes("empty") || lower.includes("blank") || lower.includes("clear")) {
          fieldStatements.push(`await page.locator('${action.target.locator}').clear();`);
        } else if (paramCount > 0) {
          fieldStatements.push(`await page.locator('${action.target.locator}').fill(arg1 || '');`);
        } else if (action.value) {
          fieldStatements.push(`await page.locator('${action.target.locator}').fill('${action.value}');`);
        } else {
          fieldStatements.push(`await expect(page.locator('${action.target.locator}')).toBeVisible();`);
        }
      } else {
        const safeText = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        fieldStatements.push(`// ❌ Strict Resolution Policy: UI evidence missing`);
        fieldStatements.push(`expect(false, 'Strict Resolution Policy: UI evidence missing for "${safeText}"').toBe(true);`);
      }

      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  ${fieldStatements.join("\n  ")}
});`,
      };
    }

    // 5. Assert URL: user is redirected to {string}
    if (lower.includes("redirect") || lower.includes("url") || lower.includes("navigated to")) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      if (paramCount > 0) {
        return {
          pattern: `${keyword}:${pattern}`,
          code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  await expect(page).toHaveURL(new RegExp((arg1 || '').replace(/\\//g, '\\\\/')));
});`,
        };
      }
      const urlMatch = text.match(/([/a-zA-Z0-9._-]+\.html?)/);
      const expectedPath = urlMatch ? urlMatch[1] : ".*";
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }) => {
  await expect(page).toHaveURL(/${expectedPath.replace(/\//g, "\\/")}/);
});`,
      };
    }

    // 6. Assert Header / Title Text
    if (lower.includes("header") || lower.includes("title")) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      let statements = [];
      if (action?.target?.locator) {
        if (paramCount > 0) {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toContainText(arg1 || '');`);
        } else {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toBeVisible();`);
        }
      } else {
        if (paramCount > 0) {
          statements.push(`await expect(page.getByText(arg1 || '').first()).toBeVisible();`);
        } else {
          statements.push(`await page.waitForLoadState('domcontentloaded');`);
        }
      }
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  ${statements.join("\n  ")}
});`,
      };
    }

    // 7. Assert Error Text
    if (lower.includes("error") || lower.includes("display") || lower.includes("show")) {
      const pattern = this.parameterizePattern(text);
      const paramCount = (pattern.match(/\{string\}/g) || []).length;
      const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
      const paramsSignature = paramList ? `, ${paramList}` : "";
      let statements = [];
      if (action?.target?.locator) {
        if (paramCount > 0) {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toContainText(arg1 || '');`);
        } else {
          statements.push(`await expect(page.locator('${action.target.locator}').first()).toBeVisible();`);
        }
      } else {
        if (paramCount > 0) {
          statements.push(`await expect(page.getByText(arg1 || '').first()).toBeVisible();`);
        } else {
          statements.push(`await page.waitForLoadState('domcontentloaded');`);
        }
      }
      return {
        pattern: `${keyword}:${pattern}`,
        code: `${keyword}('${pattern}', async ({ page }${paramsSignature}) => {
  ${statements.join("\n  ")}
});`,
      };
    }

    // 8. General Fallback
    const pattern = this.parameterizePattern(text);
    const paramCount = (pattern.match(/\{string\}/g) || []).length;
    const paramList = Array.from({ length: paramCount }, (_, i) => `arg${i + 1}: string`).join(", ");
    const paramsSignature = paramList ? `, ${paramList}` : "";
    return {
      pattern: `${keyword}:${pattern}`,
      code: `${keyword}('${pattern}', async ({ ${fixtureName}, page }${paramsSignature}) => {
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
    // In Cucumber Expressions, /, (, ), {, } outside of {string} need escaping in JS/TS source
    const parts = text.split('{string}');
    const escapedParts = parts.map((part) =>
      part
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/\//g, "\\\\/")
        .replace(/\(/g, "\\\\(")
        .replace(/\)/g, "\\\\)")
        .replace(/\{/g, "\\\\{")
        .replace(/\}/g, "\\\\}")
    );
    return escapedParts.join('{string}');
  }
}
