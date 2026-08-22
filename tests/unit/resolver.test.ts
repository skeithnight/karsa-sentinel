import { describe, it, expect } from "vitest";
import { ActionResolver } from "../../src/resolver/action/index.js";
import { PlaywrightGenerator } from "../../src/generators/playwright/index.js";
import { BDDGenerator } from "../../src/generators/bdd/index.js";
import type { UIElement, TestCase, BDDStep } from "../../src/core/models/index.js";

describe("ActionResolver & Evidence-Driven Generation", () => {
  const discoveredElements: UIElement[] = [
    {
      id: "user-name",
      tag: "input",
      name: "user-name",
      attributes: { "data-test": "username", placeholder: "Username" },
      locators: [
        { selector: '[data-test="username"]', strategy: "test-id", confidence: 0.99, isResilient: true },
        { selector: '[placeholder="Username"]', strategy: "placeholder", confidence: 0.88, isResilient: true },
      ],
      pageUrl: "https://www.saucedemo.com/",
    },
    {
      id: "password",
      tag: "input",
      name: "password",
      attributes: { "data-test": "password", placeholder: "Password" },
      locators: [
        { selector: '[data-test="password"]', strategy: "test-id", confidence: 0.99, isResilient: true },
      ],
      pageUrl: "https://www.saucedemo.com/",
    },
    {
      id: "login-button",
      tag: "input",
      name: "login-button",
      role: "button",
      attributes: { "data-test": "login-button", type: "submit", value: "Login" },
      locators: [
        { selector: '[data-test="login-button"]', strategy: "test-id", confidence: 0.99, isResilient: true },
      ],
      pageUrl: "https://www.saucedemo.com/",
    },
    {
      id: "error-container",
      tag: "h3",
      name: "error-message-container",
      attributes: { "data-test": "error", class: "error-message-container" },
      locators: [
        { selector: '[data-test="error"]', strategy: "test-id", confidence: 0.99, isResilient: true },
      ],
      pageUrl: "https://www.saucedemo.com/",
    },
  ];

  it("should resolve 'Given user navigates to URL' to a navigate action", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "Given", text: "user navigates to https://www.saucedemo.com/" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("navigate");
    expect(action.value).toBe("https://www.saucedemo.com/");
  });

  it("should match 'enters username `standard_user`' to [data-test=\"username\"] locator", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "When", text: "user enters username `standard_user`" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("fill");
    expect(action.target?.locator).toBe('[data-test="username"]');
    expect(action.value).toBe("standard_user");
  });

  it("should match 'clicks login button' to [data-test=\"login-button\"] locator", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "When", text: "user clicks the login button" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("click");
    expect(action.target?.locator).toBe('[data-test="login-button"]');
  });

  it("should match 'error is displayed' with error container locator", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "Then", text: "error banner 'Sorry, this user has been locked out' is displayed" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("assert_text");
    expect(action.target?.locator).toBe('[data-test="error"]');
    expect(action.expected).toBe("Sorry, this user has been locked out");
  });

  it("should generate evidence-driven Playwright spec from resolved actions", () => {
    const resolver = new ActionResolver();
    const pwGen = new PlaywrightGenerator();
    const bddGen = new BDDGenerator();

    const sampleTestCases: TestCase[] = [
      {
        id: "tc-1",
        requirementId: "req-1",
        title: "Standard Login",
        description: "Valid user logs in",
        preconditions: ["User navigates to https://www.saucedemo.com/"],
        steps: [
          {
            stepNumber: 1,
            action: "User enters username `standard_user`",
            expectedResult: "Username is filled",
          },
          {
            stepNumber: 2,
            action: "User enters password `secret_sauce`",
            expectedResult: "Password is filled",
          },
          {
            stepNumber: 3,
            action: "User clicks the login button",
            expectedResult: "User is redirected to /inventory.html",
          },
        ],
        priority: "high",
        tags: ["smoke"],
      },
    ];

    const feature = bddGen.generateFeatureFromTestCases("Auth Feature", sampleTestCases, "https://www.saucedemo.com/");
    const resolvedActions = new Map();
    for (const sc of feature.scenarios) {
      resolvedActions.set(sc.id, resolver.resolveScenario(sc.steps, discoveredElements, "https://www.saucedemo.com/"));
    }

    const spec = pwGen.generateSpec(feature, resolvedActions, "https://www.saucedemo.com/");

    expect(spec).toContain("await page.goto('https://www.saucedemo.com/')");
    expect(spec).toContain("await page.locator('[data-test=\"username\"]').fill('standard_user');");
    expect(spec).toContain("await page.locator('[data-test=\"password\"]').fill('secret_sauce');");
    expect(spec).toContain("await page.locator('[data-test=\"login-button\"]').click();");
  });

  it("should return status unresolved with 0 confidence when step cannot be mapped", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "When", text: "user teleports to mars" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("unresolved");
    expect(action.resolution?.status).toBe("unresolved");
    expect(action.resolution?.confidence).toBe(0);
  });

  it("should include high confidence rating on strong DOM matches", () => {
    const resolver = new ActionResolver();
    const step: BDDStep = { keyword: "When", text: "user enters username `admin`" };
    const action = resolver.resolve(step, discoveredElements);

    expect(action.type).toBe("fill");
    expect(action.resolution?.status).toBe("resolved");
    expect(action.resolution?.confidence).toBeGreaterThan(0.7);
  });
});
