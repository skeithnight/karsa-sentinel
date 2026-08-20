import { promises as fs } from "node:fs";
import path from "node:path";
import type { BDDFeature, UIElement } from "../../core/models/index.js";
import { BDDGenerator } from "../bdd/index.js";
import { PlaywrightGenerator } from "../playwright/index.js";

export class ProjectGenerator {
  private bddGen = new BDDGenerator();
  private playwrightGen = new PlaywrightGenerator();

  async generateSuite(
    outDir: string,
    feature: BDDFeature,
    options: { targetUrl?: string; discoveredElements?: UIElement[] } = {}
  ): Promise<void> {
    await fs.mkdir(outDir, { recursive: true });

    const safeName = feature.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

    // 1. Output Gherkin Feature File
    const featureContent = this.bddGen.formatGherkin(feature);
    await fs.writeFile(path.join(outDir, `${safeName}.feature`), featureContent, "utf-8");

    // 2. Output Playwright Test Spec File
    const specContent = this.playwrightGen.generatePlaywrightSpec(feature, options.targetUrl);
    await fs.writeFile(path.join(outDir, `${safeName}.spec.ts`), specContent, "utf-8");

    // 3. Output Page Object if UI elements were discovered
    if (options.discoveredElements && options.discoveredElements.length > 0) {
      const pagesDir = path.join(outDir, "pages");
      await fs.mkdir(pagesDir, { recursive: true });
      const poContent = this.playwrightGen.generatePageObject(feature.title, options.discoveredElements);
      const safePageName = feature.title.replace(/[^a-zA-Z0-9]/g, "");
      await fs.writeFile(path.join(pagesDir, `${safePageName}Page.ts`), poContent, "utf-8");
    }
  }
}
