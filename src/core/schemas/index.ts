import { z } from "zod";

export const RequirementSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  targetUrl: z.string().url().optional(),
  scenarios: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
});

export type Requirement = z.infer<typeof RequirementSchema>;

export const TestCaseSchema = z.object({
  id: z.string(),
  requirementId: z.string(),
  title: z.string(),
  description: z.string(),
  preconditions: z.array(z.string()).default([]),
  steps: z.array(
    z.object({
      stepNumber: z.number().int().positive(),
      action: z.string(),
      expectedResult: z.string(),
    })
  ),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  tags: z.array(z.string()).default([]),
});

export type TestCase = z.infer<typeof TestCaseSchema>;

export const LocatorCandidateSchema = z.object({
  selector: z.string(),
  strategy: z.enum(["role", "text", "test-id", "label", "placeholder", "css", "xpath"]),
  confidence: z.number().min(0).max(1),
  isResilient: z.boolean().default(true),
});

export type LocatorCandidate = z.infer<typeof LocatorCandidateSchema>;

export const UIElementSchema = z.object({
  id: z.string(),
  role: z.string().optional(),
  name: z.string().optional(),
  text: z.string().optional(),
  tag: z.string(),
  attributes: z.record(z.string()).default({}),
  locators: z.array(LocatorCandidateSchema).default([]),
  pageUrl: z.string(),
});

export type UIElement = z.infer<typeof UIElementSchema>;

export const BDDStepSchema = z.object({
  keyword: z.enum(["Given", "When", "Then", "And", "But"]),
  text: z.string(),
});

export type BDDStep = z.infer<typeof BDDStepSchema>;

export const BDDScenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  tags: z.array(z.string()).default([]),
  steps: z.array(BDDStepSchema),
});

export type BDDScenario = z.infer<typeof BDDScenarioSchema>;

export const BDDFeatureSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  scenarios: z.array(BDDScenarioSchema),
});

export type BDDFeature = z.infer<typeof BDDFeatureSchema>;
