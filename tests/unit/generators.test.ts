import { describe, it, expect } from "vitest";
import { BDDGenerator } from "../../src/generators/bdd/index.js";
import { PlaywrightGenerator } from "../../src/generators/playwright/index.js";
import { LocatorGenerator } from "../../src/crawler/locators/index.js";
import type { TestCase, UIElement } from "../../src/core/models/index.js";

describe("Generators & Locators", () => {
  const sampleTestCases: TestCase[] = [
    {
      id: "tc-101",
      requirementId: "req-1",
      title: "Standard User Login Success",
      description: "Ensure authenticated access",
      preconditions: ["User is on the login page"],
      steps: [
        {
          stepNumber: 1,
          action: "User enters username 'standard_user' and password 'secret_sauce'",
          expectedResult: "User is redirected to inventory page",
        },
      ],
      priority: "high",
      tags: ["smoke", "auth"],
    },
    {
      id: "tc-102",
      requirementId: "req-1",
      title: "Locked Out User Error Banner",
      description: "Ensure error feedback displays",
      preconditions: ["User is on the login page"],
      steps: [
        {
          stepNumber: 1,
          action: "User enters username 'locked_out_user' and clicks submit",
          expectedResult: "Error banner 'Sorry, this user has been locked out' is displayed",
        },
      ],
      priority: "critical",
      tags: ["negative", "auth"],
    },
  ];

  it("should generate multi-scenario BDD feature", () => {
    const bddGen = new BDDGenerator();
    const feature = bddGen.generateFeatureFromTestCases("SauceDemo Authentication Matrix", sampleTestCases);
    expect(feature.scenarios.length).toBe(2);

    const gherkin = bddGen.formatGherkin(feature);
    expect(gherkin).toContain("Scenario: Standard User Login Success");
    expect(gherkin).toContain("Scenario: Locked Out User Error Banner");
  });

  it("should generate granular Playwright specs with distinct test blocks", () => {
    const pwGen = new PlaywrightGenerator();
    const bddGen = new BDDGenerator();
    const feature = bddGen.generateFeatureFromTestCases("SauceDemo Authentication Matrix", sampleTestCases);

    const spec = pwGen.generatePlaywrightSpec(feature, "https://www.saucedemo.com/");
    expect(spec).toContain("test('Standard User Login Success'");
    expect(spec).toContain("test('Locked Out User Error Banner'");
    expect(spec).toContain("await page.goto('https://www.saucedemo.com/')");
  });

  it("should rank data-test selectors with highest confidence", () => {
    const locGen = new LocatorGenerator();
    const candidates = locGen.generateCandidates({
      tag: "input",
      id: "user-name",
      name: "user-name",
      dataTest: "username",
      placeholder: "Username",
    });

    expect(candidates[0]?.selector).toBe('[data-test="username"]');
    expect(candidates[0]?.confidence).toBeGreaterThanOrEqual(0.98);
  });

  it("should generate Page Objects with typed methods from discovered UI elements", () => {
    const pwGen = new PlaywrightGenerator();
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
        id: "login-button",
        tag: "button",
        name: "login-button",
        attributes: { "data-test": "login-button" },
        locators: [{ selector: '[data-test="login-button"]', strategy: "test-id", confidence: 0.99, isResilient: true }],
        pageUrl: "https://www.saucedemo.com/",
      },
    ];

    const po = pwGen.generatePageObject("LoginPage", elements);
    expect(po).toContain("export class LoginPage");
    expect(po).toContain("readonly usernameInput = this.page.locator('[data-test=\"username\"]');");
    expect(po).toContain("readonly loginButton = this.page.locator('[data-test=\"login-button\"]');");
  });
});
