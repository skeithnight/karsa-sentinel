import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { logger } from "../../core/logger/index.js";

const execAsync = promisify(exec);

export interface FailedTestDetail {
  title: string;
  file?: string;
  line?: number;
  errorMessage?: string;
  failedSelector?: string;
}

export interface ExecutionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests?: number;
  flakyTests?: number;
  failedDetails?: FailedTestDetail[];
  output: string;
  durationMs: number;
}

export class TestRunner {
  async runTests(testPath: string): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Check if project uses playwright-bdd
    const isBdd = this.detectBddSetup();
    const cmd = isBdd ? `npx bddgen && npx playwright test ${testPath}` : `npx playwright test ${testPath}`;
    logger.debug("RUNNER:EXEC", `Executing command: ${cmd}`);

    try {
      const { stdout, stderr } = await execAsync(cmd);
      const durationMs = Date.now() - startTime;
      const combinedOutput = `${stdout}\n${stderr}`;
      logger.debug("RUNNER:SUCCESS", `Test execution succeeded in ${durationMs}ms`, { stdout, stderr });

      const parsedCounts = this.parseCounts(combinedOutput);
      const passedTests = parsedCounts.passed || (parsedCounts.total > 0 ? parsedCounts.total : 1);
      const failedTests = parsedCounts.failed || 0;
      const totalTests = parsedCounts.total > 0 ? parsedCounts.total : passedTests + failedTests;

      return {
        passed: true,
        totalTests,
        passedTests,
        failedTests,
        skippedTests: parsedCounts.skipped,
        flakyTests: parsedCounts.flaky,
        output: stdout,
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const err = error as { stdout?: string; stderr?: string; message?: string };
      const combinedOutput = `${err.stdout || ""}\n${err.stderr || ""}\n${err.message || ""}`;
      logger.debug("RUNNER:FAILURE", `Test execution failed in ${durationMs}ms`, {
        stdout: err.stdout,
        stderr: err.stderr,
      });

      const parsedCounts = this.parseCounts(combinedOutput);
      const failedTests = parsedCounts.failed || (parsedCounts.total > 0 ? parsedCounts.total - (parsedCounts.passed || 0) : 1);
      const passedTests = parsedCounts.passed || 0;
      const totalTests = parsedCounts.total > 0 ? parsedCounts.total : passedTests + failedTests;
      const failedDetails = this.extractFailedDetails(combinedOutput);

      return {
        passed: false,
        totalTests,
        passedTests,
        failedTests,
        skippedTests: parsedCounts.skipped,
        flakyTests: parsedCounts.flaky,
        failedDetails,
        output: err.stdout || err.stderr || err.message || "Execution failed",
        durationMs,
      };
    }
  }

  private detectBddSetup(): boolean {
    try {
      const configPath = path.resolve(process.cwd(), "playwright.config.ts");
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, "utf-8");
        if (configContent.includes("playwright-bdd") || configContent.includes("defineBddConfig")) {
          return true;
        }
      }
      return fs.existsSync(path.resolve(process.cwd(), "features"));
    } catch {
      return false;
    }
  }

  private extractFailedDetails(output: string): FailedTestDetail[] {
    const details: FailedTestDetail[] = [];
    const cleanOutput = output.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "");

    // Extract file and line: e.g. at .../something.spec.ts:38:22 or something.steps.ts:45
    const fileMatch = cleanOutput.match(/([^\s()]+\.(?:spec\.ts|steps\.ts|page\.ts)):(\d+)/);
    const locatorMatch = cleanOutput.match(/locator\(['"`]([^'"`]+)['"`]\)/) || cleanOutput.match(/Locator:\s*([^\n]+)/);

    if (fileMatch || locatorMatch) {
      details.push({
        title: "Failed test scenario",
        file: fileMatch ? fileMatch[1] : undefined,
        line: fileMatch ? parseInt(fileMatch[2], 10) : undefined,
        errorMessage: cleanOutput.slice(0, 300),
        failedSelector: locatorMatch ? locatorMatch[1] : undefined,
      });
    }

    return details;
  }

  private parseCounts(output: string): { total: number; passed: number; failed: number; skipped: number; flaky: number } {
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    let flaky = 0;

    const passedMatch = output.match(/(\d+)\s+passed/i);
    if (passedMatch) passed = parseInt(passedMatch[1], 10);

    const failedMatch = output.match(/(\d+)\s+failed/i);
    if (failedMatch) failed = parseInt(failedMatch[1], 10);

    const skippedMatch = output.match(/(\d+)\s+skipped/i);
    if (skippedMatch) skipped = parseInt(skippedMatch[1], 10);

    const flakyMatch = output.match(/(\d+)\s+flaky/i);
    if (flakyMatch) flaky = parseInt(flakyMatch[1], 10);

    const total = passed + failed + skipped;

    return { total, passed, failed, skipped, flaky };
  }
}
