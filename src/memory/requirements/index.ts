import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import type { Requirement } from "../../core/models/index.js";
import { logger } from "../../core/logger/index.js";

export interface RequirementFingerprintResult {
  hasChanged: boolean;
  isNew: boolean;
  fingerprint: string;
  previousFingerprint?: string;
  previousRequirement?: Requirement;
}

export class RequirementMemory {
  constructor(private readonly memoryDir: string = ".sentinel/memory/requirements") {}

  /**
   * Computes a deterministic SHA-256 fingerprint for a requirement document.
   */
  getFingerprint(req: Requirement): string {
    const payload = JSON.stringify({
      title: req.title.trim().toLowerCase(),
      targetUrl: req.targetUrl || "",
      scenarios: req.scenarios.map((s) => s.trim()),
    });
    return crypto.createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Checks if the given requirement has changed since the last run.
   */
  async checkFingerprint(req: Requirement): Promise<RequirementFingerprintResult> {
    const currentFingerprint = this.getFingerprint(req);
    const existing = await this.get(req.id) || await this.findByTitle(req.title);

    if (!existing) {
      logger.debug("MEMORY:REQ_NEW", `Requirement "${req.title}" is brand new.`);
      return {
        hasChanged: true,
        isNew: true,
        fingerprint: currentFingerprint,
      };
    }

    const previousFingerprint = this.getFingerprint(existing);
    const hasChanged = currentFingerprint !== previousFingerprint;

    logger.debug("MEMORY:REQ_DIFF", `Requirement "${req.title}" changed: ${hasChanged} (curr: ${currentFingerprint.slice(0, 8)}, prev: ${previousFingerprint.slice(0, 8)})`);

    return {
      hasChanged,
      isNew: false,
      fingerprint: currentFingerprint,
      previousFingerprint,
      previousRequirement: existing,
    };
  }

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

  async findByTitle(title: string): Promise<Requirement | null> {
    try {
      const files = await fs.readdir(this.memoryDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const content = await fs.readFile(path.join(this.memoryDir, file), "utf-8");
          const req = JSON.parse(content) as Requirement;
          if (req.title.toLowerCase() === title.toLowerCase()) {
            return req;
          }
        }
      }
    } catch {
      // ignore
    }
    return null;
  }
}
