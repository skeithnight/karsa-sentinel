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

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ") && title === "Untitled Requirement") {
        title = trimmed.replace(/^#\s+/, "").replace(/^Feature:\s*/i, "").trim();
      } else if (trimmed.startsWith("`http://") || trimmed.startsWith("`https://")) {
        targetUrl = trimmed.replace(/`/g, "").trim();
      } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        targetUrl = trimmed;
      } else if (trimmed.startsWith("### Scenario") || trimmed.startsWith("## Scenario")) {
        scenarios.push(trimmed.replace(/^#+\s+/, "").trim());
      } else if (trimmed.length > 0 && !trimmed.startsWith("#")) {
        descriptionLines.push(trimmed);
      }
    }

    const requirementData = {
      id: `req-${Date.now()}`,
      title,
      description: descriptionLines.slice(0, 5).join(" "),
      targetUrl: targetUrl && targetUrl.startsWith("http") ? targetUrl : undefined,
      scenarios,
      tags: ["markdown-import", "phase-1"],
      createdAt: new Date().toISOString(),
    };

    return RequirementSchema.parse(requirementData);
  }
}
