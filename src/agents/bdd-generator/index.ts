import type { BDDFeature, TestCase } from "../../core/models/index.js";
import { BDDGenerator } from "../../generators/bdd/index.js";

export class BDDGeneratorAgent {
  private bddGen = new BDDGenerator();

  async generate(title: string, testCases: TestCase[]): Promise<BDDFeature> {
    return this.bddGen.generateFeatureFromTestCases(title, testCases);
  }
}
