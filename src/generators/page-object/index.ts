import type { UIElement } from "../../core/models/index.js";
export { generateBasePageContent } from "./base-page.js";

export interface PageObjectOptions {
  targetUrl?: string;
  isEnterprise?: boolean;
}

export class PageObjectGenerator {
  /**
   * Generate an enterprise Page Object extending BasePage with typed locators and action methods.
   */
  generateEnterprisePage(featureName: string, elements: UIElement[] = [], options: PageObjectOptions = {}): string {
    const cleanName = featureName.replace(/[^a-zA-Z0-9]/g, "");
    const className = cleanName.endsWith("Page") ? cleanName : `${cleanName}Page`;

    const locatorDeclarations: string[] = [];
    const locatorInitializations: string[] = [];
    const actionMethods: string[] = [];

    // Categorize elements
    const inputs: Array<{ propName: string; selector: string; rawName?: string }> = [];
    const buttons: Array<{ propName: string; selector: string; rawName?: string }> = [];

    for (const el of elements) {
      const bestLocator = el.locators?.[0]?.selector;
      if (!bestLocator) continue;

      let baseName = el.name || el.tag || "element";
      baseName = baseName.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase()).replace(/[^a-zA-Z0-9]/g, "");
      let varName = baseName.charAt(0).toLowerCase() + baseName.slice(1);

      const isButton =
        el.tag === "button" ||
        el.role === "button" ||
        el.attributes["type"] === "submit" ||
        (el.name && (el.name.toLowerCase().includes("button") || el.name.toLowerCase().includes("btn") || el.name.toLowerCase().includes("submit")));

      if (isButton) {
        if (!varName.toLowerCase().endsWith("button") && !varName.toLowerCase().endsWith("btn")) varName += "Button";
        buttons.push({ propName: varName, selector: bestLocator, rawName: el.name });
      } else if (el.tag === "input" || el.tag === "textarea") {
        if (!varName.toLowerCase().endsWith("input")) varName += "Input";
        inputs.push({ propName: varName, selector: bestLocator, rawName: el.name });
      }

      locatorDeclarations.push(`  readonly ${varName}: Locator;`);
      locatorInitializations.push(`    this.${varName} = page.locator('${bestLocator}');`);
    }

    // Synthesize action methods
    const targetUrl = options.targetUrl || "/";
    actionMethods.push(`  async goto(url: string = '${targetUrl}'): Promise<void> {
    await this.navigate(url);
  }`);

    // If username and password inputs exist + submit button -> synthesize login()
    const usernameInput = inputs.find((i) => (i.rawName || i.propName).toLowerCase().includes("user") || (i.rawName || i.propName).toLowerCase().includes("email"));
    const passwordInput = inputs.find((i) => (i.rawName || i.propName).toLowerCase().includes("pass"));
    const submitBtn = buttons.find((b) => (b.rawName || b.propName).toLowerCase().includes("login") || (b.rawName || b.propName).toLowerCase().includes("submit")) || buttons[0];

    if (usernameInput && passwordInput && submitBtn) {
      actionMethods.push(`  async login(username?: string, password?: string): Promise<void> {
    if (username !== undefined && username !== '') {
      await this.${usernameInput.propName}.fill(username);
    } else if (username === '') {
      await this.${usernameInput.propName}.clear();
    }

    if (password !== undefined && password !== '') {
      await this.${passwordInput.propName}.fill(password);
    } else if (password === '') {
      await this.${passwordInput.propName}.clear();
    }

    await this.${submitBtn.propName}.click();
  }`);
    }

    // General form submission helper if inputs exist
    if (inputs.length > 0 && submitBtn && !actionMethods.some((m) => m.includes("async login("))) {
      actionMethods.push(`  async submitForm(data: Record<string, string> = {}): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      const field = (this as Record<string, unknown>)[key] || (this as Record<string, unknown>)[key + 'Input'];
      if (field && typeof (field as { fill?: unknown }).fill === 'function') {
        await (field as { fill: (v: string) => Promise<void> }).fill(value);
      }
    }
    await this.${submitBtn.propName}.click();
  }`);
    }

    if (submitBtn) {
      actionMethods.push(`  async isLoaded(): Promise<boolean> {
    return await this.${submitBtn.propName}.isVisible();
  }`);
    }

    return `import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './base.page.js';

export class ${className} extends BasePage {
${locatorDeclarations.join("\n")}

  constructor(page: Page) {
    super(page);
${locatorInitializations.join("\n")}
  }

${actionMethods.join("\n\n")}
}
`;
  }
}
