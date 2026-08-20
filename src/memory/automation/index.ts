import { promises as fs } from "node:fs";
import path from "node:path";

export interface AutomationArtifact {
  featureFile: string;
  specFile: string;
  pageObjects: string[];
  lastRunPassed: boolean;
}

export class AutomationMemory {
  constructor(private readonly memoryDir: string = ".sentinel/memory/automation") {}

  async saveArtifact(id: string, artifact: AutomationArtifact): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    const filePath = path.join(this.memoryDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(artifact, null, 2), "utf-8");
  }

  async getArtifact(id: string): Promise<AutomationArtifact | null> {
    try {
      const filePath = path.join(this.memoryDir, `${id}.json`);
      const data = await fs.readFile(filePath, "utf-8");
      return JSON.parse(data) as AutomationArtifact;
    } catch {
      return null;
    }
  }
}
