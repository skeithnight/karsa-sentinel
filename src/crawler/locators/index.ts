import type { LocatorCandidate } from "../../core/models/index.js";

export class LocatorGenerator {
  generateCandidates(element: {
    tag: string;
    id?: string;
    name?: string;
    text?: string;
    role?: string;
    testId?: string;
    placeholder?: string;
  }): LocatorCandidate[] {
    const candidates: LocatorCandidate[] = [];

    if (element.testId) {
      candidates.push({
        selector: `[data-testid="${element.testId}"]`,
        strategy: "test-id",
        confidence: 0.98,
        isResilient: true,
      });
    }

    if (element.role && element.name) {
      candidates.push({
        selector: `role=${element.role}[name="${element.name}"]`,
        strategy: "role",
        confidence: 0.95,
        isResilient: true,
      });
    }

    if (element.placeholder) {
      candidates.push({
        selector: `[placeholder="${element.placeholder}"]`,
        strategy: "placeholder",
        confidence: 0.85,
        isResilient: true,
      });
    }

    if (element.text && element.text.trim().length > 0 && element.text.length < 50) {
      candidates.push({
        selector: `text="${element.text.trim()}"`,
        strategy: "text",
        confidence: 0.8,
        isResilient: false,
      });
    }

    if (element.id) {
      candidates.push({
        selector: `#${element.id}`,
        strategy: "css",
        confidence: 0.75,
        isResilient: false,
      });
    }

    return candidates.sort((a, b) => b.confidence - a.confidence);
  }
}
