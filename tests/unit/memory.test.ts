import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { RequirementMemory } from "../../src/memory/requirements/index.js";
import { AutomationMemory } from "../../src/memory/automation/index.js";
import type { Requirement, TestCase } from "../../src/core/models/index.js";

describe("Memory Layer & Intelligence", () => {
  const testMemoryDir = path.resolve(process.cwd(), ".sentinel-test-memory");
  const reqMemoryDir = path.join(testMemoryDir, "requirements");
  const autoMemoryDir = path.join(testMemoryDir, "automation");

  beforeEach(async () => {
    await fs.mkdir(testMemoryDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testMemoryDir, { recursive: true, force: true }).catch(() => {});
  });

  it("should calculate deterministic SHA-256 fingerprint for requirements", () => {
    const reqMemory = new RequirementMemory(reqMemoryDir);
    const req1: Requirement = {
      id: "req-1",
      title: "Login Feature",
      description: "User authentication",
      targetUrl: "https://www.saucedemo.com/",
      scenarios: ["Scenario 1: Valid Login"],
      tags: ["auth"],
      createdAt: new Date().toISOString(),
    };

    const fp1 = reqMemory.getFingerprint(req1);
    const fp2 = reqMemory.getFingerprint({ ...req1, id: "req-other" });
    expect(fp1).toBe(fp2);
    expect(fp1).toHaveLength(64);
  });

  it("should detect when requirement content changes vs unchanged", async () => {
    const reqMemory = new RequirementMemory(reqMemoryDir);
    const req: Requirement = {
      id: "req-login",
      title: "User Login",
      description: "Authentication feature",
      targetUrl: "https://www.saucedemo.com/",
      scenarios: ["Scenario 1: Standard User"],
      tags: ["smoke"],
      createdAt: new Date().toISOString(),
    };

    // First check: new requirement
    const initialCheck = await reqMemory.checkFingerprint(req);
    expect(initialCheck.isNew).toBe(true);
    expect(initialCheck.hasChanged).toBe(true);

    // Save requirement
    await reqMemory.save(req);

    // Second check: unchanged requirement
    const secondCheck = await reqMemory.checkFingerprint(req);
    expect(secondCheck.isNew).toBe(false);
    expect(secondCheck.hasChanged).toBe(false);

    // Third check: modified scenarios
    const modifiedReq: Requirement = {
      ...req,
      scenarios: ["Scenario 1: Standard User", "Scenario 2: Locked Out User"],
    };
    const modifiedCheck = await reqMemory.checkFingerprint(modifiedReq);
    expect(modifiedCheck.isNew).toBe(false);
    expect(modifiedCheck.hasChanged).toBe(true);
  });

  it("should persist and retrieve existing test cases from AutomationMemory", async () => {
    const autoMemory = new AutomationMemory(autoMemoryDir);
    const sampleTests: TestCase[] = [
      {
        id: "tc-101",
        requirementId: "req-login",
        title: "Test Valid Credentials",
        description: "Checks successful login",
        preconditions: ["On login page"],
        steps: [
          { stepNumber: 1, action: "Enters user", expectedResult: "Field filled" },
        ],
        priority: "high",
        tags: ["smoke"],
      },
    ];

    await autoMemory.saveArtifact("req-login", {
      requirementId: "req-login",
      featureFile: "features/login.feature",
      testCases: sampleTests,
    });

    const retrievedTests = await autoMemory.getExistingTests("req-login");
    expect(retrievedTests).toHaveLength(1);
    expect(retrievedTests[0].title).toBe("Test Valid Credentials");
  });
});
