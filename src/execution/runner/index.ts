import { exec } from "node:child_process";
import { promisify } from "node:util";

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
    try {
      const { stdout } = await execAsync(`npx playwright test ${testPath}`);
      return {
        passed: true,
        totalTests: 1,
        passedTests: 1,
        failedTests: 0,
        output: stdout,
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error as { stdout?: string; stderr?: string; message?: string };
      return {
        passed: false,
        totalTests: 1,
        passedTests: 0,
        failedTests: 1,
        output: err.stdout || err.stderr || err.message || "Execution failed",
        durationMs: Date.now() - startTime,
      };
    }
  }
}
