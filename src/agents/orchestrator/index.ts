import { DocumentParserRegistry } from "../../documents/parser/index.js";
import { getAIProvider } from "../../providers/router/index.js";
import { ProjectGenerator } from "../../generators/project/index.js";
import { BDDGenerator } from "../../generators/bdd/index.js";
import { RequirementMemory } from "../../memory/requirements/index.js";
import { ApplicationMemory } from "../../memory/application/index.js";
import { ExplorerAgent } from "../explorer/index.js";
import { logger } from "../../core/logger/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import type { UIElement, TestDesignContext, BDDStep } from "../../core/models/index.js";

export interface GenerateOptions {
  documentPath: string;
  outputDirectory?: string;
  aiProvider?: IAIProvider;
  skipCrawl?: boolean;
  mode?: "enterprise" | "standalone";
}

export class SentinelOrchestrator {
  private parserRegistry = new DocumentParserRegistry();
  private aiProvider: IAIProvider;
  private projectGenerator = new ProjectGenerator();
  private bddGenerator = new BDDGenerator();
  private reqMemory = new RequirementMemory();
  private appMemory = new ApplicationMemory();
  private explorer = new ExplorerAgent();

  constructor(aiProvider?: IAIProvider) {
    this.aiProvider = aiProvider || getAIProvider();
  }

  async generate(options: GenerateOptions): Promise<{
    featureFile: string;
    specFile?: string;
    pageObjectFile?: string;
    stepFile?: string;
    fixtureFile?: string;
  }> {
    const outDir = options.outputDirectory || "generated";
    const provider = options.aiProvider || this.aiProvider;
    const mode = options.mode || "enterprise";

    logger.debug("ORCHESTRATOR:START", `Starting test generation pipeline for ${options.documentPath} (mode: ${mode})`);

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

    // 3. Propose test cases using AI Provider with full TestDesignContext (Requirement + UI Evidence)
    logger.debug("ORCHESTRATOR:AI", `Requesting test case design from AI Provider [${provider.name}] with ${discoveredElements.length} UI evidence items`);
    const context: TestDesignContext = {
      requirement,
      uiEvidence: discoveredElements,
    };
    const testCases = await provider.generateTestCases(context);
    logger.debug("ORCHESTRATOR:AI", `Received ${testCases.length} designed test cases`);

    // 4. Generate BDD Feature Model deterministically
    logger.debug("ORCHESTRATOR:BDD", "Generating BDD feature model from test cases");
    const bddFeature = this.bddGenerator.generateFeatureFromTestCases(
      requirement.title,
      testCases,
      requirement.targetUrl
    );

    // Ensure all document scenarios are represented in BDD feature if LLM collapsed them
    if (requirement.scenarios && requirement.scenarios.length > 0 && bddFeature.scenarios.length < requirement.scenarios.length) {
      bddFeature.scenarios = requirement.scenarios.map((scBlock, i) => {
        const lines = scBlock.split("\n");
        const title = lines[0].replace(/^Scenario\s*\d*:\s*/i, "").trim();
        const stepLines = lines.slice(1).map((l) => l.replace(/^[-*]\s*/, "").replace(/\*\*/g, "").trim()).filter(Boolean);

        let steps: BDDStep[] = [];
        if (stepLines.length > 0) {
          steps = stepLines.map((line) => {
            const kwMatch = line.match(/^(Given|When|Then|And|But)\s+/i);
            const keyword = (kwMatch ? kwMatch[1].charAt(0).toUpperCase() + kwMatch[1].slice(1).toLowerCase() : "When") as "Given" | "When" | "Then" | "And" | "But";
            const text = kwMatch ? line.slice(kwMatch[0].length).trim() : line;
            return { keyword, text };
          });
        } else {
          steps = [
            { keyword: "Given" as const, text: `user navigates to ${requirement.targetUrl || "application"}` },
            { keyword: "When" as const, text: `user performs actions for ${title}` },
            { keyword: "Then" as const, text: `expected outcome for ${title} is verified` },
          ];
        }

        return {
          id: `scenario-${i + 1}`,
          title,
          tags: ["@automated"],
          steps,
        };
      });
    }

    // 5. Generate Suite (Enterprise BDD + POM or Standalone Spec)
    const result = await this.projectGenerator.generateSuite(outDir, bddFeature, {
      targetUrl: requirement.targetUrl,
      discoveredElements,
      mode,
    });

    logger.debug("ORCHESTRATOR:COMPLETE", `Wrote artifacts to ${outDir}/`);

    return result;
  }
}
