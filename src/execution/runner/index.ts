import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../../core/logger/index.js";

const execAsync = promisify(exec);

export interface ExecutionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  output: string;
  durationMs: number;
}

export class TestRunner {
  async runTests(testPath: string): Promise<ExecutionResult> {
    const startTime = Date.now();
    const cmd = `npx playwright test ${testPath}`;
    logger.debug("RUNNER:EXEC", `Executing command: ${cmd}`);

    try {
      const { stdout, stderr } = await execAsync(cmd);
      const durationMs = Date.now() - startTime;
      logger.debug("RUNNER:SUCCESS", `Playwright executed in ${durationMs}ms`, { stdout, stderr });
      return {
        passed: true,
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        output: stdout,
        durationMs,
      };
    } catch (error: unknown) {
      const durationMs = Date.now() - startTime;
      const err = error as { stdout?: string; stderr?: string; message?: string };
      logger.debug("RUNNER:FAILURE", `Playwright exited with error in ${durationMs}ms`, {
        stdout: err.stdout,
        stderr: err.stderr,
      });
      return {
        passed: false,
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        output: err.stdout || err.stderr || err.message || "Execution failed",
        durationMs,
      };
    }
  }
}
