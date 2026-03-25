/**
 * Tests for Agent Deploy/Chat Wiring (Session 47).
 * TDD: Written BEFORE implementation.
 *
 * @module tests/integration/agent-wiring
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("Agent Wiring — File Existence (S47)", () => {
  it("should have src/app/api/agents/[id]/chat/route.ts", () => {
    const filePath = path.join(process.cwd(), "src", "app", "api", "agents", "[id]", "chat", "route.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// ══════════════════════════════════════════════
// CHAT ROUTE — PIPELINE EXECUTE
// ══════════════════════════════════════════════

describe("Agent Wiring — Chat via Pipeline", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should deploy agent via singleton engine and chat via pipeline", async () => {
    const { getEngine, getPipeline, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();

    // Deploy agent
    await engine.deploy({
      id: "chat-wire-agent",
      name: "ChatWire",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    // Chat via pipeline (this is what the chat route will do)
    const pipeline = await getPipeline();
    const result = await pipeline.execute("chat-wire-agent", "Hello from chat route");

    expect(result.agentId).toBe("chat-wire-agent");
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.budgetStatus).toBeDefined();
    expect(result.contextInjected).toBeDefined();
  });

  it("should fail chat for non-deployed agent", async () => {
    const { getPipeline, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const pipeline = await getPipeline();

    await expect(
      pipeline.execute("non-existent-agent", "Should fail")
    ).rejects.toThrow(/not found/);
  });

  it("should track cost after chat via singleton", async () => {
    const { getEngine, getPipeline, getCostTracker, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    await engine.deploy({
      id: "cost-wire-agent",
      name: "CostWire",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    const pipeline = await getPipeline();
    await pipeline.execute("cost-wire-agent", "Track cost");

    const tracker = getCostTracker();
    const usage = tracker.getAgentUsage("cost-wire-agent");
    expect(usage.totalTokens).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════
// ENGINE DEPLOY/UNDEPLOY SYMMETRY
// ══════════════════════════════════════════════

describe("Agent Wiring — Deploy/Undeploy", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should deploy then undeploy agent cleanly", async () => {
    const { getEngine, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    const config = {
      id: "deploy-undeploy-test",
      name: "DeployTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    };

    // Deploy
    const status = await engine.deploy(config);
    expect(status.status).toBe("RUNNING");

    // Undeploy
    await engine.undeploy("deploy-undeploy-test");

    // Should fail after undeploy
    await expect(
      engine.getStatus("deploy-undeploy-test")
    ).rejects.toThrow(/not found/);
  });

  it("should redeploy agent with updated config", async () => {
    const { getEngine, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    await engine.deploy({
      id: "redeploy-test",
      name: "RedeployTest",
      role: "tester",
      sop: "original sop",
      model: "test-model",
      tools: [],
      skills: [],
    });

    const status = await engine.redeploy("redeploy-test", { sop: "updated sop" });
    expect(status.status).toBe("RUNNING");
  });
});
