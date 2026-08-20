import { DocumentParserRegistry } from "../../documents/parser/index.js";
import { getAIProvider } from "../../providers/router/index.js";
import { ProjectGenerator } from "../../generators/project/index.js";
import { RequirementMemory } from "../../memory/requirements/index.js";
import { ApplicationMemory } from "../../memory/application/index.js";
import { ExplorerAgent } from "../explorer/index.js";
import { logger } from "../../core/logger/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import type { UIElement } from "../../core/models/index.js";

export interface GenerateOptions {
  documentPath: string;
  outputDirectory?: string;
  aiProvider?: IAIProvider;
  skipCrawl?: boolean;
}

export class SentinelOrchestrator {
  private parserRegistry = new DocumentParserRegistry();
  private aiProvider: IAIProvider;
  private projectGenerator = new ProjectGenerator();
  private reqMemory = new RequirementMemory();
  private appMemory = new ApplicationMemory();
  private explorer = new ExplorerAgent();

  constructor(aiProvider?: IAIProvider) {
    this.aiProvider = aiProvider || getAIProvider();
  }

  async generate(options: GenerateOptions): Promise<{ featureFile: string; specFile: string; pageObjectFile?: string }> {
    const outDir = options.outputDirectory || "generated";
    const provider = options.aiProvider || this.aiProvider;

    logger.debug("ORCHESTRATOR:START", `Starting test generation pipeline for ${options.documentPath}`);

    // 1. Parse document intent
    const requirement = await this.parserRegistry.parseFile(options.documentPath);
    await this.reqMemory.save(requirement);
    logger.debug("ORCHESTRATOR:PARSER", `Parsed requirement: "${requirement.title}" (${requirement.scenarios.length} scenarios)`);

    // 2. Explore Live Web Page if Target URL is specified
    let discoveredElements: UIElement[] = [];
    if (requirement.targetUrl && !options.skipCrawl) {
      try {
        console.log(`🌐 Sentinel Explorer: Discovering DOM at ${requirement.targetUrl}...`);
        discoveredElements = await this.explorer.exploreUrl(requirement.targetUrl);
        if (discoveredElements.length > 0) {
          await this.appMemory.saveElements(requirement.targetUrl, discoveredElements);
          console.log(`✨ Discovered ${discoveredElements.length} interactive elements & resilient locators.`);
        }
      } catch (err) {
        logger.warn(`Web crawl skipped (${err instanceof Error ? err.message : String(err)}). Continuing with document intent.`);
      }
    }

    // 3. Propose test cases using AI Provider
    logger.debug("ORCHESTRATOR:AI", `Requesting test case design from AI Provider [${provider.name}]`);
    const testCases = await provider.generateTestCases(requirement);
    logger.debug("ORCHESTRATOR:AI", `Received ${testCases.length} designed test cases`);

    // 4. Generate BDD & Playwright specs
    logger.debug("ORCHESTRATOR:GENERATOR", "Generating BDD features and Playwright test suite");
    const bddFeature = await provider.generateBDD(testCases);
    if (!bddFeature.title || bddFeature.title === "Feature Automation") {
      bddFeature.title = requirement.title;
    }

    // Ensure all document scenarios are represented in BDD feature if LLM collapsed them
    if (requirement.scenarios && requirement.scenarios.length > 0 && bddFeature.scenarios.length < requirement.scenarios.length) {
      bddFeature.scenarios = requirement.scenarios.map((scText, i) => {
        const title = scText.replace(/^Scenario\s*\d*:\s*/i, "");
        return {
          id: `scenario-${i + 1}`,
          title,
          tags: ["@automated"],
          steps: [
            { keyword: "Given" as const, text: `user navigates to ${requirement.targetUrl || "application"}` },
            { keyword: "When" as const, text: `user performs actions for ${title}` },
            { keyword: "Then" as const, text: `expected outcome for ${title} is verified` },
          ],
        };
      });
    }

    await this.projectGenerator.generateSuite(outDir, bddFeature, {
      targetUrl: requirement.targetUrl,
      discoveredElements,
    });

    const safeName = requirement.title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");
    const safePageName = requirement.title.replace(/[^a-zA-Z0-9]/g, "");

    logger.debug("ORCHESTRATOR:COMPLETE", `Wrote artifacts to ${outDir}/`);

    return {
      featureFile: `${outDir}/${safeName}.feature`,
      specFile: `${outDir}/${safeName}.spec.ts`,
      pageObjectFile: discoveredElements.length > 0 ? `${outDir}/pages/${safePageName}Page.ts` : undefined,
    };
  }
}
