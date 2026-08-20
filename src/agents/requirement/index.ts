import type { Requirement } from "../../core/models/index.js";
import { DocumentParserRegistry } from "../../documents/parser/index.js";

export class RequirementAgent {
  private parserRegistry = new DocumentParserRegistry();

  async extract(filePath: string): Promise<Requirement> {
    return this.parserRegistry.parseFile(filePath);
  }
}
