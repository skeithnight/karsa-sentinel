import { describe, it, expect } from "vitest";
import { StepDefinitionGenerator } from "../../src/generators/steps/index.js";
import type { BDDFeature } from "../../src/core/models/index.js";

describe("StepDefinitionGenerator (playwright-bdd)", () => {
  const sampleFeature: BDDFeature = {
    id: "feat-1",
    title: "Authentication",
    tags: ["@automated"],
    scenarios: [
      {
        id: "sc-1",
        title: "Standard Login",
        tags: ["@smoke"],
        steps: [
          { keyword: "Given", text: "user navigates to `https://www.saucedemo.com/`" },
          { keyword: "When", text: "user enters username `standard_user` and password `secret_sauce`" },
          { keyword: "Then", text: "user is redirected to `/inventory.html`" },
        ],
      },
      {
        id: "sc-2",
        title: "Locked Out User",
        tags: ["@negative"],
        steps: [
          { keyword: "Given", text: "user navigates to `https://www.saucedemo.com/`" },
          { keyword: "When", text: "user enters username `locked_out_user` and password `secret_sauce`" },
          { keyword: "Then", text: "error message \"Epic sadface: Sorry, this user has been locked out.\" is displayed" },
        ],
      },
    ],
  };

  it("should generate parameterized playwright-bdd step definitions", () => {
    const generator = new StepDefinitionGenerator();
    const code = generator.generateStepDefinitions(sampleFeature, {
      pageFixtureName: "loginPage",
      targetUrl: "https://www.saucedemo.com/",
    });

    expect(code).toContain("import { createBdd } from 'playwright-bdd';");
    expect(code).toContain("import { test } from '../fixtures/base.fixture.js';");
    expect(code).toContain("const { Given, When, Then } = createBdd(test);");
    expect(code).toContain("Given('user navigates to {string}', async ({ loginPage }, url: string) => {");
    expect(code).toContain("When('user enters username {string} and password {string}', async ({ loginPage }, username: string, password: string) => {");
    expect(code).toContain("await pageObj.login(username, password);");
    expect(code).toContain("Then('user is redirected to {string}', async ({ page }, expectedPath: string) => {");
  });
});
