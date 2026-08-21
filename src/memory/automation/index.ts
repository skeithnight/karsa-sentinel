import { promises as fs } from "node:fs";
import path from "node:path";
import type { TestCase } from "../../core/models/index.js";

export interface AutomationArtifact {
  requirementId: string;
  featureFile: string;
  specFile?: string;
  pageObjects?: string[];
  stepFile?: string;
  fixtureFile?: string;
  testCases?: TestCase[];
  lastRunPassed?: boolean;
  timestamp?: string;
}

export class AutomationMemory {
  constructor(private readonly memoryDir: string = ".sentinel/memory/automation") {}

  async saveArtifact(id: string, artifact: AutomationArtifact): Promise<void> {
    await fs.mkdir(this.memoryDir, { recursive: true });
    const filePath = path.join(this.memoryDir, `${id}.json`);
    await fs.writeFile(
      filePath,
      JSON.stringify({ ...artifact, timestamp: new Date().toISOString() }, null, 2),
      "utf-8"
    );
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

  async getExistingTests(requirementId: string): Promise<TestCase[]> {
    try {
      const artifact = await this.getArtifact(requirementId);
      if (artifact?.testCases && artifact.testCases.length > 0) {
        return artifact.testCases;
      }
    } catch {
      // ignore
    }
    return [];
  }
}
