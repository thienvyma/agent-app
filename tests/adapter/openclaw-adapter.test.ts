/**
 * Tests for OpenClawAdapter and AdapterFactory.
 * Uses jest mocking for HTTP calls — no real OpenClaw needed.
 */

import { OpenClawAdapter } from "@/core/adapter/openclaw-adapter";
import { OpenClawClient } from "@/core/adapter/openclaw-client";
import { AdapterFactory } from "@/core/adapter/adapter-factory";
import { MockAdapter } from "@/core/adapter/mock-adapter";
import type { AgentConfig } from "@/types/agent";

// Mock the OpenClawClient methods
jest.mock("@/core/adapter/openclaw-client");

const MockedClient = OpenClawClient as jest.MockedClass<typeof OpenClawClient>;

describe("OpenClawAdapter", () => {
  let adapter: OpenClawAdapter;
  let mockClient: jest.Mocked<OpenClawClient>;
  let testConfig: AgentConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = new MockedClient("http://localhost:18789") as jest.Mocked<OpenClawClient>;
    adapter = new OpenClawAdapter(mockClient);

    testConfig = {
      id: "agent-sales-001",
      name: "Sales Agent",
      role: "sales",
      sop: "Handle customer inquiries and close deals",
      model: "qwen2.5:7b",
      tools: ["email", "crm"],
      skills: ["negotiation"],
      isAlwaysOn: true,
    };
  });

  describe("deploy", () => {
    it("should POST to /api/sessions and return RUNNING status", async () => {
      mockClient.post.mockResolvedValue({
        key: "session-abc123",
        status: "active",
      });

      const status = await adapter.deploy(testConfig);

      expect(mockClient.post).toHaveBeenCalledWith(
        "/api/sessions",
        expect.objectContaining({ agent_id: "agent-sales-001" })
      );
      expect(status.id).toBe("agent-sales-001");
      expect(status.status).toBe("RUNNING");
      expect(status.name).toBe("Sales Agent");
    });
  });

  describe("undeploy", () => {
    it("should DELETE the session mapped to the agent", async () => {
      // Deploy first to create session mapping
      mockClient.post.mockResolvedValue({ key: "session-abc123" });
      await adapter.deploy(testConfig);

      mockClient.delete.mockResolvedValue(undefined);
      await adapter.undeploy("agent-sales-001");

      expect(mockClient.delete).toHaveBeenCalledWith(
        "/api/sessions/session-abc123"
      );
    });

    it("should throw if agent not deployed", async () => {
      await expect(adapter.undeploy("unknown")).rejects.toThrow(/not found/i);
    });
  });

  describe("sendMessage", () => {
    it("should POST to /api/sessions/:key/chat and return AgentResponse", async () => {
      // Deploy first
      mockClient.post.mockResolvedValueOnce({ key: "session-abc123" });
      await adapter.deploy(testConfig);

      // Chat
      mockClient.post.mockResolvedValueOnce({
        response: "I will contact the customer now.",
        token_usage: 150,
      });

      const response = await adapter.sendMessage(
        "agent-sales-001",
        "Contact customer John"
      );

      expect(mockClient.post).toHaveBeenLastCalledWith(
        "/api/sessions/session-abc123/chat",
        expect.objectContaining({ message: "Contact customer John" })
      );
      expect(response.agentId).toBe("agent-sales-001");
      expect(response.message).toBe("I will contact the customer now.");
      expect(response.tokenUsed).toBe(150);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it("should throw if agent not deployed", async () => {
      await expect(
        adapter.sendMessage("unknown", "hello")
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("getStatus", () => {
    it("should GET session details and return AgentStatus", async () => {
      mockClient.post.mockResolvedValue({ key: "session-abc123" });
      await adapter.deploy(testConfig);

      mockClient.get.mockResolvedValue({
        key: "session-abc123",
        status: "active",
      });

      const status = await adapter.getStatus("agent-sales-001");

      expect(mockClient.get).toHaveBeenCalledWith(
        "/api/sessions/session-abc123"
      );
      expect(status.id).toBe("agent-sales-001");
      expect(status.status).toBe("RUNNING");
    });
  });

  describe("listAgents", () => {
    it("should return all deployed agent statuses", async () => {
      mockClient.post
        .mockResolvedValueOnce({ key: "session-1" })
        .mockResolvedValueOnce({ key: "session-2" });

      await adapter.deploy(testConfig);
      await adapter.deploy({
        ...testConfig,
        id: "agent-support-001",
        name: "Support Agent",
      });

      mockClient.get
        .mockResolvedValueOnce({ key: "session-1", status: "active" })
        .mockResolvedValueOnce({ key: "session-2", status: "active" });

      const agents = await adapter.listAgents();
      expect(agents).toHaveLength(2);
    });
  });

  describe("healthCheck", () => {
    it("should GET /api/status and return true if OK", async () => {
      mockClient.get.mockResolvedValue({ status: "ok" });

      const healthy = await adapter.healthCheck();

      expect(mockClient.get).toHaveBeenCalledWith("/api/status");
      expect(healthy).toBe(true);
    });

    it("should return false if request fails", async () => {
      mockClient.get.mockRejectedValue(new Error("Connection refused"));

      const healthy = await adapter.healthCheck();
      expect(healthy).toBe(false);
    });
  });
});

describe("AdapterFactory", () => {
  it("should create MockAdapter for 'mock' engine", () => {
    const adapter = AdapterFactory.create("mock");
    expect(adapter).toBeInstanceOf(MockAdapter);
  });

  it("should create OpenClawAdapter for 'openclaw' engine", () => {
    const adapter = AdapterFactory.create("openclaw");
    expect(adapter).toBeInstanceOf(OpenClawAdapter);
  });

  it("should throw for unknown engine", () => {
    expect(() => AdapterFactory.create("unknown")).toThrow(/unknown engine/i);
  });

  it("should read AGENT_ENGINE env variable", () => {
    process.env.AGENT_ENGINE = "mock";
    const adapter = AdapterFactory.createFromEnv();
    expect(adapter).toBeInstanceOf(MockAdapter);
    delete process.env.AGENT_ENGINE;
  });

  it("should default to mock when AGENT_ENGINE not set", () => {
    delete process.env.AGENT_ENGINE;
    const adapter = AdapterFactory.createFromEnv();
    expect(adapter).toBeInstanceOf(MockAdapter);
  });
});
