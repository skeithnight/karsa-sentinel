import { describe, it, expect } from "vitest";
import { RequirementSchema, TestCaseSchema, LocatorCandidateSchema } from "../../src/core/schemas/index.js";

describe("Core Zod Schemas", () => {
  it("should validate a valid Requirement object", () => {
    const valid = {
      id: "req-1",
      title: "Login Flow",
      description: "Allow users to authenticate",
      targetUrl: "https://example.com/login",
      scenarios: ["Valid Login"],
      tags: ["auth"],
      createdAt: new Date().toISOString(),
    };

    const parsed = RequirementSchema.parse(valid);
    expect(parsed.id).toBe("req-1");
  });

  it("should reject invalid TestCase missing step fields", () => {
    const invalid = {
      id: "tc-1",
      requirementId: "req-1",
      title: "Test 1",
      description: "Test description",
      steps: [{ action: "click" }], // missing stepNumber and expectedResult
    };

    expect(() => TestCaseSchema.parse(invalid)).toThrow();
  });

  it("should rank locator candidate confidence properly", () => {
    const loc = LocatorCandidateSchema.parse({
      selector: `[data-testid="submit-btn"]`,
      strategy: "test-id",
      confidence: 0.95,
      isResilient: true,
    });
    expect(loc.confidence).toBe(0.95);
  });
});
