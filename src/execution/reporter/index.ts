import type { ExecutionResult } from "../runner/index.js";

export class TestReporter {
  formatSummary(result: ExecutionResult): string {
    const isPass = result.passed;
    const statusColor = isPass ? "\x1b[32m" : "\x1b[31m";
    const statusText = isPass ? "PASSED ✅" : "FAILED ❌";
    const reset = "\x1b[0m";
    const cyan = "\x1b[36m";
    const gray = "\x1b[90m";

    return `
┌──────────────────────────────────────────────────────────┐
│              🛡️  KARSA SENTINEL TEST SUMMARY             │
├──────────────────────────────────────────────────────────┤
│  Status:    ${statusColor}${statusText.padEnd(45)}${reset}│
│  Duration:  ${(result.durationMs / 1000).toFixed(2)}s${" ".repeat(46 - (result.durationMs / 1000).toFixed(2).length)}│
│  Passed:    \x1b[32m${result.passedTests}\x1b[0m / ${result.totalTests}${" ".repeat(45 - String(result.passedTests).length - String(result.totalTests).length)}│
│  Failed:    \x1b[31m${result.failedTests}\x1b[0m / ${result.totalTests}${" ".repeat(45 - String(result.failedTests).length - String(result.totalTests).length)}│
├──────────────────────────────────────────────────────────┤
│  📊 HTML Report: ${cyan}npx playwright show-report${reset}${" ".repeat(18)}│
└──────────────────────────────────────────────────────────┘
`;
  }
}
