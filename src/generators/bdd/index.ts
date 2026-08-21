import type { BDDFeature, TestCase } from "../../core/models/index.js";

export class BDDGenerator {
  generateFeatureFromTestCases(featureTitle: string, testCases: TestCase[], targetUrl?: string): BDDFeature {
    return {
      id: `feat-${Date.now()}`,
      title: featureTitle,
      targetUrl,
      tags: ["@automated", "@karsa-sentinel"],
      scenarios: testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        tags: [`@priority-${tc.priority}`, ...tc.tags.map((t) => (t.startsWith("@") ? t : `@${t}`))],
        steps: [
          ...tc.preconditions.map((p) => ({
            keyword: "Given" as const,
            text: this.normalizeStepText(p),
          })),
          ...tc.steps.flatMap((step, i) => [
            {
              keyword: (i === 0 && tc.preconditions.length === 0 ? "Given" : "When") as "Given" | "When",
              text: this.normalizeStepText(step.action),
            },
            {
              keyword: "Then" as const,
              text: this.normalizeStepText(step.expectedResult),
            },
          ]),
        ],
      })),
    };
  }

  formatGherkin(feature: BDDFeature): string {
    const lines: string[] = [];
    if (feature.tags.length > 0) {
      lines.push(feature.tags.join(" "));
    }
    lines.push(`Feature: ${feature.title}`);
    if (feature.description) {
      lines.push(`  ${feature.description}`);
    }
    lines.push("");

    for (const scenario of feature.scenarios) {
      if (scenario.tags.length > 0) {
        lines.push(`  ${scenario.tags.join(" ")}`);
      }
      lines.push(`  Scenario: ${scenario.title}`);
      for (const step of scenario.steps) {
        const cleanText = this.normalizeStepText(step.text);
        lines.push(`    ${step.keyword} ${cleanText}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }

  private normalizeStepText(text: string): string {
    let clean = text.trim();
    // Normalize backticks to double quotes
    clean = clean.replace(/`([^`]+)`/g, '"$1"');
    // Wrap unquoted URLs in quotes for valid Cucumber Expressions
    clean = clean.replace(/(?<!["'])(https?:\/\/[^\s`'"]+)(?!["'])/g, '"$1"');
    return clean;
  }
}
