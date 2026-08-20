import { describe, it, expect } from "vitest";
import { NineRouterProvider } from "../../src/providers/nine-router/index.js";
import { getAIProvider } from "../../src/providers/router/index.js";

describe("AI Providers & 9Router Extraction", () => {
  it("should initialize NineRouterProvider with defaults", () => {
    const provider = new NineRouterProvider({
      baseUrl: "http://localhost:20218/v1",
      authToken: "sk-test",
      model: "mimo",
    });
    expect(provider.name).toBe("9router");
  });

  it("should parse JSON surrounded by thinking tags, conversational text, and code fences", () => {
    const provider = new NineRouterProvider();
    const raw = `
<think>Analyzing requirement and formulating test cases</think>
Here is the result you requested:
\`\`\`json
[
  {
    "id": "tc-1",
    "requirementId": "req-1",
    "title": "Valid Login",
    "description": "User logs in",
    "preconditions": [],
    "steps": [
      {
        "stepNumber": 1,
        "action": "Click submit",
        "expectedResult": "Dashboard displayed"
      }
    ],
    "priority": "high",
    "tags": ["smoke"]
  }
]
\`\`\`
Hope this helps!
`;

    const parsed = provider.extractJson<Array<{ id: string }>>(raw);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]?.id).toBe("tc-1");
  });

  it("should parse raw JSON array without codeblocks", () => {
    const provider = new NineRouterProvider();
    const raw = `[{"key": "value"}]`;
    const parsed = provider.extractJson<Array<{ key: string }>>(raw);
    expect(parsed[0]?.key).toBe("value");
  });

  it("should auto-detect 9Router provider from environment", () => {
    const provider = getAIProvider();
    expect(provider).toBeDefined();
    expect(["9router", "mock"]).toContain(provider.name);
  });
});
