/**
 * Final Integration Tests (Session 53).
 * Verifies full wiring: UI → API → Engine → Pipeline → Cost.
 *
 * @module tests/e2e/final-integration
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// DASHBOARD — NO MORE MOCK
// ══════════════════════════════════════════════

describe("Final Integration — Dashboard Real Data (S53)", () => {
  it("should NOT contain hardcoded mock data in dashboard page", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    // Old hardcoded values should NOT exist
    expect(content).not.toContain("\"3 / 4\"");
    expect(content).not.toContain("\"78.3K\"");
    expect(content).not.toContain("\"₫7.9M\"");
    expect(content).not.toContain("CEO Agent");
    expect(content).not.toContain("Marketing Agent");
    expect(content).not.toContain("Finance Agent");
    expect(content).not.toContain("Developer Agent");
    expect(content).not.toContain("Viết nội dung marketing Q2");
  });

  it("should fetch from real APIs in dashboard", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    // Must contain real API fetches
    expect(content).toContain('fetch("/api/agents');
    expect(content).toContain('fetch("/api/tasks');
    expect(content).toContain('fetch("/api/health');
    expect(content).toContain('fetch("/api/openclaw/status');
  });

  it("should show OpenClaw status indicator in dashboard", () => {
    const pagePath = path.join(process.cwd(), "src", "app", "(dashboard)", "page.tsx");
    const content = fs.readFileSync(pagePath, "utf-8");

    expect(content).toContain("OpenClaw Connected");
    expect(content).toContain("Mock Mode");
  });
});

// ══════════════════════════════════════════════
// AGENT ROUTE — ENGINE.DEPLOY WIRED
// ══════════════════════════════════════════════

describe("Final Integration — Agent Deploy Wired (S53)", () => {
  it("should call engine.deploy() in POST /api/agents route", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "agents", "route.ts");
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain("engine.deploy(");
    expect(content).toContain("getEngine()");
    expect(content).toContain("engineStatus");
  });

  it("should have getEngine import in agents route", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "agents", "route.ts");
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain('import { getEngine } from "@/lib/engine-singleton"');
  });
});

// ══════════════════════════════════════════════
// CHAT ROUTE — RESPONSE FIELD
// ══════════════════════════════════════════════

describe("Final Integration — Chat Response (S53)", () => {
  it("should return 'response' field in chat route", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "agents", "[id]", "chat", "route.ts");
    const content = fs.readFileSync(routePath, "utf-8");

    // Must have response field for UI compatibility
    expect(content).toContain("response: result.message");
  });

  it("should call getPipeline() in chat route", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "agents", "[id]", "chat", "route.ts");
    const content = fs.readFileSync(routePath, "utf-8");

    expect(content).toContain("getPipeline()");
    expect(content).toContain("pipeline.execute(");
  });
});

// ══════════════════════════════════════════════
// FULL ENGINE CYCLE
// ══════════════════════════════════════════════

describe("Final Integration — Full Cycle (S53)", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should complete full cycle: deploy → chat → cost → undeploy", async () => {
    const { getEngine, getPipeline, getCostTracker, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();

    // 1. Deploy (mimics POST /api/agents)
    const deployResult = await engine.deploy({
      id: "final-test-agent",
      name: "FinalTest",
      role: "qa",
      sop: "test everything",
      model: "test-model",
      tools: [],
      skills: [],
      isAlwaysOn: false,
    });
    expect(deployResult.status).toBe("RUNNING");

    // 2. Chat (mimics POST /api/agents/:id/chat)
    const pipeline = await getPipeline();
    const chatResult = await pipeline.execute("final-test-agent", "Integration test message");
    expect(chatResult.agentId).toBe("final-test-agent");
    expect(chatResult.message.length).toBeGreaterThan(0);

    // 3. Cost tracked
    const tracker = getCostTracker();
    const usage = tracker.getAgentUsage("final-test-agent");
    expect(usage.totalTokens).toBeGreaterThan(0);

    // 4. Undeploy
    await engine.undeploy("final-test-agent");

    // 5. Verify fully cleaned
    await expect(engine.getStatus("final-test-agent")).rejects.toThrow();
  });

  it("should verify all 53 sessions tracked", () => {
    const state = require("../../architecture_state.json");
    expect(state.total_sessions).toBe(53);
    expect(state.current_session).toBeGreaterThanOrEqual(52);
  });
});
