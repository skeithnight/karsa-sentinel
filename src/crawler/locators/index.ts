import type { LocatorCandidate } from "../../core/models/index.js";

export interface DiscoveredElementInfo {
  tag: string;
  id?: string;
  name?: string;
  text?: string;
  role?: string;
  testId?: string;
  dataTest?: string;
  placeholder?: string;
  ariaLabel?: string;
  type?: string;
  className?: string;
}

export class LocatorGenerator {
  generateCandidates(element: DiscoveredElementInfo): LocatorCandidate[] {
    const candidates: LocatorCandidate[] = [];

    // 1. data-test (SauceDemo / Cypress / Playwright best practice)
    if (element.dataTest) {
      candidates.push({
        selector: `[data-test="${element.dataTest}"]`,
        strategy: "test-id",
        confidence: 0.99,
        isResilient: true,
      });
    }

    // 2. data-testid
    if (element.testId) {
      candidates.push({
        selector: `[data-testid="${element.testId}"]`,
        strategy: "test-id",
        confidence: 0.98,
        isResilient: true,
      });
    }

    // 3. getByRole with accessible name
    if (element.role && (element.name || element.ariaLabel || element.text)) {
      const accessibleName = element.ariaLabel || element.name || element.text;
      candidates.push({
        selector: `role=${element.role}[name="${accessibleName}"]`,
        strategy: "role",
        confidence: 0.95,
        isResilient: true,
      });
    }

    // 4. placeholder
    if (element.placeholder) {
      candidates.push({
        selector: `[placeholder="${element.placeholder}"]`,
        strategy: "placeholder",
        confidence: 0.88,
        isResilient: true,
      });
    }

    // 5. name attribute
    if (element.name) {
      candidates.push({
        selector: `[name="${element.name}"]`,
        strategy: "label",
        confidence: 0.85,
        isResilient: true,
      });
    }

    // 6. Semantic class names (error, alert, title, notification)
    if (element.className && (element.className.includes("error") || element.className.includes("title") || element.className.includes("alert") || element.className.includes("notification"))) {
      const firstClass = element.className.trim().split(/\s+/)[0];
      if (firstClass && !firstClass.match(/\d{5,}/)) {
        candidates.push({
          selector: `.${firstClass}`,
          strategy: "css",
          confidence: 0.86,
          isResilient: true,
        });
      }
    }

    // 7. Visible short text
    if (element.text && element.text.trim().length > 0 && element.text.length < 40) {
      candidates.push({
        selector: `text="${element.text.trim()}"`,
        strategy: "text",
        confidence: 0.8,
        isResilient: false,
      });
    }

    // 8. ID
    if (element.id && !element.id.startsWith("el-") && !element.id.match(/\d{5,}/)) {
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
