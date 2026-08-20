import { promises as fs } from "node:fs";
import path from "node:path";
import type { BDDFeature } from "../../core/models/index.js";
import { BDDGenerator } from "../bdd/index.js";
import { PlaywrightGenerator } from "../playwright/index.js";

export class ProjectGenerator {
  private bddGen = new BDDGenerator();
  private playwrightGen = new PlaywrightGenerator();

  async generateSuite(outDir: string, feature: BDDFeature): Promise<void> {
    await fs.mkdir(outDir, { recursive: true });

    const safeName = feature.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const featureContent = this.bddGen.formatGherkin(feature);
    await fs.writeFile(path.join(outDir, `${safeName}.feature`), featureContent, "utf-8");

    const specContent = this.playwrightGen.generatePlaywrightSpec(feature);
    await fs.writeFile(path.join(outDir, `${safeName}.spec.ts`), specContent, "utf-8");
  }
}
