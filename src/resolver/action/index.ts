import type { BDDStep, UIElement, AutomationAction, ResolutionResult } from "../../core/schemas/index.js";
import { logger } from "../../core/logger/index.js";

export interface MatchCandidate {
  element: UIElement;
  score: number;
  reasons: string[];
}

export interface MatchResult {
  element?: UIElement;
  score: number;
  confidence: number;
  status: "resolved" | "ambiguous" | "unresolved";
  reasons: string[];
  candidates: MatchCandidate[];
}

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
    if (step.keyword === "Given" && (text.includes("navigates to") || text.includes("opens") || text.includes("visits") || text.includes("on the") || text.includes("is on"))) {
      const urlMatch = step.text.match(/(https?:\/\/[^\s`'"]+)/);
      return {
        type: "navigate",
        value: urlMatch ? urlMatch[1] : targetUrl || "/",
        comment: `${step.keyword} ${step.text}`,
        resolution: {
          status: "resolved",
          confidence: 1.0,
          reasons: ["Target URL navigation intent identified"],
        },
      };
    }

    // ── Click / Press / Submit / Tap ───────────────────────────────────
    if (text.includes("click") || text.includes("press") || text.includes("submit") || text.includes("tap")) {
      const noun = this.extractTargetNoun(step.text);
      const match = this.findBestMatch(noun, uiEvidence, ["button", "a", "input"], step.text);

      const actionResolution: ResolutionResult = {
        status: match.status,
        confidence: match.confidence,
        reasons: match.reasons,
        elementId: match.element?.id,
      };

      return {
        type: "click",
        target: {
          semantic: noun,
          locator: match.element?.locators[0]?.selector,
          strategy: match.element?.locators[0]?.strategy,
        },
        comment: `${step.keyword} ${step.text}`,
        resolution: actionResolution,
      };
    }

    // ── Fill / Enter / Type ─────────────────────────────────────────────
    if (text.includes("enter") || text.includes("type") || (text.includes("fill") && !text.includes("is filled"))) {
      const { noun, value } = this.parseActionAndValue(step.text);
      const match = this.findBestMatch(noun, uiEvidence, ["input", "textarea"], step.text);

      const actionResolution: ResolutionResult = {
        status: match.status,
        confidence: match.confidence,
        reasons: match.reasons,
        elementId: match.element?.id,
      };

      return {
        type: "fill",
        target: {
          semantic: noun,
          locator: match.element?.locators[0]?.selector,
          strategy: match.element?.locators[0]?.strategy,
        },
        value: value || "",
        comment: `${step.keyword} ${step.text}`,
        resolution: actionResolution,
      };
    }

    // ── Assert URL / Redirect ───────────────────────────────────────────
    if (text.includes("redirect") || text.includes("url") || (text.includes("navigated") && text.includes("to"))) {
      const urlMatch = step.text.match(/[`'"]?([/a-zA-Z0-9._-]+\.html?)[`'"]?/) || step.text.match(/(\/\w+)/);
      return {
        type: "assert_url",
        expected: urlMatch ? urlMatch[1] : ".*",
        comment: `${step.keyword} ${step.text}`,
        resolution: {
          status: "resolved",
          confidence: 0.95,
          reasons: ["URL redirection assertion identified"],
        },
      };
    }

    // ── Assert Text Content / Visibility ────────────────────────────────
    if (text.includes("display") || text.includes("show") || text.includes("contain") || text.includes("title") || text.includes("header") || text.includes("error")) {
      const quotedMatch = step.text.match(/['"`]([^'"`]+)['"`]/);
      const noun = this.extractTargetNoun(step.text);
      const match = this.findBestMatch(noun, uiEvidence, ["div", "span", "p", "h1", "h2", "h3", "h4", "h5", "h6", "section", "article"]);

      if (quotedMatch) {
        return {
          type: "assert_text",
          target: match.element?.tag !== "input" && match.element?.locators[0] ? {
            semantic: noun,
            locator: match.element.locators[0].selector,
            strategy: match.element.locators[0].strategy,
          } : undefined,
          expected: quotedMatch[1],
          comment: `${step.keyword} ${step.text}`,
          resolution: {
            status: "resolved",
            confidence: match.element ? match.confidence : 0.9,
            reasons: match.reasons.length > 0 ? match.reasons : ["Text assertion against page content"],
            elementId: match.element?.id,
          },
        };
      }

      if (match.element && match.element.tag !== "input") {
        return {
          type: "assert_visible",
          target: {
            semantic: noun,
            locator: match.element.locators[0]?.selector,
            strategy: match.element.locators[0]?.strategy,
          },
          comment: `${step.keyword} ${step.text}`,
          resolution: {
            status: match.status,
            confidence: match.confidence,
            reasons: match.reasons,
            elementId: match.element.id,
          },
        };
      }
    }

    // ── Explicit Wait Intent ────────────────────────────────────────────
    if (text.includes("wait") || text.includes("pause") || text.includes("sleep")) {
      return {
        type: "wait",
        comment: `${step.keyword} ${step.text}`,
        resolution: {
          status: "resolved",
          confidence: 0.9,
          reasons: ["Explicit wait action recognized"],
        },
      };
    }

    // ── Honest Failure: Unresolved Step ─────────────────────────────────
    logger.warn(`ActionResolver: Step could not be resolved against UI evidence: "${step.keyword} ${step.text}"`);
    return {
      type: "unresolved",
      comment: `${step.keyword} ${step.text}`,
      resolution: {
        status: "unresolved",
        confidence: 0.0,
        reasons: ["No matching semantic action or UI evidence found"],
      },
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
   * Returns a comprehensive MatchResult with candidates, score, and confidence.
   */
  findBestMatch(noun: string, uiEvidence: UIElement[], preferredTags?: string[], stepText?: string): MatchResult {
    if (!uiEvidence.length || !noun || noun === "element") {
      return {
        score: 0,
        confidence: 0,
        status: "unresolved",
        reasons: ["No UI evidence or target noun provided"],
        candidates: [],
      };
    }

    const nounLower = noun.toLowerCase().replace(/\s+/g, "");
    const nounWords = noun.toLowerCase().split(/\s+/).filter(Boolean);
    const quotedTokens = (stepText || "")
      .match(/['"`]([^'"`]+)['"`]/g)
      ?.map((t) => t.slice(1, -1).toLowerCase().replace(/[-_]/g, "")) || [];

    const candidates: MatchCandidate[] = [];

    for (const el of uiEvidence) {
      let score = 0;
      const reasons: string[] = [];
      let hasDirectMatch = false;

      // Quoted token exact match (from step definition)
      if (el.name) {
        const nameLower = el.name.toLowerCase().replace(/[-_]/g, "");
        if (quotedTokens.includes(nameLower)) {
          score += 15;
          reasons.push(`Quoted token match on name: "${el.name}"`);
          hasDirectMatch = true;
        }
      }
      for (const [key, val] of Object.entries(el.attributes)) {
        const valLower = val.toLowerCase().replace(/[-_]/g, "");
        if (quotedTokens.includes(valLower)) {
          score += 15;
          reasons.push(`Quoted token match on [${key}="${val}"]`);
          hasDirectMatch = true;
        }
      }

      // Match against name
      if (el.name) {
        const nameLower = el.name.toLowerCase().replace(/[-_]/g, "");
        if (nameLower === nounLower) {
          score += 10;
          reasons.push(`Exact name match: "${el.name}"`);
          hasDirectMatch = true;
        } else if (nameLower.includes(nounLower) || nounLower.includes(nameLower)) {
          score += 7;
          reasons.push(`Sub-string name match: "${el.name}"`);
          hasDirectMatch = true;
        } else if (nounWords.some((w) => nameLower.includes(w))) {
          score += 4;
          reasons.push(`Word overlap with name: "${el.name}"`);
          hasDirectMatch = true;
        }
      }

      // Match against role
      if (el.role) {
        const roleLower = el.role.toLowerCase();
        if (nounWords.some((w) => roleLower.includes(w))) {
          score += 3;
          reasons.push(`Role match: "${el.role}"`);
          hasDirectMatch = true;
        }
      }

      // Match against text content
      if (el.text) {
        const textLower = el.text.toLowerCase();
        if (nounWords.some((w) => textLower.includes(w))) {
          score += 3;
          reasons.push(`Text content match: "${el.text.slice(0, 30)}"`);
          hasDirectMatch = true;
        }
      }

      // Match against attributes (data-test, placeholder, aria-label, class, etc.)
      for (const [key, val] of Object.entries(el.attributes)) {
        const valLower = val.toLowerCase().replace(/[-_]/g, "");
        if (valLower.includes(nounLower) || nounLower.includes(valLower)) {
          score += 5;
          reasons.push(`Attribute match on [${key}="${val}"]`);
          hasDirectMatch = true;
        } else if (nounWords.some((w) => valLower.includes(w))) {
          score += 3;
          reasons.push(`Word overlap on attribute [${key}="${val}"]`);
          hasDirectMatch = true;
        }
      }

      // Only give tag and locator bonuses if there was actual semantic overlap
      if (hasDirectMatch) {
        if (preferredTags && preferredTags.includes(el.tag)) {
          score += 2;
          reasons.push(`Preferred tag match: <${el.tag}>`);
        }
        if (el.locators.length > 0 && el.locators[0].confidence > 0.9) {
          score += 1;
          reasons.push(`High confidence locator: ${el.locators[0].selector}`);
        }
      }

      if (score > 0) {
        candidates.push({ element: el, score, reasons });
      }
    }

    // Sort candidates descending by score
    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length === 0 || candidates[0].score < 4) {
      logger.debug("RESOLVER:NO_MATCH", `No high-confidence UI evidence match for "${noun}" (bestScore: ${candidates[0]?.score || 0})`);
      return {
        score: candidates[0]?.score || 0,
        confidence: 0,
        status: "unresolved",
        reasons: ["Score below threshold (< 4)"],
        candidates,
      };
    }

    const top = candidates[0];
    // Calculate normalized confidence (max ~ 16)
    const confidence = Math.min(1.0, Math.round((top.score / 14) * 100) / 100);
    const isAmbiguous = candidates.length > 1 && (top.score - candidates[1].score <= 1);
    const status = isAmbiguous ? "ambiguous" : "resolved";

    logger.debug("RESOLVER:MATCH", `"${noun}" → ${top.element.name || top.element.tag} [${top.element.locators[0]?.selector}] (score: ${top.score}, confidence: ${confidence}, status: ${status})`);

    return {
      element: top.element,
      score: top.score,
      confidence,
      status,
      reasons: top.reasons,
      candidates,
    };
  }
}
