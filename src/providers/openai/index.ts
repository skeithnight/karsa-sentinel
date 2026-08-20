import type { IAIProvider } from "../../core/contracts/index.js";
import type { BDDFeature, Requirement, TestCase } from "../../core/models/index.js";
import { MockAIProvider } from "../router/index.js";

export class OpenAIProvider implements IAIProvider {
  name = "openai";
  private fallback = new MockAIProvider();

  constructor(private readonly apiKey?: string, private readonly model: string = "gpt-4o") {}

  async generateRequirements(content: string): Promise<Requirement> {
    if (!this.apiKey) {
      return this.fallback.generateRequirements(content);
    }
    // Phase 1 implementation placeholder for OpenAI SDK client
    return this.fallback.generateRequirements(content);
  }

  async generateTestCases(requirement: Requirement): Promise<TestCase[]> {
    return this.fallback.generateTestCases(requirement);
  }

  async generateBDD(testCases: TestCase[]): Promise<BDDFeature> {
    return this.fallback.generateBDD(testCases);
  }

  async repairLocator(failedSelector: string, pageSnapshot: string): Promise<string> {
    return this.fallback.repairLocator(failedSelector, pageSnapshot);
  }
}
