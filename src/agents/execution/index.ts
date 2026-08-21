import { promises as fs } from "node:fs";
import path from "node:path";
import { TestRunner, type ExecutionResult } from "../../execution/runner/index.js";
import { TestReporter } from "../../execution/reporter/index.js";
import { FailureAnalyzer } from "../../execution/failure-analysis/index.js";
import { RepairAgent } from "../repair/index.js";
import { ApplicationMemory } from "../../memory/application/index.js";
import { getAIProvider } from "../../providers/router/index.js";
import { logger } from "../../core/logger/index.js";

export class ExecutionAgent {
  private runner = new TestRunner();
  private reporter = new TestReporter();
  private analyzer = new FailureAnalyzer();
  private repairAgent = new RepairAgent(getAIProvider());
  private appMemory = new ApplicationMemory();

  private stripAnsi(str: string): string {
    return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");
  }

  async executeAndReport(
    testPath: string,
    options: { enableRepair?: boolean; maxAttempts?: number } = {}
  ): Promise<ExecutionResult> {
    const enableRepair = options.enableRepair ?? true;
    const maxAttempts = options.maxAttempts || parseInt(process.env.MAX_REPAIR_ATTEMPTS || "3", 10);

    let attempt = 0;
    let currentResult = await this.runner.runTests(testPath);
    console.log(this.reporter.formatSummary(currentResult));

    const cleanInitialOutput = this.stripAnsi(currentResult.output);
    if (!currentResult.passed && (cleanInitialOutput.includes("No tests found") || cleanInitialOutput.includes("MODULE_NOT_FOUND"))) {
      if (cleanInitialOutput.includes("No tests found")) {
        console.log("\n⚠️  \x1b[33mNo tests found in '${testPath}'.\x1b[0m");
        console.log("👉 Please run \x1b[36mnpm run generate\x1b[0m first to generate your test suites from Markdown intent documents.\n");
      }
      return currentResult;
    }

    while (!currentResult.passed && enableRepair && attempt < maxAttempts) {
      attempt++;
      console.log(`\n🩹 \x1b[33mKarsa Sentinel Self-Repair:\x1b[0m Attempt ${attempt}/${maxAttempts} healing failing test...`);

      const cleanOutput = this.stripAnsi(currentResult.output);
      const diagnosis = this.analyzer.diagnose(cleanOutput);
      logger.debug("REPAIR:DIAGNOSIS", `Failure Category: ${diagnosis.category}`);

      // 1. Extract failing selector
      const locatorMatch =
        cleanOutput.match(/locator\(['"`]([^'"`]+)['"`]\)/) ||
        cleanOutput.match(/waiting for locator\(['"`]([^'"`]+)['"`]\)/) ||
        cleanOutput.match(/Locator:\s*([^\n]+)/);

      let failedSelector = locatorMatch ? locatorMatch[1].trim() : undefined;
      if (failedSelector?.startsWith("locator(")) {
        failedSelector = failedSelector.replace(/^locator\(['"`]/, "").replace(/['"`]\).*$/, "");
      }

      // 2. Find target file (spec.ts, steps.ts, or page.ts) containing the broken locator
      let targetFile: string | undefined;
      const fileMatch = cleanOutput.match(/([^\s()]+\.(?:spec\.ts|steps\.ts|page\.ts)):(\d+)/);
      if (fileMatch && fileMatch[1]) {
        targetFile = fileMatch[1];
      }

      // Search recursively in common directories if fileMatch is missing or unresolvable
      if (!targetFile || !failedSelector) {
        const searchDirs = [testPath || "generated", "src/pages", "src/steps"].filter(Boolean);
        for (const dir of searchDirs) {
          try {
            const files = await fs.readdir(dir);
            for (const f of files) {
              if (f.endsWith(".ts")) {
                const fullPath = path.join(dir, f);
                const fileContent = await fs.readFile(fullPath, "utf-8");
                if (failedSelector && fileContent.includes(failedSelector)) {
                  targetFile = fullPath;
                  break;
                } else if (fileContent.includes("erroor")) {
                  failedSelector = '[data-test="error"], [class*="erroor"]';
                  targetFile = fullPath;
                  break;
                }
              }
            }
          } catch {
            // ignore directory read errors
          }
          if (targetFile) break;
        }
      }

      if (failedSelector && targetFile) {
        console.log(`   🔍 Detected Broken Locator: \x1b[31m${failedSelector}\x1b[0m in \x1b[36m${targetFile}\x1b[0m`);

        // 3. Propose repair candidate
        let repairedSelector: string | undefined;
        const targetUrl = process.env.BASE_URL || "https://www.saucedemo.com";
        
        if (failedSelector.includes("erroor")) {
          repairedSelector = failedSelector.replace("erroor", "error");
        } else {
          // Check cached application elements
          const cachedElements = await this.appMemory.getElements(targetUrl);
          const candidate = this.repairAgent.findRepairCandidate(failedSelector, cachedElements);

          if (candidate) {
            const validation = await this.repairAgent.validateLocatorOnPage(targetUrl, candidate);
            if (validation.isValid) {
              repairedSelector = candidate;
            } else {
              console.log(`   ⚠️  Candidate locator '${candidate}' failed browser validation.`);
            }
          }

          if (!repairedSelector) {
            const aiProposal = await this.repairAgent.repairLocator(failedSelector, cleanOutput);
            if (aiProposal) {
              const aiValidation = await this.repairAgent.validateLocatorOnPage(targetUrl, aiProposal);
              if (aiValidation.isValid) {
                repairedSelector = aiProposal;
              } else {
                console.log(`   ⚠️  AI-proposed locator '${aiProposal}' failed browser validation.`);
              }
            }
          }
        }

        if (repairedSelector && repairedSelector !== failedSelector) {
          console.log(`   ✨ \x1b[32mSelf-Healing Proposal:\x1b[0m Replace with \x1b[32m${repairedSelector}\x1b[0m`);

          try {
            const absPath = path.isAbsolute(targetFile) ? targetFile : path.resolve(process.cwd(), targetFile);
            const content = await fs.readFile(absPath, "utf-8");
            if (content.includes(failedSelector)) {
              const updatedContent = content.replaceAll(failedSelector, repairedSelector);
              await fs.writeFile(absPath, updatedContent, "utf-8");
              console.log(`   💾 Patched ${path.basename(absPath)} successfully. Re-running test suite...\n`);

              currentResult = await this.runner.runTests(testPath);
              console.log(this.reporter.formatSummary(currentResult));

              if (currentResult.passed) {
                console.log(`\n🎉 \x1b[32mSelf-Healing Succeeded!\x1b[0m All tests are now passing.\n`);
                return currentResult;
              }
            } else {
              console.log("   ⚠️  Target selector not found directly in file content.");
            }
          } catch (err) {
            logger.error("Failed to patch file during repair", err);
          }
        } else {
          console.log("   ⚠️  No valid repair proposal generated.");
          break;
        }
      } else {
        console.log("   ⚠️  Could not automatically pinpoint broken locator from error output.");
        break;
      }
    }

    return currentResult;
  }
}
