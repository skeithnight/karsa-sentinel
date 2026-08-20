#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { SentinelOrchestrator } from "../agents/orchestrator/index.js";
import { getAIProvider } from "../providers/router/index.js";

const program = new Command();

program
  .name("karsa-sentinel")
  .description("AI-powered QA automation agent: Transforms intent into Playwright BDD automation")
  .version("0.1.0");

program
  .command("generate")
  .description("Generate Playwright BDD test suite from a requirement document")
  .argument("<documentPath>", "Path to requirement document (e.g. ./docs/examples/login.md)")
  .option("-o, --output <dir>", "Output directory for generated tests", "generated")
  .action(async (documentPath: string, options: { output?: string }) => {
    try {
      const provider = getAIProvider();
      console.log(`\n🛡️  Karsa Sentinel: Processing intent document: ${documentPath}`);
      console.log(`🤖 AI Provider:     ${provider.name.toUpperCase()}`);

      const orchestrator = new SentinelOrchestrator(provider);
      const result = await orchestrator.generate({
        documentPath,
        outputDirectory: options.output,
      });

      console.log("\n✅ Generation complete!");
      console.log(`   - Feature: ${result.featureFile}`);
      console.log(`   - Spec:    ${result.specFile}\n`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`❌ Error during generation: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
