import { promises as fs } from "node:fs";
import path from "node:path";
import type { Requirement } from "../../core/models/index.js";

export class RequirementMemory {
  constructor(private readonly memoryDir: string = ".sentinel/memory/requirements") {}

  async save(req: Requirement): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    const filePath = path.join(this.memoryDir, `${req.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(req, null, 2), "utf-8");
  }

  async get(id: string): Promise<Requirement | null> {
    try {
      const filePath = path.join(this.memoryDir, `${id}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as Requirement;
    } catch {
      return null;
    }
  }
}
