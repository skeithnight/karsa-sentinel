import { describe, it, expect } from "vitest";
import { FixtureGenerator } from "../../src/generators/fixture/index.js";

describe("Enterprise Fixture Generator", () => {
  it("should generate base.fixture.ts with typed Page Object dependency injection", () => {
    const generator = new FixtureGenerator();
    const fixture = generator.generateBaseFixture([
      { className: "LoginPage", fileName: "login.page.ts", propName: "loginPage" },
      { className: "InventoryPage", fileName: "inventory.page.ts", propName: "inventoryPage" },
    ]);

    expect(fixture).toContain("import { test as baseTest } from 'playwright-bdd';");
    expect(fixture).toContain("import { LoginPage } from '../pages/login.page.js';");
    expect(fixture).toContain("import { InventoryPage } from '../pages/inventory.page.js';");
    expect(fixture).toContain("type Pages = {");
    expect(fixture).toContain("loginPage: LoginPage;");
    expect(fixture).toContain("inventoryPage: InventoryPage;");
    expect(fixture).toContain("export const test = baseTest.extend<Pages>({");
    expect(fixture).toContain("loginPage: async ({ page }, use) => {");
    expect(fixture).toContain("await use(new LoginPage(page));");
  });
});
