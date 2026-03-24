import { MockAdapter } from "@/core/adapter/mock-adapter";
import { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";

describe("MockAdapter", () => {
  let adapter: MockAdapter;
  let testConfig: AgentConfig;

  beforeEach(() => {
    adapter = new MockAdapter();
    testConfig = {
      id: "agent-ceo-001",
      name: "CEO Agent",
      role: "ceo",
      sop: "Review daily reports, make strategic decisions",
      model: "qwen2.5:7b",
      tools: ["google_sheets", "email"],
      skills: ["strategic_planning"],
      isAlwaysOn: true,
      cronSchedule: "0 8 * * *",
    };
  });

  describe("deploy", () => {
    it("should deploy an agent and return RUNNING status", async () => {
      const status = await adapter.deploy(testConfig);

      expect(status.id).toBe("agent-ceo-001");
      expect(status.name).toBe("CEO Agent");
      expect(status.status).toBe("RUNNING");
      expect(status.lastActivity).toBeInstanceOf(Date);
      expect(status.tokenUsage).toBe(0);
    });

    it("should throw error when deploying same agent twice", async () => {
      await adapter.deploy(testConfig);

      await expect(adapter.deploy(testConfig)).rejects.toThrow(
        /already deployed/i
      );
    });
  });

  describe("undeploy", () => {
    it("should remove agent and make it unavailable", async () => {
      await adapter.deploy(testConfig);
      await adapter.undeploy("agent-ceo-001");

      const agents = await adapter.listAgents();
      expect(agents).toHaveLength(0);
    });

    it("should throw error when undeploying non-existent agent", async () => {
      await expect(adapter.undeploy("non-existent")).rejects.toThrow(
        /not found/i
      );
    });
  });

  describe("redeploy", () => {
    it("should update agent config and return new status", async () => {
      await adapter.deploy(testConfig);
      const status = await adapter.redeploy("agent-ceo-001", {
        model: "llama3:8b",
      });

      expect(status.status).toBe("RUNNING");
    });
  });

  describe("sendMessage", () => {
    it("should return AgentResponse with tokenUsed", async () => {
      await adapter.deploy(testConfig);
      const response = await adapter.sendMessage(
        "agent-ceo-001",
        "What is our revenue?"
      );

      expect(response.agentId).toBe("agent-ceo-001");
      expect(response.message).toBeTruthy();
      expect(response.tokenUsed).toBeGreaterThan(0);
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it("should throw error for non-deployed agent", async () => {
      await expect(
        adapter.sendMessage("non-existent", "hello")
      ).rejects.toThrow(/not found/i);
    });
  });

  describe("getStatus", () => {
    it("should return current status of deployed agent", async () => {
      await adapter.deploy(testConfig);
      const status = await adapter.getStatus("agent-ceo-001");

      expect(status.id).toBe("agent-ceo-001");
      expect(status.status).toBe("RUNNING");
    });
  });

  describe("listAgents", () => {
    it("should return all deployed agents", async () => {
      await adapter.deploy(testConfig);
      await adapter.deploy({
        ...testConfig,
        id: "agent-cfo-001",
        name: "CFO Agent",
        role: "cfo",
      });

      const agents = await adapter.listAgents();
      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.id)).toContain("agent-ceo-001");
      expect(agents.map((a) => a.id)).toContain("agent-cfo-001");
    });

    it("should return empty array when no agents deployed", async () => {
      const agents = await adapter.listAgents();
      expect(agents).toHaveLength(0);
    });
  });

  describe("healthCheck", () => {
    it("should return true", async () => {
      const healthy = await adapter.healthCheck();
      expect(healthy).toBe(true);
    });
  });
});
