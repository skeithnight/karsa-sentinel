import { TestRunner, type ExecutionResult } from "../../execution/runner/index.js";
import { TestReporter } from "../../execution/reporter/index.js";

export class ExecutionAgent {
  private runner = new TestRunner();
  private reporter = new TestReporter();

  async executeAndReport(testPath: string): Promise<ExecutionResult> {
    const result = await this.runner.runTests(testPath);
    console.log(this.reporter.formatSummary(result));
    return result;
  }
}
