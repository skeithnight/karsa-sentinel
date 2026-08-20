import type { BDDFeature } from "../../core/models/index.js";
import { ProjectGenerator } from "../../generators/project/index.js";

export class AutomationAgent {
  private projectGen = new ProjectGenerator();

  async scaffoldSuite(outputDir: string, feature: BDDFeature): Promise<void> {
    await this.projectGen.generateSuite(outputDir, feature);
  }
}
