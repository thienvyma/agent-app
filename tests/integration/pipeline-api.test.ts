/**
 * Tests for Engine Singleton + Pipeline API (Session 46).
 * TDD: Written BEFORE implementation.
 *
 * @module tests/integration/pipeline-api
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("Engine Singleton — File Existence (S46)", () => {
  it("should have src/lib/engine-singleton.ts", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "lib", "engine-singleton.ts"))).toBe(true);
  });
});

// ══════════════════════════════════════════════
// ENGINE SINGLETON
// ══════════════════════════════════════════════

describe("Engine Singleton — Core", () => {
  beforeEach(() => {
    // Reset singleton between tests
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should export getEngine function", () => {
    const mod = require("../../src/lib/engine-singleton");
    expect(typeof mod.getEngine).toBe("function");
  });

  it("should export getPipeline function", () => {
    const mod = require("../../src/lib/engine-singleton");
    expect(typeof mod.getPipeline).toBe("function");
  });

  it("should return IAgentEngine from getEngine()", async () => {
    const { getEngine } = require("../../src/lib/engine-singleton");
    const engine = await getEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.deploy).toBe("function");
    expect(typeof engine.sendMessage).toBe("function");
    expect(typeof engine.healthCheck).toBe("function");
  });

  it("should return same engine instance on multiple calls (singleton)", async () => {
    const { getEngine } = require("../../src/lib/engine-singleton");
    const engine1 = await getEngine();
    const engine2 = await getEngine();
    expect(engine1).toBe(engine2);
  });

  it("should return AgentPipeline from getPipeline()", async () => {
    const { getPipeline } = require("../../src/lib/engine-singleton");
    const pipeline = await getPipeline();
    expect(pipeline).toBeDefined();
    expect(typeof pipeline.execute).toBe("function");
  });

  it("should return same pipeline instance on multiple calls (singleton)", async () => {
    const { getPipeline } = require("../../src/lib/engine-singleton");
    const p1 = await getPipeline();
    const p2 = await getPipeline();
    expect(p1).toBe(p2);
  });

  it("should export resetSingletons for testing", () => {
    const mod = require("../../src/lib/engine-singleton");
    expect(typeof mod.resetSingletons).toBe("function");
  });
});

// ══════════════════════════════════════════════
// PIPELINE EXECUTION VIA SINGLETON
// ══════════════════════════════════════════════

describe("Engine Singleton — Pipeline Execution", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should deploy agent and execute through singleton pipeline", async () => {
    const { getEngine, getPipeline } = require("../../src/lib/engine-singleton");

    const engine = await getEngine();
    await engine.deploy({
      id: "singleton-test",
      name: "SingletonTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    const pipeline = await getPipeline();
    const result = await pipeline.execute("singleton-test", "Hello singleton");
    expect(result.agentId).toBe("singleton-test");
    expect(result.message.length).toBeGreaterThan(0);
    expect(result.budgetStatus).toBeDefined();
  });

  it("should share engine between direct calls and pipeline", async () => {
    const { getEngine, getPipeline } = require("../../src/lib/engine-singleton");

    const engine = await getEngine();
    await engine.deploy({
      id: "shared-test",
      name: "SharedTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    // Pipeline uses same engine — agent should be visible
    const pipeline = await getPipeline();
    const result = await pipeline.execute("shared-test", "Are you the same engine?");
    expect(result.agentId).toBe("shared-test");
  });
});
