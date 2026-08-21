export interface PageFixtureInfo {
  className: string;
  fileName: string;
  propName: string;
}

export class FixtureGenerator {
  /**
   * Generate `src/fixtures/base.fixture.ts` registering all Page Objects as Playwright fixtures.
   */
  generateBaseFixture(pages: PageFixtureInfo[]): string {
    const importLines = pages.map(
      (p) => `import { ${p.className} } from '../pages/${p.fileName.replace(/\.ts$/, "")}.js';`
    );

    const typeEntries = pages.map((p) => `  ${p.propName}: ${p.className};`);

    const fixtureDefinitions = pages.map(
      (p) => `  ${p.propName}: async ({ page }, use) => {
    await use(new ${p.className}(page));
  },`
    );

    return `import { test as baseTest } from 'playwright-bdd';
${importLines.join("\n")}

type Pages = {
${typeEntries.join("\n")}
};

export const test = baseTest.extend<Pages>({
${fixtureDefinitions.join("\n")}
});

export { expect } from '@playwright/test';
`;
  }
}
