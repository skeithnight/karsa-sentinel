import { FailureAnalyzer, type FailureDiagnosis } from "../../execution/failure-analysis/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import { MockAIProvider } from "../../providers/router/index.js";

export class RepairAgent {
  private analyzer = new FailureAnalyzer();
  constructor(private readonly aiProvider: IAIProvider = new MockAIProvider()) {}

  diagnose(errorOutput: string): FailureDiagnosis {
    return this.analyzer.diagnose(errorOutput);
  }

  async repairLocator(failedSelector: string, pageSnapshot: string): Promise<string> {
    return this.aiProvider.repairLocator(failedSelector, pageSnapshot);
  }
}
