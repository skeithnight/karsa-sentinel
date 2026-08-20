import type { Page } from "playwright";
import type { UIElement } from "../../core/models/index.js";
import { LocatorGenerator, type DiscoveredElementInfo } from "../locators/index.js";
import { logger } from "../../core/logger/index.js";

export class PageExplorer {
  private locatorGen = new LocatorGenerator();

  async explorePage(page: Page): Promise<UIElement[]> {
    const url = page.url();
    logger.debug("EXPLORER:PAGE", `Scanning DOM elements on ${url}`);

    const rawElements = await page.$$eval(
      "button, input, a, select, textarea, form, h1, h2, h3, [role='button'], [role='link'], [data-test], [data-testid], [class*='error'], .title, .inventory_item",
      (elements) =>
        elements.map((el, index) => {
          const inputEl = el as HTMLInputElement;
          return {
            id: el.id || `el-${index}`,
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || undefined,
            name: el.getAttribute("name") || undefined,
            text: el.textContent?.trim().slice(0, 100) || undefined,
            dataTest: el.getAttribute("data-test") || undefined,
            testId: el.getAttribute("data-testid") || undefined,
            placeholder: inputEl.placeholder || undefined,
            ariaLabel: el.getAttribute("aria-label") || undefined,
            type: inputEl.type || undefined,
            className: el.className || undefined,
            attributes: Array.from(el.attributes).reduce(
              (acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              },
              {} as Record<string, string>
            ),
          };
        })
    );

    logger.debug("EXPLORER:DOM", `Discovered ${rawElements.length} raw DOM elements on page`);

    const mapped = rawElements.map((raw) => {
      const info: DiscoveredElementInfo = {
        tag: raw.tag,
        id: raw.id.startsWith("el-") ? undefined : raw.id,
        name: raw.name,
        text: raw.text,
        role: raw.role,
        dataTest: raw.dataTest,
        testId: raw.testId,
        placeholder: raw.placeholder,
        ariaLabel: raw.ariaLabel,
        type: raw.type,
        className: raw.className,
      };

      const locators = this.locatorGen.generateCandidates(info);

      return {
        id: raw.id,
        role: raw.role,
        name: raw.name || raw.dataTest || raw.ariaLabel,
        text: raw.text,
        tag: raw.tag,
        attributes: raw.attributes,
        locators,
        pageUrl: url,
      };
    });

    if (logger.isDebug()) {
      const topElements = mapped.slice(0, 5).map((e) => ({
        tag: e.tag,
        name: e.name,
        bestLocator: e.locators[0]?.selector,
        confidence: e.locators[0]?.confidence,
      }));
      logger.debug("EXPLORER:LOCATORS", "Top discovered element candidates:", topElements);
    }

    return mapped;
  }
}
