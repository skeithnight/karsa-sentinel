import type { Requirement, TestCase, TestDesignContext, UIElement } from "../../core/models/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import { MockAIProvider } from "../../providers/router/index.js";

export class TestDesignerAgent {
  constructor(private readonly aiProvider: IAIProvider = new MockAIProvider()) {}

  async designTests(requirement: Requirement, uiEvidence: UIElement[] = []): Promise<TestCase[]> {
    const context: TestDesignContext = {
      requirement,
      uiEvidence,
    };
    return this.aiProvider.generateTestCases(context);
  }
}
