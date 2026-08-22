import { describe, it, expect } from "vitest";
import { PageObjectGenerator, generateBasePageContent } from "../../src/generators/page-object/index.js";
import type { UIElement } from "../../src/core/models/index.js";

describe("Enterprise Page Object Generator", () => {
  it("should generate BasePage abstract class template", () => {
    const basePage = generateBasePageContent();
    expect(basePage).toContain("export abstract class BasePage");
    expect(basePage).toContain("readonly pageTitle: Locator;");
    expect(basePage).toContain("readonly errorMessage: Locator;");
    expect(basePage).toContain("async navigate(");
    expect(basePage).toContain("async getErrorMessage(");
    expect(basePage).toContain("async getTitleText(");
  });

  it("should generate domain Page Object with synthesized login action method", () => {
    const generator = new PageObjectGenerator();
    const elements: UIElement[] = [
      {
        id: "user-name",
        tag: "input",
        name: "username",
        attributes: { "data-test": "username" },
        locators: [{ selector: '[data-test="username"]', strategy: "test-id", confidence: 0.99, isResilient: true }],
        pageUrl: "https://www.saucedemo.com/",
      },
      {
        id: "password",
        tag: "input",
        name: "password",
        attributes: { "data-test": "password" },
        locators: [{ selector: '[data-test="password"]', strategy: "test-id", confidence: 0.99, isResilient: true }],
        pageUrl: "https://www.saucedemo.com/",
      },
      {
        id: "login-button",
        tag: "input",
        name: "login-button",
        attributes: { "data-test": "login-button" },
        locators: [{ selector: '[data-test="login-button"]', strategy: "test-id", confidence: 0.99, isResilient: true }],
        pageUrl: "https://www.saucedemo.com/",
      },
    ];

    const po = generator.generateEnterprisePage("LoginPage", elements, { targetUrl: "https://www.saucedemo.com/" });

    expect(po).toContain("export class LoginPage extends BasePage");
    expect(po).toContain("readonly usernameInput: Locator;");
    expect(po).toContain("readonly passwordInput: Locator;");
    expect(po).toContain("readonly loginButton: Locator;");
    expect(po).toContain("async goto(url: string = 'https://www.saucedemo.com/')");
    expect(po).toContain("async login(username?: string, password?: string)");
    expect(po).toContain("await this.usernameInput.fill(username);");
    expect(po).toContain("await this.passwordInput.fill(password);");
    expect(po).toContain("await this.loginButton.click();");
  });
});
