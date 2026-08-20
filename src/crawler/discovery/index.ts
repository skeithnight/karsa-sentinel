import type { Page } from "playwright";
import type { UIElement } from "../../core/models/index.js";
import { LocatorGenerator } from "../locators/index.js";

export class PageExplorer {
  private locatorGen = new LocatorGenerator();

  async explorePage(page: Page): Promise<UIElement[]> {
    const url = page.url();
    const rawElements = await page.$$eval(
      "button, input, a, select, textarea, [role='button'], [role='link'], [data-testid]",
      (elements) =>
        elements.map((el, index) => {
          const htmlEl = el as HTMLElement;
          const inputEl = el as HTMLInputElement;
          return {
            id: el.id || `el-${index}`,
            tag: el.tagName.toLowerCase(),
            role: el.getAttribute("role") || undefined,
            name: el.getAttribute("name") || el.getAttribute("aria-label") || undefined,
            text: el.textContent?.trim() || undefined,
            testId: el.getAttribute("data-testid") || undefined,
            placeholder: inputEl.placeholder || undefined,
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

    return rawElements.map((raw) => {
      const locators = this.locatorGen.generateCandidates({
        tag: raw.tag,
        id: raw.id.startsWith("el-") ? undefined : raw.id,
        name: raw.name,
        text: raw.text,
        role: raw.role,
        testId: raw.testId,
        placeholder: raw.placeholder,
      });

      return {
        id: raw.id,
        role: raw.role,
        name: raw.name,
        text: raw.text,
        tag: raw.tag,
        attributes: raw.attributes,
        locators,
        pageUrl: url,
      };
    });
  }
}
