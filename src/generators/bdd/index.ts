import type { BDDFeature, TestCase } from "../../core/models/index.js";

export class BDDGenerator {
  generateFeatureFromTestCases(featureTitle: string, testCases: TestCase[]): BDDFeature {
    return {
      id: `feat-${Date.now()}`,
      title: featureTitle,
      tags: ["@automated", "@karsa-sentinel"],
      scenarios: testCases.map((tc) => ({
        id: tc.id,
        title: tc.title,
        tags: [`@priority-${tc.priority}`, ...tc.tags.map((t) => (t.startsWith("@") ? t : `@${t}`))],
        steps: [
          ...tc.preconditions.map((p) => ({
            keyword: "Given" as const,
            text: p,
          })),
          ...tc.steps.flatMap((step, i) => [
            {
              keyword: (i === 0 && tc.preconditions.length === 0 ? "Given" : "When") as "Given" | "When",
              text: step.action,
            },
            {
              keyword: "Then" as const,
              text: step.expectedResult,
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
        lines.push(`    ${step.keyword} ${step.text}`);
      }
      lines.push("");
    }

    return lines.join("\n");
  }
}
