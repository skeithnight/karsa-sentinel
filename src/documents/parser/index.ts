import { promises as fs } from "node:fs";
import type { IDocumentParser } from "../../core/contracts/index.js";
import type { Requirement } from "../../core/models/index.js";
import { MarkdownRequirementParser } from "../markdown/index.js";

export class DocumentParserRegistry {
  private parsers: IDocumentParser[] = [new MarkdownRequirementParser()];

  register(parser: IDocumentParser): void {
    this.parsers.push(parser);
  }

  async parseFile(filePath: string): Promise<Requirement> {
    const parser = this.parsers.find((p) => p.supports(filePath));
    if (!parser) {
      throw new Error(`No parser registered for file format: ${filePath}`);
    }
    const content = await fs.readFile(filePath, "utf-8");
    return parser.parse(filePath, content);
  }
}
