import { describe, it, expect } from "vitest";
import { BDDGenerator } from "../../src/generators/bdd/index.js";
import { PlaywrightGenerator } from "../../src/generators/playwright/index.js";
import type { TestCase } from "../../src/core/models/index.js";

describe("Generators", () => {
  const sampleTestCases: TestCase[] = [
    {
      id: "tc-101",
      requirementId: "req-1",
      title: "User logs in with valid credentials",
      description: "Ensure authenticated access",
      preconditions: ["User is on the login page"],
      steps: [
        {
          stepNumber: 1,
          action: "User enters valid credentials and clicks submit",
          expectedResult: "User is redirected to the dashboard",
        },
      ],
      priority: "high",
      tags: ["smoke", "auth"],
    },
  ];

  it("should generate BDD feature and format readable Gherkin", () => {
    const bddGen = new BDDGenerator();
    const feature = bddGen.generateFeatureFromTestCases("User Authentication", sampleTestCases);
    expect(feature.title).toBe("User Authentication");
    expect(feature.scenarios.length).toBe(1);

    const gherkin = bddGen.formatGherkin(feature);
    expect(gherkin).toContain("Feature: User Authentication");
    expect(gherkin).toContain("Scenario: User logs in with valid credentials");
    expect(gherkin).toContain("Given User is on the login page");
    expect(gherkin).toContain("When User enters valid credentials and clicks submit");
    expect(gherkin).toContain("Then User is redirected to the dashboard");
  });

  it("should generate valid Playwright spec and Page Object files", () => {
    const pwGen = new PlaywrightGenerator();
    const bddGen = new BDDGenerator();
    const feature = bddGen.generateFeatureFromTestCases("User Authentication", sampleTestCases);

    const spec = pwGen.generatePlaywrightSpec(feature);
    expect(spec).toContain("test.describe('User Authentication'");
    expect(spec).toContain("test('User logs in with valid credentials'");

    const po = pwGen.generatePageObject("Login", {
      usernameInput: '[data-testid="username"]',
      submitButton: "role=button[name='Sign In']",
    });
    expect(po).toContain("export class LoginPage");
    expect(po).toContain("readonly usernameInput = this.page.locator('[data-testid=\"username\"]');");
  });
});
