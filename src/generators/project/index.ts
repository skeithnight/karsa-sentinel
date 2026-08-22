import { promises as fs } from "node:fs";
import path from "node:path";
import type { BDDFeature, UIElement, AutomationAction } from "../../core/models/index.js";
import { BDDGenerator } from "../bdd/index.js";
import { PlaywrightGenerator } from "../playwright/index.js";
import { PageObjectGenerator, generateBasePageContent } from "../page-object/index.js";
import { FixtureGenerator } from "../fixture/index.js";
import { StepDefinitionGenerator } from "../steps/index.js";
import { ActionResolver } from "../../resolver/action/index.js";

export interface SuiteGeneratorOptions {
  targetUrl?: string;
  discoveredElements?: UIElement[];
  mode?: "enterprise" | "standalone";
  baseDir?: string;
}

export class ProjectGenerator {
  private bddGen = new BDDGenerator();
  private playwrightGen = new PlaywrightGenerator();
  private poGen = new PageObjectGenerator();
  private fixtureGen = new FixtureGenerator();
  private stepGen = new StepDefinitionGenerator();
  private actionResolver = new ActionResolver();

  async generateSuite(
    outDir: string,
    feature: BDDFeature,
    options: SuiteGeneratorOptions = {}
  ): Promise<{
    featureFile: string;
    specFile?: string;
    pageObjectFile?: string;
    stepFile?: string;
    fixtureFile?: string;
  }> {
    const safeName = feature.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const safeClassName = feature.title.replace(/[^a-zA-Z0-9]/g, "");
    const pageClassName = safeClassName.endsWith("Page") ? safeClassName : `${safeClassName}Page`;
    const pagePropName = pageClassName.charAt(0).toLowerCase() + pageClassName.slice(1);
    const pageFileName = `${safeName}.page.ts`;

    const discoveredElements = options.discoveredElements || [];
    const mode = options.mode || "enterprise";
    const baseDir = options.baseDir || process.cwd();

    // 1. Output Gherkin Feature File
    const featureContent = this.bddGen.formatGherkin(feature);
    const featurePath = path.join(outDir, `${safeName}.feature`);
    await fs.mkdir(path.dirname(featurePath), { recursive: true });
    await fs.writeFile(featurePath, featureContent, "utf-8");

    // 2. Resolve BDD steps to AutomationActions
    const resolvedActions = new Map<string, AutomationAction[]>();
    for (const scenario of feature.scenarios) {
      const actions = this.actionResolver.resolveScenario(
        scenario.steps,
        discoveredElements,
        options.targetUrl
      );
      resolvedActions.set(scenario.id, actions);
    }

    // 3. Output Standalone Playwright Test Spec File
    const specContent = this.playwrightGen.generateSpec(feature, resolvedActions, options.targetUrl);
    const specPath = path.join(outDir, `${safeName}.spec.ts`);
    await fs.writeFile(specPath, specContent, "utf-8");

    let poPath: string | undefined;
    let stepPath: string | undefined;
    let fixturePath: string | undefined;

    if (mode === "enterprise") {
      // 4. Output BasePage if not exists in src/pages/
      const srcPagesDir = path.join(baseDir, "src", "pages");
      await fs.mkdir(srcPagesDir, { recursive: true });
      const basePagePath = path.join(srcPagesDir, "base.page.ts");
      try {
        await fs.access(basePagePath);
      } catch {
        await fs.writeFile(basePagePath, generateBasePageContent(), "utf-8");
      }

      // 5. Output Enterprise Page Object in src/pages/
      const poContent = this.poGen.generateEnterprisePage(feature.title, discoveredElements, {
        targetUrl: options.targetUrl,
      });
      poPath = path.join(srcPagesDir, pageFileName);
      await fs.writeFile(poPath, poContent, "utf-8");

      // 6. Output / Update base.fixture.ts in src/fixtures/
      const srcFixturesDir = path.join(baseDir, "src", "fixtures");
      await fs.mkdir(srcFixturesDir, { recursive: true });
      fixturePath = path.join(srcFixturesDir, "base.fixture.ts");
      const fixtureContent = this.fixtureGen.generateBaseFixture([
        {
          className: pageClassName,
          fileName: pageFileName,
          propName: pagePropName,
        },
      ]);
      await fs.writeFile(fixturePath, fixtureContent, "utf-8");

      // 7. Output Step Definitions in src/steps/ (unified with ActionResolver)
      const srcStepsDir = path.join(baseDir, "src", "steps");
      await fs.mkdir(srcStepsDir, { recursive: true });
      const stepContent = this.stepGen.generateStepDefinitions(feature, {
        pageFixtureName: pagePropName,
        targetUrl: options.targetUrl,
        resolvedActions,
      });
      stepPath = path.join(srcStepsDir, `${safeName}.steps.ts`);
      await fs.writeFile(stepPath, stepContent, "utf-8");

      // Also ensure features/ directory has the feature file
      const rootFeaturesDir = path.join(baseDir, "features");
      await fs.mkdir(rootFeaturesDir, { recursive: true });
      await fs.writeFile(path.join(rootFeaturesDir, `${safeName}.feature`), featureContent, "utf-8");
    } else if (discoveredElements.length > 0) {
      // Standalone mode: write to generated/pages/
      const pagesDir = path.join(outDir, "pages");
      await fs.mkdir(pagesDir, { recursive: true });
      poPath = path.join(pagesDir, `${safeClassName}Page.ts`);
      const poContent = this.playwrightGen.generatePageObject(feature.title, discoveredElements);
      await fs.writeFile(poPath, poContent, "utf-8");
    }

    return {
      featureFile: featurePath,
      specFile: specPath,
      pageObjectFile: poPath,
      stepFile: stepPath,
      fixtureFile: fixturePath,
    };
  }
}
