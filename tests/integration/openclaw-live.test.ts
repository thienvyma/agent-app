/**
 * Tests for OpenClaw Live Connection (Session 42).
 * TDD: Written BEFORE implementation changes.
 *
 * Covers: file existence, adapter factory env switching,
 * connection fallback, deploy/undeploy/chat response shapes,
 * health check, graceful error handling.
 *
 * @module tests/integration/openclaw-live
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("OpenClaw Live — File Existence (S42)", () => {
  it("should have tests/integration/openclaw-live.test.ts", () => {
    const filePath = path.join(process.cwd(), "tests", "integration", "openclaw-live.test.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have adapter-factory.ts", () => {
    const filePath = path.join(process.cwd(), "src", "core", "adapter", "adapter-factory.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have openclaw-adapter.ts", () => {
    const filePath = path.join(process.cwd(), "src", "core", "adapter", "openclaw-adapter.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// ══════════════════════════════════════════════
// ADAPTER FACTORY — USE_MOCK_ADAPTER FLAG
// ══════════════════════════════════════════════

describe("OpenClaw Live — AdapterFactory Env Switching", () => {
  it("should return MockAdapter when USE_MOCK_ADAPTER=true", () => {
    // AdapterFactory.createFromEnv reads USE_MOCK_ADAPTER
    // When true → always returns MockAdapter regardless of AGENT_ENGINE
    const { AdapterFactory } = require("../../src/core/adapter/adapter-factory");
    const originalEnv = process.env.USE_MOCK_ADAPTER;
    process.env.USE_MOCK_ADAPTER = "true";
    try {
      const engine = AdapterFactory.createFromEnv();
      expect(engine.constructor.name).toBe("MockAdapter");
    } finally {
      if (originalEnv === undefined) {
        delete process.env.USE_MOCK_ADAPTER;
      } else {
        process.env.USE_MOCK_ADAPTER = originalEnv;
      }
    }
  });

  it("should return OpenClawAdapter when USE_MOCK_ADAPTER=false and AGENT_ENGINE=openclaw", () => {
    const { AdapterFactory } = require("../../src/core/adapter/adapter-factory");
    const origMock = process.env.USE_MOCK_ADAPTER;
    const origEngine = process.env.AGENT_ENGINE;
    process.env.USE_MOCK_ADAPTER = "false";
    process.env.AGENT_ENGINE = "openclaw";
    try {
      const engine = AdapterFactory.createFromEnv();
      expect(engine.constructor.name).toBe("OpenClawAdapter");
    } finally {
      if (origMock === undefined) delete process.env.USE_MOCK_ADAPTER;
      else process.env.USE_MOCK_ADAPTER = origMock;
      if (origEngine === undefined) delete process.env.AGENT_ENGINE;
      else process.env.AGENT_ENGINE = origEngine;
    }
  });

  it("should default to MockAdapter when no env vars set", () => {
    const { AdapterFactory } = require("../../src/core/adapter/adapter-factory");
    const origMock = process.env.USE_MOCK_ADAPTER;
    const origEngine = process.env.AGENT_ENGINE;
    delete process.env.USE_MOCK_ADAPTER;
    delete process.env.AGENT_ENGINE;
    try {
      const engine = AdapterFactory.createFromEnv();
      expect(engine.constructor.name).toBe("MockAdapter");
    } finally {
      if (origMock !== undefined) process.env.USE_MOCK_ADAPTER = origMock;
      if (origEngine !== undefined) process.env.AGENT_ENGINE = origEngine;
    }
  });
});

// ══════════════════════════════════════════════
// CONNECTION HEALTH + FALLBACK
// ══════════════════════════════════════════════

describe("OpenClaw Live — Connection Health", () => {
  it("should detect OpenClaw is not running (healthCheck returns false)", async () => {
    // Create adapter pointing to a port that's definitely not running
    const { OpenClawAdapter } = require("../../src/core/adapter/openclaw-adapter");
    const { OpenClawClient } = require("../../src/core/adapter/openclaw-client");
    const client = new OpenClawClient("http://localhost:19999");
    const adapter = new OpenClawAdapter(client);

    const healthy = await adapter.healthCheck();
    expect(healthy).toBe(false);
  });

  it("should throw descriptive error when deploy fails due to connection", async () => {
    const { OpenClawAdapter } = require("../../src/core/adapter/openclaw-adapter");
    const { OpenClawClient } = require("../../src/core/adapter/openclaw-client");
    const client = new OpenClawClient("http://localhost:19999");
    const adapter = new OpenClawAdapter(client);

    const config = {
      id: "test-agent",
      name: "Test",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    };

    await expect(adapter.deploy(config)).rejects.toThrow(/OpenClaw/);
  });
});

// ══════════════════════════════════════════════
// RESPONSE SHAPE VALIDATION
// ══════════════════════════════════════════════

describe("OpenClaw Live — Response Shape (via MockAdapter)", () => {
  it("deploy should return AgentStatus shape", async () => {
    const { MockAdapter } = require("../../src/core/adapter/mock-adapter");
    const adapter = new MockAdapter();

    const config = {
      id: "agent-shape-test",
      name: "ShapeTest",
      role: "tester",
      sop: "test sop",
      model: "test-model",
      tools: ["web_search"],
      skills: [],
    };

    const status = await adapter.deploy(config);
    expect(status).toHaveProperty("id");
    expect(status).toHaveProperty("name");
    expect(status).toHaveProperty("status");
    expect(status).toHaveProperty("lastActivity");
    expect(status).toHaveProperty("tokenUsage");
    expect(status.status).toBe("RUNNING");
  });

  it("sendMessage should return AgentResponse shape", async () => {
    const { MockAdapter } = require("../../src/core/adapter/mock-adapter");
    const adapter = new MockAdapter();

    await adapter.deploy({
      id: "msg-shape-test",
      name: "MsgTest",
      role: "tester",
      sop: "test",
      model: "test-model",
      tools: [],
      skills: [],
    });

    const response = await adapter.sendMessage("msg-shape-test", "Hello");
    expect(response).toHaveProperty("agentId");
    expect(response).toHaveProperty("message");
    expect(response).toHaveProperty("tokenUsed");
    expect(response).toHaveProperty("timestamp");
    expect(typeof response.message).toBe("string");
    expect(typeof response.tokenUsed).toBe("number");
  });

  it("undeploy should remove agent", async () => {
    const { MockAdapter } = require("../../src/core/adapter/mock-adapter");
    const adapter = new MockAdapter();

    await adapter.deploy({
      id: "undeploy-test",
      name: "UndeployTest",
      role: "tester",
      sop: "test",
      model: "m",
      tools: [],
      skills: [],
    });

    await adapter.undeploy("undeploy-test");
    await expect(adapter.getStatus("undeploy-test")).rejects.toThrow("not found");
  });

  it("healthCheck should return boolean", async () => {
    const { MockAdapter } = require("../../src/core/adapter/mock-adapter");
    const adapter = new MockAdapter();
    const result = await adapter.healthCheck();
    expect(typeof result).toBe("boolean");
    expect(result).toBe(true);
  });
});

// ══════════════════════════════════════════════
// ADAPTER FACTORY — createWithFallback
// ══════════════════════════════════════════════

describe("OpenClaw Live — Factory Fallback", () => {
  it("should have createWithFallback method", () => {
    const { AdapterFactory } = require("../../src/core/adapter/adapter-factory");
    expect(typeof AdapterFactory.createWithFallback).toBe("function");
  });

  it("createWithFallback should return adapter", async () => {
    const { AdapterFactory } = require("../../src/core/adapter/adapter-factory");
    const engine = await AdapterFactory.createWithFallback();
    expect(engine).toBeDefined();
    expect(typeof engine.deploy).toBe("function");
    expect(typeof engine.healthCheck).toBe("function");
  });
});
