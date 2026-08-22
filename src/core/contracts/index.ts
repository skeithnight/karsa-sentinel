import type { Requirement, TestCase, BDDFeature, UIElement, TestDesignContext } from "../models/index.js";

export interface IDocumentParser {
  supports(filePath: string): boolean;
  parse(filePath: string, content: string): Promise<Requirement>;
}

export interface IAIProvider {
  name: string;
  generateRequirements(content: string): Promise<Requirement>;
  generateTestCases(context: TestDesignContext): Promise<TestCase[]>;
  generateBDD(testCases: TestCase[]): Promise<BDDFeature>;
  repairLocator(failedSelector: string, pageSnapshot: string): Promise<string>;
}

export interface IBrowserCrawler {
  explore(url: string): Promise<UIElement[]>;
  close(): Promise<void>;
}

export interface IPipelineStep<TInput, TOutput> {
  name: string;
  execute(input: TInput): Promise<TOutput>;
}
