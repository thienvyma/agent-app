/**
 * Tests for Full Pipeline Wiring (Session 44).
 * TDD: Written BEFORE implementation.
 *
 * Covers: file existence, service container creation, pipeline execute
 * flow through all 8 steps, multi-input consistency.
 *
 * @module tests/integration/full-pipeline
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("Pipeline Wiring — File Existence (S44)", () => {
  it("should have src/lib/service-container.ts", () => {
    const filePath = path.join(process.cwd(), "src", "lib", "service-container.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have tests/integration/full-pipeline.test.ts", () => {
    const filePath = path.join(process.cwd(), "tests", "integration", "full-pipeline.test.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// ══════════════════════════════════════════════
// SERVICE CONTAINER
// ══════════════════════════════════════════════

describe("Pipeline Wiring — Service Container", () => {
  it("should export createServiceContainer function", () => {
    const mod = require("../../src/lib/service-container");
    expect(typeof mod.createServiceContainer).toBe("function");
  });

  it("should return container with all pipeline deps", () => {
    const { createServiceContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });

    expect(container).toHaveProperty("engine");
    expect(container).toHaveProperty("contextBuilder");
    expect(container).toHaveProperty("costTracker");
    expect(container).toHaveProperty("budgetManager");
    expect(container).toHaveProperty("messageBus");
    expect(container).toHaveProperty("approvalPolicy");
    expect(container).toHaveProperty("conversationLogger");
    expect(container).toHaveProperty("realtimeHub");
  });

  it("should return MockAdapter when useMock=true", () => {
    const { createServiceContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    expect(container.engine.constructor.name).toBe("MockAdapter");
  });

  it("should return OpenClawAdapter when useMock=false", () => {
    const { createServiceContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: false });
    expect(container.engine.constructor.name).toBe("OpenClawAdapter");
  });

  it("should export createPipelineFromContainer function", () => {
    const mod = require("../../src/lib/service-container");
    expect(typeof mod.createPipelineFromContainer).toBe("function");
  });

  it("should create pipeline from container", () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    const pipeline = createPipelineFromContainer(container);
    expect(pipeline).toBeDefined();
    expect(typeof pipeline.execute).toBe("function");
  });
});

// ══════════════════════════════════════════════
// FULL PIPELINE EXECUTE (8 steps via mock)
// ══════════════════════════════════════════════

describe("Pipeline Wiring — Full Execute Flow", () => {
  it("should execute message through pipeline and return response", async () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    const pipeline = createPipelineFromContainer(container);

    // Deploy agent first via engine
    await container.engine.deploy({
      id: "pipeline-test-agent",
      name: "PipelineTest",
      role: "tester",
      sop: "test sop",
      model: "test-model",
      tools: [],
      skills: [],
    });

    const result = await pipeline.execute("pipeline-test-agent", "Hello pipeline");
    expect(result).toHaveProperty("agentId");
    expect(result).toHaveProperty("message");
    expect(result).toHaveProperty("tokenUsed");
    expect(result).toHaveProperty("budgetStatus");
    expect(result).toHaveProperty("contextInjected");
    expect(typeof result.message).toBe("string");
    expect(result.message.length).toBeGreaterThan(0);
  });

  it("should track cost after execute", async () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    const pipeline = createPipelineFromContainer(container);

    await container.engine.deploy({
      id: "cost-test-agent",
      name: "CostTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    await pipeline.execute("cost-test-agent", "Track my cost");

    const usage = container.costTracker.getAgentUsage("cost-test-agent");
    expect(usage.totalTokens).toBeGreaterThan(0);
  });

  it("should emit realtime event after execute", async () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    const pipeline = createPipelineFromContainer(container);

    const events: { type: string }[] = [];
    container.realtimeHub.subscribeAll((e: { type: string }) => events.push(e));

    await container.engine.deploy({
      id: "rt-test-agent",
      name: "RTTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    await pipeline.execute("rt-test-agent", "Emit event test");
    expect(events.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════
// MULTI-INPUT CONSISTENCY
// ══════════════════════════════════════════════

describe("Pipeline Wiring — Multi-Input Consistency", () => {
  it("should produce same pipeline response structure from any input source", async () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({ useMock: true });
    const pipeline = createPipelineFromContainer(container);

    await container.engine.deploy({
      id: "multi-input-agent",
      name: "MultiInput",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    // Simulate 3 input sources → same pipeline
    const fromUI = await pipeline.execute("multi-input-agent", "From UI");
    const fromCLI = await pipeline.execute("multi-input-agent", "From CLI");
    const fromTelegram = await pipeline.execute("multi-input-agent", "From Telegram");

    // All should have same structure
    for (const result of [fromUI, fromCLI, fromTelegram]) {
      expect(result).toHaveProperty("agentId", "multi-input-agent");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("tokenUsed");
      expect(result).toHaveProperty("budgetStatus");
      expect(result).toHaveProperty("contextInjected");
    }
  });
});

// ══════════════════════════════════════════════
// APPROVAL BLOCKING
// ══════════════════════════════════════════════

describe("Pipeline Wiring — Approval Blocking", () => {
  it("should block execution when approval is required", async () => {
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");
    const container = createServiceContainer({
      useMock: true,
      blockedPatterns: ["sensitive"],
    });
    const pipeline = createPipelineFromContainer(container);

    await container.engine.deploy({
      id: "approval-test-agent",
      name: "ApprovalTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    await expect(
      pipeline.execute("approval-test-agent", "This is a sensitive action")
    ).rejects.toThrow(/[Aa]pproval/);
  });
});
