import type { BDDStep, UIElement, AutomationAction } from "../../core/schemas/index.js";
import { logger } from "../../core/logger/index.js";

/**
 * ActionResolver bridges the gap between semantic BDD steps and concrete
 * Playwright locators by matching step intent against discovered UI evidence.
 *
 * Pipeline: BDDStep → semantic parse → UIElement match → AutomationAction
 */
export class ActionResolver {
  /**
   * Resolve a single BDD step into a concrete AutomationAction
   * using the provided UI evidence for locator resolution.
   */
  resolve(step: BDDStep, uiEvidence: UIElement[], targetUrl?: string): AutomationAction {
    const text = step.text.toLowerCase();

    // ── Navigate ────────────────────────────────────────────────────────
    if (step.keyword === "Given" && (text.includes("navigates to") || text.includes("opens") || text.includes("visits"))) {
      const urlMatch = step.text.match(/(https?:\/\/[^\s`'"]+)/);
      return {
        type: "navigate",
        value: urlMatch ? urlMatch[1] : targetUrl || "/",
        comment: `${step.keyword} ${step.text}`,
      };
    }

    // ── Fill / Enter / Type ─────────────────────────────────────────────
    if (text.includes("enter") || text.includes("type") || text.includes("fill") || text.includes("input")) {
      const { noun, value } = this.parseActionAndValue(step.text);
      const element = this.findBestMatch(noun, uiEvidence, ["input", "textarea"]);

      return {
        type: "fill",
        target: {
          semantic: noun,
          locator: element?.locators[0]?.selector,
          strategy: element?.locators[0]?.strategy,
        },
        value: value || "",
        comment: `${step.keyword} ${step.text}`,
      };
    }

    // ── Click / Press / Submit ──────────────────────────────────────────
    if (text.includes("click") || text.includes("press") || text.includes("submit") || text.includes("tap")) {
      const noun = this.extractTargetNoun(step.text);
      const element = this.findBestMatch(noun, uiEvidence, ["button", "a", "input"]);

      return {
        type: "click",
        target: {
          semantic: noun,
          locator: element?.locators[0]?.selector,
          strategy: element?.locators[0]?.strategy,
        },
        comment: `${step.keyword} ${step.text}`,
      };
    }

    // ── Assert URL / Redirect ───────────────────────────────────────────
    if (text.includes("redirect") || text.includes("url") || (text.includes("navigated") && text.includes("to"))) {
      const urlMatch = step.text.match(/[`'"]?([/a-zA-Z0-9._-]+\.html?)[`'"]?/) || step.text.match(/(\/\w+)/);
      return {
        type: "assert_url",
        expected: urlMatch ? urlMatch[1] : ".*",
        comment: `${step.keyword} ${step.text}`,
      };
    }

    // ── Assert Text Content ─────────────────────────────────────────────
    if (text.includes("display") || text.includes("show") || text.includes("contain") || text.includes("title") || text.includes("header") || text.includes("error")) {
      const quotedMatch = step.text.match(/['"`]([^'"`]+)['"`]/);
      const noun = this.extractTargetNoun(step.text);
      const element = this.findBestMatch(noun, uiEvidence, ["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article"]);

      if (quotedMatch) {
        return {
          type: "assert_text",
          target: element?.tag !== "input" && element?.locators[0] ? {
            semantic: noun,
            locator: element.locators[0].selector,
            strategy: element.locators[0].strategy,
          } : undefined,
          expected: quotedMatch[1],
          comment: `${step.keyword} ${step.text}`,
        };
      }

      if (element && element.tag !== "input") {
        return {
          type: "assert_visible",
          target: {
            semantic: noun,
            locator: element.locators[0]?.selector,
            strategy: element.locators[0]?.strategy,
          },
          comment: `${step.keyword} ${step.text}`,
        };
      }
    }

    // ── Fallback: wait ──────────────────────────────────────────────────
    return {
      type: "wait",
      comment: `${step.keyword} ${step.text}`,
    };
  }

  /**
   * Resolve all steps for a scenario into AutomationAction[]
   */
  resolveScenario(steps: BDDStep[], uiEvidence: UIElement[], targetUrl?: string): AutomationAction[] {
    return steps.map((step) => this.resolve(step, uiEvidence, targetUrl));
  }

  // ── Private helpers ─────────────────────────────────────────────────

  /**
   * Extract the target noun from a step text.
   * e.g. "user clicks the Login button" → "login button"
   * e.g. "error message is displayed" → "error message"
   */
  private extractTargetNoun(text: string): string {
    let cleaned = text
      .replace(/^(given|when|then|and|but)\s+/i, "")
      .replace(/\b(user|the|a|an|is|are|was|were|should|must|will|be|been|being)\b/gi, "")
      .replace(/\b(navigates?|enters?|types?|fills?|clicks?|presses?|submits?|taps?|displays?|shows?|contains?|redirected?|opens?|visits?)\b/gi, "")
      .replace(/\b(to|on|in|at|into|from|with|for|of)\b/gi, "")
      .trim();

    // Remove quoted values
    cleaned = cleaned.replace(/['"`][^'"`]*['"`]/g, "").trim();
    // Collapse whitespace
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned || "element";
  }

  /**
   * Parse "enters username `standard_user`" → { noun: "username", value: "standard_user" }
   */
  private parseActionAndValue(text: string): { noun: string; value?: string } {
    const valueMatch = text.match(/[`'"]([^`'"]+)[`'"]/);
    const value = valueMatch ? valueMatch[1] : undefined;

    const noun = this.extractTargetNoun(text);
    return { noun, value };
  }

  /**
   * Find the best matching UIElement for a semantic noun.
   * Uses fuzzy matching against element name, role, text, and attributes.
   */
  private findBestMatch(noun: string, uiEvidence: UIElement[], preferredTags?: string[]): UIElement | undefined {
    if (!uiEvidence.length || !noun || noun === "element") return undefined;

    const nounLower = noun.toLowerCase().replace(/\s+/g, "");
    const nounWords = noun.toLowerCase().split(/\s+/).filter(Boolean);

    let bestMatch: UIElement | undefined;
    let bestScore = 0;

    for (const el of uiEvidence) {
      let score = 0;
      let hasDirectMatch = false;

      // Match against name
      if (el.name) {
        const nameLower = el.name.toLowerCase().replace(/[-_]/g, "");
        if (nameLower === nounLower) { score += 10; hasDirectMatch = true; }
        else if (nameLower.includes(nounLower) || nounLower.includes(nameLower)) { score += 7; hasDirectMatch = true; }
        else if (nounWords.some((w) => nameLower.includes(w))) { score += 4; hasDirectMatch = true; }
      }

      // Match against role
      if (el.role) {
        const roleLower = el.role.toLowerCase();
        if (nounWords.some((w) => roleLower.includes(w))) { score += 3; hasDirectMatch = true; }
      }

      // Match against text content
      if (el.text) {
        const textLower = el.text.toLowerCase();
        if (nounWords.some((w) => textLower.includes(w))) { score += 3; hasDirectMatch = true; }
      }

      // Match against attributes (data-test, placeholder, aria-label, class, etc.)
      for (const [key, val] of Object.entries(el.attributes)) {
        const valLower = val.toLowerCase().replace(/[-_]/g, "");
        if (valLower.includes(nounLower) || nounLower.includes(valLower)) { score += 5; hasDirectMatch = true; }
        else if (nounWords.some((w) => valLower.includes(w))) { score += 3; hasDirectMatch = true; }
      }

      // Only give tag and locator bonuses if there was actual semantic overlap
      if (hasDirectMatch) {
        if (preferredTags && preferredTags.includes(el.tag)) {
          score += 2;
        }
        if (el.locators.length > 0 && el.locators[0].confidence > 0.9) {
          score += 1;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = el;
      }
    }

    if (bestMatch && bestScore >= 4) {
      logger.debug("RESOLVER:MATCH", `"${noun}" → ${bestMatch.name || bestMatch.tag} [${bestMatch.locators[0]?.selector}] (score: ${bestScore})`);
      return bestMatch;
    }

    logger.debug("RESOLVER:NO_MATCH", `No high-confidence UI evidence match for "${noun}" (bestScore: ${bestScore})`);
    return undefined;
  }
}
