/**
 * OpenClawAdapter — unit tests for IAgentEngine implementation.
 *
 * Tests deploy/undeploy/redeploy/sendMessage/getStatus/listAgents/healthCheck.
 * Phase 67: per-agent session routing tests.
 * Mocks OpenClawClient (chatCompletion + healthCheck) + openclaw-cli (execOpenClaw).
 *
 * @module tests/adapter/openclaw-adapter
 */

import { OpenClawAdapter } from "@/core/adapter/openclaw-adapter";
import { OpenClawClient } from "@/core/adapter/openclaw-client";
import type { AgentConfig } from "@/types/agent";
import { execOpenClaw } from "@/lib/openclaw-cli";

// Mock OpenClawClient
jest.mock("@/core/adapter/openclaw-client");

// Mock openclaw-cli for CLI calls
jest.mock("@/lib/openclaw-cli", () => ({
  execOpenClaw: jest.fn().mockResolvedValue({
    stdout: "",
    stderr: "",
    exitCode: 0,
  }),
  configSet: jest.fn().mockResolvedValue(undefined),
}));

const mockExecOpenClaw = execOpenClaw as jest.MockedFunction<typeof execOpenClaw>;

/** Test agent config factory */
function makeConfig(overrides: Partial<AgentConfig> = {}): AgentConfig {
  return {
    id: "agent-001",
    name: "Test Agent",
    role: "tester",
    sop: "You are a test agent. Follow instructions precisely.",
    model: "ollama-lan/Qwen3.5-35B-A3B-Coder",
    tools: ["search"],
    skills: ["coding"],
    isAlwaysOn: false,
    ...overrides,
  };
}

describe("OpenClawAdapter", () => {
  let adapter: OpenClawAdapter;
  let mockClient: jest.Mocked<OpenClawClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new OpenClawClient() as jest.Mocked<OpenClawClient>;
    mockClient.chatCompletion = jest.fn();
    mockClient.healthCheck = jest.fn();
    adapter = new OpenClawAdapter(mockClient);
  });

  // ── healthCheck ──

  describe("healthCheck", () => {
    it("delegates to client.healthCheck and returns true", async () => {
      mockClient.healthCheck.mockResolvedValue(true);
      const result = await adapter.healthCheck();
      expect(result).toBe(true);
      expect(mockClient.healthCheck).toHaveBeenCalledTimes(1);
    });

    it("delegates to client.healthCheck and returns false", async () => {
      mockClient.healthCheck.mockResolvedValue(false);
      const result = await adapter.healthCheck();
      expect(result).toBe(false);
    });
  });

  // ── deploy ──

  describe("deploy", () => {
    it("stores agent in internal map and returns RUNNING status", async () => {
      const config = makeConfig();
      const status = await adapter.deploy(config);

      expect(status.id).toBe("agent-001");
      expect(status.name).toBe("Test Agent");
      expect(status.status).toBe("RUNNING");
      expect(status.tokenUsage).toBe(0);
      expect(status.lastActivity).toBeInstanceOf(Date);
    });

    it("throws if agent already deployed", async () => {
      const config = makeConfig();
      await adapter.deploy(config);

      await expect(adapter.deploy(config)).rejects.toThrow(
        /already deployed/i
      );
    });

    // Phase 67: deploy calls openclaw agents add
    it("calls openclaw agents add when deploying", async () => {
      const config = makeConfig({ id: "ceo", name: "CEO Agent" });
      await adapter.deploy(config);

      expect(mockExecOpenClaw).toHaveBeenCalledWith(
        expect.arrayContaining(["agents", "add", "ceo-agent"]),
        expect.any(Number)
      );
    });

    // Phase 67: deploy still works when CLI fails (fallback)
    it("deploys successfully even when openclaw agents add fails", async () => {
      mockExecOpenClaw.mockResolvedValueOnce({
        stdout: "",
        stderr: "connection refused",
        exitCode: 1,
      });

      const config = makeConfig({ id: "ceo", name: "CEO Agent" });
      const status = await adapter.deploy(config);

      expect(status.status).toBe("RUNNING");
      expect(status.id).toBe("ceo");
    });
  });

  // ── undeploy ──

  describe("undeploy", () => {
    it("removes agent from internal map", async () => {
      const config = makeConfig();
      await adapter.deploy(config);
      await adapter.undeploy("agent-001");

      // Agent should no longer exist
      await expect(adapter.getStatus("agent-001")).rejects.toThrow(
        /not found/i
      );
    });

    it("throws if agent not found", async () => {
      await expect(adapter.undeploy("unknown")).rejects.toThrow(
        /not found/i
      );
    });

    // Phase 67: undeploy calls openclaw agents delete with slug
    it("calls openclaw agents delete when undeploying", async () => {
      const config = makeConfig({ id: "ceo", name: "CEO" });
      await adapter.deploy(config);
      mockExecOpenClaw.mockClear(); // clear deploy calls
      await adapter.undeploy("ceo");

      expect(mockExecOpenClaw).toHaveBeenCalledWith(
        expect.arrayContaining(["agents", "delete", "ceo"]),
        expect.any(Number)
      );
    });
  });

  // ── redeploy ──

  describe("redeploy", () => {
    it("undeploys and redeploys with merged config", async () => {
      const config = makeConfig();
      await adapter.deploy(config);

      const status = await adapter.redeploy("agent-001", {
        model: "new-model",
      });

      expect(status.status).toBe("RUNNING");
      expect(status.id).toBe("agent-001");
    });

    it("throws if agent not found", async () => {
      await expect(adapter.redeploy("unknown")).rejects.toThrow(
        /not found/i
      );
    });
  });

  // ── sendMessage ──

  describe("sendMessage", () => {
    it("builds system prompt from SOP and calls chatCompletion", async () => {
      const config = makeConfig({ sop: "You are a helpful assistant." });
      await adapter.deploy(config);

      mockClient.chatCompletion.mockResolvedValue({
        message: "Hello!",
        tokenUsed: 25,
      });

      const response = await adapter.sendMessage("agent-001", "hi");

      expect(response.agentId).toBe("agent-001");
      expect(response.message).toBe("Hello!");
      expect(response.tokenUsed).toBe(25);
      expect(response.timestamp).toBeInstanceOf(Date);

      // Verify system prompt contains SOP
      const callArgs = mockClient.chatCompletion.mock.calls[0]!;
      const request = callArgs[0];
      expect(request.messages).toHaveLength(2); // system + user
      expect(request.messages[0]!.role).toBe("system");
      expect(request.messages[0]!.content).toContain(
        "You are a helpful assistant."
      );
      expect(request.messages[1]!.role).toBe("user");
      expect(request.messages[1]!.content).toBe("hi");
    });

    it("includes context in system prompt when provided", async () => {
      const config = makeConfig();
      await adapter.deploy(config);

      mockClient.chatCompletion.mockResolvedValue({
        message: "context response",
        tokenUsed: 30,
      });

      await adapter.sendMessage(
        "agent-001",
        "question",
        "Relevant company data: Q1 revenue = $1M"
      );

      const callArgs = mockClient.chatCompletion.mock.calls[0]!;
      const systemMsg = callArgs[0].messages[0]!.content;
      expect(systemMsg).toContain("Q1 revenue");
    });

    it("throws if agent not found", async () => {
      await expect(
        adapter.sendMessage("unknown", "hello")
      ).rejects.toThrow(/not found/i);
    });

    // Phase 67: sendMessage routes to per-agent session
    it("passes per-agent session key to chatCompletion", async () => {
      const config = makeConfig({ id: "ceo" });
      await adapter.deploy(config);

      mockClient.chatCompletion.mockResolvedValue({
        message: "CEO response",
        tokenUsed: 50,
      });

      await adapter.sendMessage("ceo", "hello CEO");

      const callArgs = mockClient.chatCompletion.mock.calls[0]!;
      // Second param should be the session key (agent:ceo:main)
      expect(callArgs[1]).toBe("agent:ceo:main");
    });
  });

  // ── getStatus ──

  describe("getStatus", () => {
    it("returns status from internal map", async () => {
      const config = makeConfig();
      await adapter.deploy(config);

      const status = await adapter.getStatus("agent-001");
      expect(status.id).toBe("agent-001");
      expect(status.name).toBe("Test Agent");
      expect(status.status).toBe("RUNNING");
    });

    it("throws if agent not found", async () => {
      await expect(adapter.getStatus("unknown")).rejects.toThrow(
        /not found/i
      );
    });
  });

  // ── listAgents ──

  describe("listAgents", () => {
    it("returns all deployed agents", async () => {
      await adapter.deploy(makeConfig({ id: "a1", name: "Agent 1" }));
      await adapter.deploy(makeConfig({ id: "a2", name: "Agent 2" }));

      const agents = await adapter.listAgents();
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.id).sort()).toEqual(["a1", "a2"]);
    });

    it("returns empty array when none deployed", async () => {
      const agents = await adapter.listAgents();
      expect(agents).toEqual([]);
    });
  });
});
