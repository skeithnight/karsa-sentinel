import type { IAIProvider } from "../../core/contracts/index.js";
import type { BDDFeature, Requirement, TestCase, TestDesignContext } from "../../core/models/index.js";
import { OpenAIProvider } from "../openai/index.js";
import { GeminiProvider } from "../gemini/index.js";
import { NineRouterProvider } from "../nine-router/index.js";

export class MockAIProvider implements IAIProvider {
  name = "mock";

  async generateRequirements(content: string): Promise<Requirement> {
    return {
      id: `req-${Date.now()}`,
      title: "Extracted Intent",
      description: content.slice(0, 100),
      scenarios: ["Scenario 1"],
      tags: ["mock"],
      createdAt: new Date().toISOString(),
    };
  }

  async generateTestCases(context: TestDesignContext): Promise<TestCase[]> {
    const { requirement, uiEvidence } = context;

    // Generate steps that reference actual discovered elements when available
    const steps: TestCase["steps"] = [];
    let stepNum = 1;

    if (uiEvidence.length > 0) {
      // Use discovered elements to build realistic test steps
      const fillableElements = uiEvidence.filter((el) => el.tag === "input" || el.tag === "textarea");
      const clickableElements = uiEvidence.filter((el) => el.tag === "button" || el.tag === "a" || el.role === "button");

      for (const el of fillableElements) {
        const name = el.name || el.attributes["placeholder"] || el.tag;
        steps.push({
          stepNumber: stepNum++,
          action: `User enters value into ${name} field`,
          expectedResult: `${name} field contains the entered value`,
        });
      }

      for (const el of clickableElements.slice(0, 2)) {
        const name = el.name || el.text || el.tag;
        steps.push({
          stepNumber: stepNum++,
          action: `User clicks ${name}`,
          expectedResult: `Application responds to ${name} click`,
        });
      }
    }

    if (steps.length === 0) {
      steps.push({
        stepNumber: 1,
        action: "Perform primary interaction",
        expectedResult: "Target state is displayed correctly",
      });
    }

    return [
      {
        id: `tc-${Date.now()}-1`,
        requirementId: requirement.id,
        title: `Verify ${requirement.title}`,
        description: requirement.description,
        preconditions: [requirement.targetUrl ? `User navigates to ${requirement.targetUrl}` : "User opens the application"],
        steps,
        priority: "high",
        tags: ["smoke", "regression"],
      },
    ];
  }

  async generateBDD(testCases: TestCase[]): Promise<BDDFeature> {
    return {
      id: `feat-${Date.now()}`,
      title: "Feature Automation",
      tags: ["@automated"],
      scenarios: testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        tags: ["@automated"],
        steps: [
          { keyword: "Given" as const, text: tc.preconditions[0] || "application is ready" },
          { keyword: "When" as const, text: tc.steps[0]?.action || "action is performed" },
          { keyword: "Then" as const, text: tc.steps[0]?.expectedResult || "result is verified" },
        ],
      })),
    };
  }

  async repairLocator(failedSelector: string, _pageSnapshot: string): Promise<string> {
    return `[data-testid="repaired-${failedSelector.replace(/[^a-zA-Z0-9]/g, "")}"]`;
  }
}

export function getAIProvider(): IAIProvider {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();

  if (provider === "9router" || process.env.NINE_ROUTER_AUTH_TOKEN || process.env.NINE_ROUTER_BASE_URL) {
    return new NineRouterProvider();
  }

  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider(process.env.OPENAI_API_KEY, process.env.AI_MODEL || "gpt-4o");
  }

  if (provider === "gemini" && process.env.GEMINI_API_KEY) {
    return new GeminiProvider(process.env.GEMINI_API_KEY, process.env.AI_MODEL || "gemini-1.5-pro");
  }

  return new MockAIProvider();
}
