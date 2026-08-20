import type { Requirement, TestCase, BDDFeature } from "../models/index.js";

export interface PipelineContext {
  documentPath: string;
  requirement?: Requirement;
  testCases?: TestCase[];
  bddFeature?: BDDFeature;
  outputDirectory: string;
}

export class Pipeline {
  private steps: Array<(ctx: PipelineContext) => Promise<void>> = [];

  use(step: (ctx: PipelineContext) => Promise<void>): this {
    this.steps.push(step);
    return this;
  }

  async run(initialContext: PipelineContext): Promise<PipelineContext> {
    const ctx = { ...initialContext };
    for (const step of this.steps) {
      await step(ctx);
    }
    return ctx;
  }
}
