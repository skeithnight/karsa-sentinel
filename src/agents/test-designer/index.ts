import type { Requirement, TestCase } from "../../core/models/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import { MockAIProvider } from "../../providers/router/index.js";

export class TestDesignerAgent {
  constructor(private readonly aiProvider: IAIProvider = new MockAIProvider()) {}

  async designTests(requirement: Requirement): Promise<TestCase[]> {
    return this.aiProvider.generateTestCases(requirement);
  }
}
