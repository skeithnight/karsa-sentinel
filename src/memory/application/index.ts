import { promises as fs } from "node:fs";
import path from "node:path";
import type { UIElement } from "../../core/models/index.js";

export class ApplicationMemory {
  constructor(private readonly memoryDir: string = ".sentinel/memory/application") {}

  async saveElements(pageUrl: string, elements: UIElement[]): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    const safeKey = Buffer.from(pageUrl).toString("base64url");
    const filePath = path.join(this.memoryDir, `${safeKey}.json`);
    await fs.writeFile(filePath, JSON.stringify({ pageUrl, elements }, null, 2), "utf-8");
  }

  async getElements(pageUrl: string): Promise<UIElement[]> {
    try {
      const safeKey = Buffer.from(pageUrl).toString("base64url");
      const filePath = path.join(this.memoryDir, `${safeKey}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(data) as { pageUrl: string; elements: UIElement[] };
      return parsed.elements;
    } catch {
      return [];
    }
  }
}
