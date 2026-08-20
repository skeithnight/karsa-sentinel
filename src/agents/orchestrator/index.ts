import { DocumentParserRegistry } from "../../documents/parser/index.js";
import { getAIProvider } from "../../providers/router/index.js";
import { ProjectGenerator } from "../../generators/project/index.js";
import { RequirementMemory } from "../../memory/requirements/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";

export interface GenerateOptions {
  documentPath: string;
  outputDirectory?: string;
  aiProvider?: IAIProvider;
}

export class SentinelOrchestrator {
  private parserRegistry = new DocumentParserRegistry();
  private aiProvider: IAIProvider;
  private projectGenerator = new ProjectGenerator();
  private reqMemory = new RequirementMemory();

  constructor(aiProvider?: IAIProvider) {
    this.aiProvider = aiProvider || getAIProvider();
  }

  async generate(options: GenerateOptions): Promise<{ featureFile: string; specFile: string }> {
    const outDir = options.outputDirectory || "generated";
    const provider = options.aiProvider || this.aiProvider;

    // 1. Parse document intent
    const requirement = await this.parserRegistry.parseFile(options.documentPath);
    await this.reqMemory.save(requirement);

    // 2. Propose test cases using AI Provider
    const testCases = await provider.generateTestCases(requirement);

    // 3. Generate BDD & Playwright specs
    const bddFeature = await provider.generateBDD(testCases);
    if (!bddFeature.title || bddFeature.title === "Feature Automation") {
      bddFeature.title = requirement.title;
    }

    await this.projectGenerator.generateSuite(outDir, bddFeature);

    const safeName = requirement.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    return {
      featureFile: `${outDir}/${safeName}.feature`,
      specFile: `${outDir}/${safeName}.spec.ts`,
    };
  }
}
