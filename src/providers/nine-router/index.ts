import type { IAIProvider } from "../../core/contracts/index.js";
import {
  type BDDFeature,
  type Requirement,
  type TestCase,
  RequirementSchema,
  TestCaseSchema,
  BDDFeatureSchema,
} from "../../core/models/index.js";
import { MockAIProvider } from "../router/index.js";

export interface NineRouterConfig {
  baseUrl?: string;
  authToken?: string;
  model?: string;
}

export class NineRouterProvider implements IAIProvider {
  name = "9router";
  private baseUrl: string;
  private authToken?: string;
  private model: string;
  private fallback = new MockAIProvider();

  constructor(config: NineRouterConfig = {}) {
    this.baseUrl = (config.baseUrl || process.env.NINE_ROUTER_BASE_URL || "http://localhost:20218/v1").replace(/\/+$/, "");
    this.authToken = config.authToken || process.env.NINE_ROUTER_AUTH_TOKEN;
    this.model = config.model || process.env.NINE_ROUTER_MODEL || "mimo";
  }

  private async callChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.baseUrl}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: `${systemPrompt}\n\nIMPORTANT: Return ONLY valid, parseable raw JSON.` },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`9Router API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response returned from 9Router proxy");
    }

    return content;
  }

  public extractJson<T>(raw: string): T {
    // 1. Strip thinking / reasoning tags (<think>...</think>)
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Extract from markdown code fence if present
    const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)(?:```|$)/i.exec(text);
    if (codeBlockMatch && codeBlockMatch[1]) {
      text = codeBlockMatch[1].trim();
    }

    // 3. Find first outer JSON array or object
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");

    if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
      const lastBracket = text.lastIndexOf("]");
      if (lastBracket !== -1 && lastBracket > firstBracket) {
        text = text.slice(firstBracket, lastBracket + 1);
      }
    } else if (firstBrace !== -1) {
      const lastBrace = text.lastIndexOf("}");
      if (lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.slice(firstBrace, lastBrace + 1);
      }
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      // 4. Strip trailing commas and retry
      const cleanCommas = text.replace(/,\s*([}\]])/g, "$1");
      return JSON.parse(cleanCommas) as T;
    }
  }

  async generateRequirements(content: string): Promise<Requirement> {
    try {
      const systemPrompt = `You are an AI QA Engineer. Extract structured test requirement intent from the document.
Output MUST be strict JSON matching this schema:
{
  "id": "req-1",
  "title": "Feature Title",
  "description": "Short overview description",
  "targetUrl": "https://example.com/login",
  "scenarios": ["Scenario 1 description", "Scenario 2 description"],
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-08-20T00:00:00.000Z"
}`;

      const raw = await this.callChatCompletion(systemPrompt, `Document content:\n${content}`);
      const parsed = this.extractJson<Requirement>(raw);
      if (!parsed.id) parsed.id = `req-${Date.now()}`;
      if (!parsed.createdAt) parsed.createdAt = new Date().toISOString();
      return RequirementSchema.parse(parsed);
    } catch (err) {
      console.warn("9Router requirement extraction note:", err instanceof Error ? err.message : String(err));
      return this.fallback.generateRequirements(content);
    }
  }

  async generateTestCases(requirement: Requirement): Promise<TestCase[]> {
    try {
      const systemPrompt = `You are a Senior Test Automation Architect. Design comprehensive test cases for this requirement.
Output MUST be a JSON array:
[
  {
    "id": "tc-1",
    "requirementId": "${requirement.id}",
    "title": "User logs in with valid credentials",
    "description": "Ensure successful login with valid credentials",
    "preconditions": ["User navigates to login page"],
    "steps": [
      {
        "stepNumber": 1,
        "action": "User enters username and password and clicks submit",
        "expectedResult": "User is redirected to dashboard"
      }
    ],
    "priority": "high",
    "tags": ["smoke", "auth"]
  }
]`;

      const raw = await this.callChatCompletion(systemPrompt, `Requirement:\n${JSON.stringify(requirement, null, 2)}`);
      const parsed = this.extractJson<TestCase[] | { testCases: TestCase[] }>(raw);
      const testCases = Array.isArray(parsed) ? parsed : (parsed.testCases || []);
      
      if (!testCases.length) {
        return this.fallback.generateTestCases(requirement);
      }

      return testCases.map((tc, idx) => {
        if (!tc.id) tc.id = `tc-${requirement.id}-${idx + 1}`;
        if (!tc.requirementId) tc.requirementId = requirement.id;
        return TestCaseSchema.parse(tc);
      });
    } catch (err) {
      console.warn("9Router test case note:", err instanceof Error ? err.message : String(err));
      return this.fallback.generateTestCases(requirement);
    }
  }

  async generateBDD(testCases: TestCase[]): Promise<BDDFeature> {
    try {
      const systemPrompt = `You are a BDD Gherkin Expert. Convert test cases into a structured BDD feature.
Output MUST be strict JSON matching this schema:
{
  "id": "feat-1",
  "title": "Feature Title",
  "description": "Feature description",
  "tags": ["@automated", "@smoke"],
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "Scenario title",
      "tags": ["@smoke"],
      "steps": [
        { "keyword": "Given", "text": "user is on login page" },
        { "keyword": "When", "text": "user enters valid credentials" },
        { "keyword": "Then", "text": "user dashboard is displayed" }
      ]
    }
  ]
}`;

      const raw = await this.callChatCompletion(systemPrompt, `Test Cases:\n${JSON.stringify(testCases, null, 2)}`);
      const parsed = this.extractJson<BDDFeature>(raw);
      if (!parsed.id) parsed.id = `feat-${Date.now()}`;
      if (!parsed.scenarios || !Array.isArray(parsed.scenarios)) {
        return this.fallback.generateBDD(testCases);
      }
      return BDDFeatureSchema.parse(parsed);
    } catch (err) {
      console.warn("9Router BDD note:", err instanceof Error ? err.message : String(err));
      return this.fallback.generateBDD(testCases);
    }
  }

  async repairLocator(failedSelector: string, pageSnapshot: string): Promise<string> {
    try {
      const systemPrompt = `You are a Playwright Locator Specialist. Suggest a resilient locator (role, text, test-id, or CSS) for the failing element given the page snapshot.
Return only the repaired locator string.`;

      const raw = await this.callChatCompletion(systemPrompt, `Failing Locator: ${failedSelector}\n\nPage Snapshot:\n${pageSnapshot}`);
      return raw.trim().replace(/^['"`]|['"`]$/g, "");
    } catch {
      return this.fallback.repairLocator(failedSelector, pageSnapshot);
    }
  }
}
