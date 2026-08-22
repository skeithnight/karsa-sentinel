import type { IDocumentParser } from "../../core/contracts/index.js";
import { type Requirement, RequirementSchema } from "../../core/models/index.js";

export class MarkdownRequirementParser implements IDocumentParser {
  supports(filePath: string): boolean {
    return filePath.endsWith(".md") || filePath.endsWith(".markdown");
  }

  async parse(filePath: string, content: string): Promise<Requirement> {
    const lines = content.split("\n");
    let title = "Untitled Requirement";
    let targetUrl: string | undefined;
    const scenarios: string[] = [];
    const descriptionLines: string[] = [];

    // Extract URL from anywhere in the document if not found yet
    const urlRegex = /(https?:\/\/[^\s`'"\)]+)/i;
    const globalUrlMatch = content.match(urlRegex);
    if (globalUrlMatch) {
      targetUrl = globalUrlMatch[1];
    }

    let currentScenarioLines: string[] = [];

    const flushScenario = () => {
      if (currentScenarioLines.length > 0) {
        scenarios.push(currentScenarioLines.join("\n"));
        currentScenarioLines = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Extract Title from top-level heading
      if ((trimmed.startsWith("# ") || trimmed.startsWith("Feature:")) && title === "Untitled Requirement") {
        title = trimmed.replace(/^#\s+/, "").replace(/^Feature:\s*/i, "").trim();
      }
      // Extract Scenarios from sub-headings or scenario bullet lists
      else if (trimmed.match(/^#{2,4}\s+(Scenario\s*\d*:?|Scenario\b|Verify\b|Test\s*\d*:?|User should|Should\b)/i)) {
        flushScenario();
        currentScenarioLines.push(trimmed.replace(/^#+\s+/, "").trim());
      } else if (trimmed.match(/^-\s+(Scenario\s*\d*:?|Scenario\b)/i)) {
        flushScenario();
        currentScenarioLines.push(trimmed.replace(/^-\s+/, "").trim());
      } else if (currentScenarioLines.length > 0 && trimmed.match(/^[-*]\s+(\*\*)?(Given|When|Then|And|But)\b/i)) {
        // Step under the current scenario
        currentScenarioLines.push(trimmed);
      }
      // Description text
      else if (!trimmed.startsWith("#") && !trimmed.startsWith("http") && currentScenarioLines.length === 0) {
        descriptionLines.push(trimmed);
      }
    }
    flushScenario();

    const requirementData = {
      id: `req-${Date.now()}`,
      title,
      description: descriptionLines.slice(0, 5).join(" ") || `Requirement for ${title}`,
      targetUrl: targetUrl && targetUrl.startsWith("http") ? targetUrl : undefined,
      scenarios,
      tags: ["markdown-import", "v0.4.1"],
      createdAt: new Date().toISOString(),
    };

    return RequirementSchema.parse(requirementData);
  }
}
