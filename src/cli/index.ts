#!/usr/bin/env node
import "dotenv/config";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Command } from "commander";
import { SentinelOrchestrator } from "../agents/orchestrator/index.js";
import { ExecutionAgent } from "../agents/execution/index.js";
import { getAIProvider } from "../providers/router/index.js";
import { NineRouterProvider } from "../providers/nine-router/index.js";
import { OpenAIProvider } from "../providers/openai/index.js";
import { GeminiProvider } from "../providers/gemini/index.js";
import { MockAIProvider } from "../providers/router/index.js";
import { logger } from "../core/logger/index.js";
import type { IAIProvider } from "../core/contracts/index.js";

const program = new Command();

program
  .name("karsa-sentinel")
  .description("AI-powered QA automation agent: Transforms intent into Playwright BDD automation")
  .version("0.2.4")
  .option("-d, --debug", "Enable detailed debug mode with verbose log tracing")
  .hook("preAction", (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.debug || process.env.DEBUG === "true" || process.env.SENTINEL_DEBUG === "true") {
      logger.setDebug(true);
      logger.debug("CLI:INIT", "Debug mode enabled. Verbose tracing is ACTIVE.");
    }
  });

program
  .command("init")
  .description("Initialize project with Playwright configuration, HTML reports, and sample specs")
  .option("-d, --debug", "Enable debug logs")
  .action(async (options: { debug?: boolean }) => {
    if (options.debug) logger.setDebug(true);
    try {
      console.log("\n🛡️  Karsa Sentinel: Initializing project configuration...");

      // 1. Scaffold playwright.config.ts
      const playwrightConfigPath = path.resolve(process.cwd(), "playwright.config.ts");
      const playwrightConfigContent = `import fs from 'node:fs';
import path from 'node:path';
import { defineConfig, devices } from '@playwright/test';

// Zero-dependency environment variable loader
try {
  if (typeof (process as any).loadEnvFile === 'function') {
    (process as any).loadEnvFile();
  } else {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      for (const line of content.split('\\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
          if (key && !process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
} catch {
  // ignore
}

export default defineConfig({
  testDir: './generated',
  timeout: 30000,
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.saucedemo.com',
    headless: process.env.PLAYWRIGHT_HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
`;
      await fs.writeFile(playwrightConfigPath, playwrightConfigContent, "utf-8");
      console.log("   ✅ Created/Updated playwright.config.ts (with zero-dependency env loader and HTML reporting)");

      // 2. Scaffold .env.example
      const envExamplePath = path.resolve(process.cwd(), ".env.example");
      const envExampleContent = `# ── AI Provider Configuration ────────────────────────────────
AI_PROVIDER=9router # 9router | openai | gemini | mock

# ── 9Router AI Proxy ─────────────────────────────────────────
NINE_ROUTER_BASE_URL=http://localhost:20218/v1
NINE_ROUTER_AUTH_TOKEN=your_auth_token_here
NINE_ROUTER_MODEL=mimo

# ── Target Application ───────────────────────────────────────
BASE_URL=https://www.saucedemo.com

# ── Playwright Configuration ─────────────────────────────────
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000

# ── Sentinel Autonomous Self-Healing ─────────────────────────
MAX_REPAIR_ATTEMPTS=3
DEBUG=false
`;
      await fs.writeFile(envExamplePath, envExampleContent, "utf-8");
      console.log("   ✅ Created .env.example");

      // 3. Scaffold docs/examples/login.md
      const docsDir = path.resolve(process.cwd(), "docs/examples");
      await fs.mkdir(docsDir, { recursive: true });
      const sampleLoginDoc = `# Feature: SauceDemo Authentication Matrix

## Target URL
\`https://www.saucedemo.com/\`

## Scenarios

### Scenario 1: Standard User Login Success
- **Given** user navigates to \`https://www.saucedemo.com/\`
- **When** user enters username \`standard_user\`
- **And** user enters password \`secret_sauce\`
- **And** user clicks the Login button
- **Then** user is redirected to \`/inventory.html\`
- **And** header title displays "Products"

### Scenario 2: Locked Out User Error Banner
- **Given** user navigates to \`https://www.saucedemo.com/\`
- **When** user enters username \`locked_out_user\`
- **And** user enters password \`secret_sauce\`
- **And** user clicks the Login button
- **Then** error message "Epic sadface: Sorry, this user has been locked out." is displayed
`;
      await fs.writeFile(path.join(docsDir, "login.md"), sampleLoginDoc, "utf-8");
      console.log("   ✅ Created docs/examples/login.md");

      // 4. Update package.json scripts and dependencies
      const pkgPath = path.resolve(process.cwd(), "package.json");
      try {
        const pkgData = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
        pkgData.devDependencies = {
          ...pkgData.devDependencies,
          "@playwright/test": "^1.50.1",
        };
        pkgData.scripts = {
          ...pkgData.scripts,
          generate: "karsa-sentinel generate ./docs/examples/login.md",
          "generate:debug": "karsa-sentinel generate ./docs/examples/login.md -d",
          test: "karsa-sentinel run",
          "test:repair": "karsa-sentinel run --repair",
          "test:pw": "playwright test",
          report: "playwright show-report",
        };
        await fs.writeFile(pkgPath, JSON.stringify(pkgData, null, 2), "utf-8");
        console.log("   ✅ Injected generate, test, and report scripts into package.json");
      } catch {
        // Ignore if package.json doesn't exist
      }

      console.log("\n🚀 Initialization complete! Try running:");
      console.log("   npm run generate");
      console.log("   npm test              # (runs with autonomous self-healing)");
      console.log("   npm run report\n");
    } catch (err) {
      console.error(`❌ Initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program
  .command("generate")
  .description("Generate Playwright BDD test suite from a requirement document")
  .argument("<documentPath>", "Path to requirement document (e.g. ./docs/examples/login.md)")
  .option("-o, --output <dir>", "Output directory for generated tests", "generated")
  .option("-p, --provider <provider>", "AI provider: 9router | openai | gemini | mock")
  .option("-m, --model <model>", "AI model name (e.g. mimo, gpt-4o)")
  .option("-d, --debug", "Enable verbose debug logs")
  .option("--skip-crawl", "Skip live browser DOM exploration")
  .action(
    async (
      documentPath: string,
      options: { output?: string; provider?: string; model?: string; debug?: boolean; skipCrawl?: boolean }
    ) => {
      if (options.debug) logger.setDebug(true);
      try {
        let provider: IAIProvider;
        if (options.provider === "9router") {
          provider = new NineRouterProvider({ model: options.model });
        } else if (options.provider === "openai") {
          provider = new OpenAIProvider(process.env.OPENAI_API_KEY, options.model || "gpt-4o");
        } else if (options.provider === "gemini") {
          provider = new GeminiProvider(process.env.GEMINI_API_KEY, options.model || "gemini-1.5-pro");
        } else if (options.provider === "mock") {
          provider = new MockAIProvider();
        } else {
          provider = getAIProvider();
        }

        console.log(`\n🛡️  Karsa Sentinel: Processing intent document: ${documentPath}`);
        console.log(`🤖 AI Provider:     ${provider.name.toUpperCase()}`);

        const orchestrator = new SentinelOrchestrator(provider);
        const result = await orchestrator.generate({
          documentPath,
          outputDirectory: options.output,
          skipCrawl: options.skipCrawl,
        });

        console.log("\n✅ Generation complete!");
        console.log(`   - Feature:     ${result.featureFile}`);
        console.log(`   - Spec:        ${result.specFile}`);
        if (result.pageObjectFile) {
          console.log(`   - Page Object: ${result.pageObjectFile}`);
        }
        console.log("");
      } catch (err: unknown) {
        const error = err as Error;
        console.error(`❌ Error during generation: ${error.message}`);
        process.exit(1);
      }
    }
  );

program
  .command("run")
  .alias("test")
  .description("Execute generated Playwright tests with autonomous self-healing")
  .argument("[testPath]", "Test file or directory to run", "generated")
  .option("-r, --repair", "Enable autonomous locator self-repair upon test failure", true)
  .option("--no-repair", "Disable autonomous self-repair")
  .option("-d, --debug", "Enable verbose debug logs")
  .action(async (testPath: string, options: { repair?: boolean; debug?: boolean }) => {
    if (options.debug) logger.setDebug(true);
    try {
      console.log(`\n🛡️  Karsa Sentinel: Running test suite (${testPath})...`);
      const executionAgent = new ExecutionAgent();
      const result = await executionAgent.executeAndReport(testPath, {
        enableRepair: options.repair,
      });
      if (!result.passed) {
        process.exit(1);
      }
    } catch (err) {
      console.error(`❌ Execution failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
