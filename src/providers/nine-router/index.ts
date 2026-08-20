import { logger } from "../../core/logger/index.js";
import { MockAIProvider } from "../router/index.js";
import type { IAIProvider } from "../../core/contracts/index.js";
import {
  type Requirement,
  type TestCase,
  type BDDFeature,
  RequirementSchema,
  TestCaseSchema,
  BDDFeatureSchema,
} from "../../core/schemas/index.js";

export interface NineRouterConfig {
  baseUrl?: string;
  authToken?: string;
  model?: string;
}

export class NineRouterProvider implements IAIProvider {
  public readonly name = "9router";
  private baseUrl: string;
  private authToken: string;
  private model: string;
  private fallback = new MockAIProvider();

  constructor(config: NineRouterConfig = {}) {
    this.baseUrl = config.baseUrl || process.env.NINE_ROUTER_BASE_URL || "http://localhost:20218/v1";
    this.authToken = config.authToken || process.env.NINE_ROUTER_AUTH_TOKEN || "";
    this.model = config.model || process.env.NINE_ROUTER_MODEL || "mimo";
  }

  private async callChatCompletion(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `${this.baseUrl.replace(/\/+$/, "")}/chat/completions`;
    logger.debug("9ROUTER:HTTP", `Sending POST to ${url} with model [${this.model}]`, {
      systemPromptLength: systemPrompt.length,
      userPromptLength: userPrompt.length,
      userPromptPreview: userPrompt.slice(0, 150),
    });

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    const startTime = Date.now();
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      }),
    });

    const durationMs = Date.now() - startTime;
    logger.debug("9ROUTER:HTTP", `Response status ${response.status} in ${durationMs}ms`);

    if (!response.ok) {
      const errText = await response.text();
      logger.debug("9ROUTER:HTTP_ERR", `API error response: ${errText}`);
      throw new Error(`9Router API error (${response.status}): ${errText}`);
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
    };

    if (data.usage) {
      logger.debug("9ROUTER:USAGE", `Tokens: ${data.usage.total_tokens} (prompt: ${data.usage.prompt_tokens}, completion: ${data.usage.completion_tokens})`);
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response returned from 9Router proxy");
    }

    logger.debug("9ROUTER:RAW_OUTPUT", `Received content (${content.length} chars):\n`, content.slice(0, 300));
    return content;
  }

  public extractJson<T>(raw: string): T {
    logger.debug("JSON:EXTRACT", `Attempting extraction on raw string length ${raw.length}`);

    // 1. Strip thinking / reasoning tags (<think>...</think>)
    let text = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // 2. Extract from markdown code fence if present
    const codeBlockMatch = /```(?:json)?\s*([\s\S]*?)(?:```|$)/i.exec(text);
    if (codeBlockMatch && codeBlockMatch[1]) {
      logger.debug("JSON:EXTRACT", "Found markdown code block fence, extracting inner block");
      text = codeBlockMatch[1].trim();
    }

    // 3. Find candidates for JSON array or object
    const candidates: string[] = [text];

    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(text.slice(firstBrace, lastBrace + 1));
    }

    const firstBracket = text.indexOf("[");
    const lastBracket = text.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket > firstBracket) {
      candidates.push(text.slice(firstBracket, lastBracket + 1));
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as T;
        logger.debug("JSON:EXTRACT_SUCCESS", "Successfully parsed JSON structure");
        return parsed;
      } catch {
        try {
          const cleanCommas = candidate.replace(/,\s*([}\]])/g, "$1");
          const parsed = JSON.parse(cleanCommas) as T;
          logger.debug("JSON:EXTRACT_SUCCESS", "Successfully parsed JSON after comma cleanup");
          return parsed;
        } catch {
          // continue candidate search
        }
      }
    }

    throw new Error(`Unable to extract valid JSON from LLM response: ${raw.slice(0, 150)}...`);
  }

  async generateRequirements(content: string): Promise<Requirement> {
    logger.debug("AI:REQUIREMENTS", `Generating requirements from document content (${content.length} chars)`);
    try {
      const systemPrompt = `You are a strict JSON generator. Do NOT output conversational prose, markdown tables, or greetings.
Return ONLY valid JSON matching this schema:
{
  "id": "req-1",
  "title": "Feature Title",
  "description": "Short overview description",
  "targetUrl": "https://example.com/login",
  "scenarios": ["Scenario 1 description", "Scenario 2 description"],
  "tags": ["tag1", "tag2"],
  "createdAt": "2026-08-20T00:00:00.000Z"
}`;

      const raw = await this.callChatCompletion(systemPrompt, `Document content:\n${content}\n\nCRITICAL: Respond ONLY with the JSON object.`);
      const parsed = this.extractJson<Requirement>(raw);
      if (!parsed.id) parsed.id = `req-${Date.now()}`;
      if (!parsed.createdAt) parsed.createdAt = new Date().toISOString();
      return RequirementSchema.parse(parsed);
    } catch (err) {
      logger.warn(`9Router requirement extraction note: ${err instanceof Error ? err.message : String(err)}`);
      return this.fallback.generateRequirements(content);
    }
  }

  async generateTestCases(requirement: Requirement): Promise<TestCase[]> {
    logger.debug("AI:TEST_CASES", `Generating test cases for requirement: ${requirement.title}`);
    try {
      const systemPrompt = `You are a strict JSON generator. Do NOT output conversational prose, greetings, or markdown explanations.
Return ONLY a valid JSON array of test cases matching this schema:
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

      const raw = await this.callChatCompletion(systemPrompt, `Requirement:\n${JSON.stringify(requirement, null, 2)}\n\nCRITICAL: Output ONLY the JSON array.`);
      const parsed = this.extractJson<TestCase[] | { testCases: TestCase[] }>(raw);
      const testCases = Array.isArray(parsed) ? parsed : (parsed.testCases || []);
      
      if (!testCases.length) {
        return this.fallback.generateTestCases(requirement);
      }

      logger.debug("AI:TEST_CASES", `Parsed ${testCases.length} test cases from AI response`);
      return testCases.map((tc) => TestCaseSchema.parse(tc));
    } catch (err) {
      logger.warn(`9Router test case note: ${err instanceof Error ? err.message : String(err)}`);
      return this.fallback.generateTestCases(requirement);
    }
  }

  async generateBDD(testCases: TestCase[]): Promise<BDDFeature> {
    logger.debug("AI:BDD", `Converting ${testCases.length} test cases to BDD feature`);
    try {
      const systemPrompt = `You are a strict JSON generator. Do NOT output conversational prose, greetings, or markdown explanations.
Return ONLY a valid JSON object matching this BDDFeature schema:
{
  "id": "feature-1",
  "title": "Feature Title",
  "description": "Feature description",
  "targetUrl": "https://example.com/login",
  "scenarios": [
    {
      "id": "scenario-1",
      "title": "Scenario Title",
      "type": "scenario",
      "tags": ["smoke"],
      "steps": [
        { "keyword": "Given", "text": "user navigates to https://example.com/login" },
        { "keyword": "When", "text": "user enters credentials" },
        { "keyword": "Then", "text": "dashboard is displayed" }
      ]
    }
  ],
  "tags": ["smoke"]
}`;

      const raw = await this.callChatCompletion(systemPrompt, `Test Cases:\n${JSON.stringify(testCases, null, 2)}\n\nCRITICAL: Output ONLY the JSON object.`);
      const parsed = this.extractJson<BDDFeature>(raw);
      if (!parsed.id) parsed.id = `feature-${Date.now()}`;
      return BDDFeatureSchema.parse(parsed);
    } catch (err) {
      logger.warn(`9Router BDD note: ${err instanceof Error ? err.message : String(err)}`);
      return this.fallback.generateBDD(testCases);
    }
  }

  async repairLocator(failedSelector: string, failureContext: string): Promise<string> {
    logger.debug("AI:REPAIR", `Attempting locator repair for [${failedSelector}]`);
    try {
      const systemPrompt = `You are a strict locator repair engine. Propose a single resilient CSS or Playwright selector to replace a broken selector.
Respond ONLY with the fixed selector string without quotation marks, markdown, or explanation.`;

      const userPrompt = `Failed Selector: ${failedSelector}\nFailure Context / Page Snapshot:\n${failureContext.slice(0, 1500)}`;
      const raw = await this.callChatCompletion(systemPrompt, userPrompt);
      const repaired = raw.trim().replace(/^["'`]|["'`]$/g, "").split("\n")[0].trim();
      logger.debug("AI:REPAIR", `Repaired selector: ${repaired}`);
      return repaired || failedSelector;
    } catch (err) {
      logger.warn(`9Router repair note: ${err instanceof Error ? err.message : String(err)}`);
      return this.fallback.repairLocator(failedSelector, failureContext);
    }
  }
}
