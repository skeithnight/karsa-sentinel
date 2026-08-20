import type { ExecutionResult } from "../runner/index.js";

export class TestReporter {
  formatSummary(result: ExecutionResult): string {
    const status = result.passed ? "PASSED" : "FAILED";
    const divider = "=".repeat(40);
    return `
${divider}
Test Run Result: ${status}
Duration: ${result.durationMs}ms
Passed: ${result.passedTests}/${result.totalTests}
Failed: ${result.failedTests}/${result.totalTests}
${divider}
`;
  }
}
