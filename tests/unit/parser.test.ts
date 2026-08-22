import { describe, it, expect } from "vitest";
import { MarkdownRequirementParser } from "../../src/documents/markdown/index.js";
import { DocumentParserRegistry } from "../../src/documents/parser/index.js";

describe("Document Parsers", () => {
  it("should extract requirement structure from markdown content", async () => {
    const parser = new MarkdownRequirementParser();
    const markdown = `
# Feature: User Authentication
https://example.com/login

Overview description for login.

### Scenario 1: Valid Login
- Given user on login
- When user enters credentials
- Then dashboard displays
`;

    const requirement = await parser.parse("login.md", markdown);
    expect(requirement.title).toBe("User Authentication");
    expect(requirement.targetUrl).toBe("https://example.com/login");
    expect(requirement.scenarios.length).toBe(1);
    expect(requirement.tags).toContain("markdown-import");
  });

  it("should parse via DocumentParserRegistry", async () => {
    const registry = new DocumentParserRegistry();
    const req = await registry.parseFile("docs/examples/login.md");
    expect(req.title).toContain("Authentication");
    expect(req.scenarios.length).toBeGreaterThan(0);
  });
});
