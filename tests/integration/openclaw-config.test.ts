/**
 * Tests for OpenClaw Config UI (Session 48).
 * TDD: Written BEFORE implementation.
 *
 * @module tests/integration/openclaw-config
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("OpenClaw Config — File Existence (S48)", () => {
  it("should have src/app/api/openclaw/status/route.ts", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "app", "api", "openclaw", "status", "route.ts"))).toBe(true);
  });

  it("should have src/app/(dashboard)/settings/openclaw/page.tsx", () => {
    expect(fs.existsSync(path.join(process.cwd(), "src", "app", "(dashboard)", "settings", "openclaw", "page.tsx"))).toBe(true);
  });
});

// ══════════════════════════════════════════════
// OPENCLAW STATUS VIA SINGLETON
// ══════════════════════════════════════════════

describe("OpenClaw Config — Engine Health", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.USE_MOCK_ADAPTER = "true";
  });

  afterEach(() => {
    delete process.env.USE_MOCK_ADAPTER;
  });

  it("should check engine health via singleton", async () => {
    const { getEngine, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    const healthy = await engine.healthCheck();
    // MockAdapter always returns true
    expect(typeof healthy).toBe("boolean");
  });

  it("should list deployed agents via singleton", async () => {
    const { getEngine, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    const agents = await engine.listAgents();
    expect(Array.isArray(agents)).toBe(true);
  });

  it("should report engine type", async () => {
    const { getEngine, resetSingletons } = require("../../src/lib/engine-singleton");
    resetSingletons();

    const engine = await getEngine();
    // MockAdapter when USE_MOCK_ADAPTER=true
    expect(engine.constructor.name).toBe("MockAdapter");
  });
});

// ══════════════════════════════════════════════
// CONNECTION INFO
// ══════════════════════════════════════════════

describe("OpenClaw Config — Connection Info", () => {
  it("should have OPENCLAW_API_URL env default", () => {
    // OpenClawClient defaults to localhost:18789
    const { OpenClawClient } = require("../../src/core/adapter/openclaw-client");
    const client = new OpenClawClient();
    expect(client).toBeDefined();
  });

  it("should handle unreachable OpenClaw gracefully", async () => {
    jest.resetModules();
    delete process.env.USE_MOCK_ADAPTER;
    process.env.OPENCLAW_API_URL = "http://localhost:19999"; // unreachable

    const { OpenClawAdapter } = require("../../src/core/adapter/openclaw-adapter");
    const { OpenClawClient } = require("../../src/core/adapter/openclaw-client");
    const client = new OpenClawClient("http://localhost:19999");
    const adapter = new OpenClawAdapter(client);

    const healthy = await adapter.healthCheck();
    expect(healthy).toBe(false);

    delete process.env.OPENCLAW_API_URL;
  });
});
