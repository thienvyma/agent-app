/**
 * Tests for Env + Health + Final Wiring (Session 50).
 * TDD: Written BEFORE implementation.
 *
 * @module tests/e2e/real-wiring
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// .ENV.EXAMPLE
// ══════════════════════════════════════════════

describe("Real Wiring — .env.example (S50)", () => {
  it("should have .env.example file", () => {
    expect(fs.existsSync(path.join(process.cwd(), ".env.example"))).toBe(true);
  });

  it("should contain OPENCLAW_API_URL", () => {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    expect(content).toContain("OPENCLAW_API_URL");
  });

  it("should contain TELEGRAM_BOT_TOKEN", () => {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    expect(content).toContain("TELEGRAM_BOT_TOKEN");
  });

  it("should contain DATABASE_URL", () => {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    expect(content).toContain("DATABASE_URL");
  });

  it("should contain USE_MOCK_ADAPTER", () => {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    expect(content).toContain("USE_MOCK_ADAPTER");
  });

  it("should contain NEXTAUTH_SECRET", () => {
    const content = fs.readFileSync(path.join(process.cwd(), ".env.example"), "utf-8");
    expect(content).toContain("NEXTAUTH_SECRET");
  });
});

// ══════════════════════════════════════════════
// FULL INTEGRATION FLOW
// ══════════════════════════════════════════════

describe("Real Wiring — Full Flow", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should deploy agent → chat → track cost → check health (full cycle)", async () => {
    const { getEngine, getPipeline, getCostTracker, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    // 1. Health check
    const engine = await getEngine();
    const healthy = await engine.healthCheck();
    expect(healthy).toBe(true);

    // 2. Deploy
    await engine.deploy({
      id: "full-cycle-agent",
      name: "FullCycle",
      role: "tester",
      sop: "test everything",
      model: "test-model",
      tools: ["web_search"],
      skills: [],
    });

    // 3. Chat via pipeline
    const pipeline = await getPipeline();
    const result = await pipeline.execute("full-cycle-agent", "Run full cycle test");
    expect(result.agentId).toBe("full-cycle-agent");
    expect(result.message.length).toBeGreaterThan(0);

    // 4. Cost tracked
    const tracker = getCostTracker();
    const usage = tracker.getAgentUsage("full-cycle-agent");
    expect(usage.totalTokens).toBeGreaterThan(0);

    // 5. Undeploy
    await engine.undeploy("full-cycle-agent");
    await expect(engine.getStatus("full-cycle-agent")).rejects.toThrow();
  });

  it("should support Telegram startup check", () => {
    const { getTelegramStatus } = require("../../src/lib/telegram-startup");
    const status = getTelegramStatus();
    expect(typeof status.running).toBe("boolean");
  });

  it("should have all 50 sessions completed in state", () => {
    const state = require("../../architecture_state.json");
    expect(state.current_session).toBeGreaterThanOrEqual(49);
    expect(state.total_sessions).toBe(50);
  });
});
