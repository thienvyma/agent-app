/**
 * Tests for AgentOrchestrator, HealthMonitor, and CEOAgentConfig.
 * Uses mocked IAgentEngine and Prisma — no real OpenClaw or DB needed.
 */

import { AgentOrchestrator } from "@/core/orchestrator/agent-orchestrator";
import { HealthMonitor } from "@/core/orchestrator/health-monitor";
import { CEOAgentConfig, buildDefaultCEOConfig } from "@/core/orchestrator/ceo-agent-config";
import type { IAgentEngine } from "@/core/adapter/i-agent-engine";
import type { AgentConfig, AgentStatus, AgentResponse } from "@/types/agent";

// Mock engine
const createMockEngine = (): jest.Mocked<IAgentEngine> => ({
  deploy: jest.fn(),
  undeploy: jest.fn(),
  redeploy: jest.fn(),
  sendMessage: jest.fn(),
  getStatus: jest.fn(),
  listAgents: jest.fn(),
  healthCheck: jest.fn(),
});

// Mock Prisma
const createMockDb = () => ({
  agent: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
});

describe("AgentOrchestrator", () => {
  let orchestrator: AgentOrchestrator;
  let mockEngine: jest.Mocked<IAgentEngine>;
  let mockDb: ReturnType<typeof createMockDb>;

  const dbAgent = {
    id: "agent-ceo-001",
    name: "CEO Agent",
    role: "ceo",
    sop: "Manage company",
    model: "qwen2.5:7b",
    tools: ["email"],
    skills: ["leadership"],
    isAlwaysOn: true,
    cronSchedule: "*/5 * * * *",
    status: "IDLE",
    department: { id: "dept-exec", name: "Executive" },
    toolPermissions: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = createMockEngine();
    mockDb = createMockDb();
    orchestrator = new AgentOrchestrator(mockEngine, mockDb as never);
  });

  describe("deploy", () => {
    it("should load agent from DB, deploy via engine, and update DB status", async () => {
      mockDb.agent.findUnique.mockResolvedValue(dbAgent);
      mockEngine.deploy.mockResolvedValue({
        id: "agent-ceo-001",
        name: "CEO Agent",
        status: "RUNNING",
        lastActivity: new Date(),
        tokenUsage: 0,
      } as AgentStatus);
      mockDb.agent.update.mockResolvedValue({ ...dbAgent, status: "RUNNING" });
      mockDb.auditLog.create.mockResolvedValue({});

      const status = await orchestrator.deploy("agent-ceo-001");

      expect(mockDb.agent.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "agent-ceo-001" } })
      );
      expect(mockEngine.deploy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "agent-ceo-001",
          name: "CEO Agent",
          role: "ceo",
          model: "qwen2.5:7b",
        })
      );
      expect(mockDb.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "agent-ceo-001" },
          data: expect.objectContaining({ status: "RUNNING" }),
        })
      );
      expect(status.status).toBe("RUNNING");
    });

    it("should throw if agent not found in DB", async () => {
      mockDb.agent.findUnique.mockResolvedValue(null);
      await expect(orchestrator.deploy("unknown")).rejects.toThrow(/not found/i);
    });
  });

  describe("undeploy", () => {
    it("should call engine.undeploy and update DB status to IDLE", async () => {
      mockDb.agent.findUnique.mockResolvedValue(dbAgent);
      mockEngine.undeploy.mockResolvedValue(undefined);
      mockDb.agent.update.mockResolvedValue({ ...dbAgent, status: "IDLE" });
      mockDb.auditLog.create.mockResolvedValue({});

      await orchestrator.undeploy("agent-ceo-001");

      expect(mockEngine.undeploy).toHaveBeenCalledWith("agent-ceo-001");
      expect(mockDb.agent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "IDLE" }),
        })
      );
    });
  });

  describe("redeploy", () => {
    it("should undeploy then deploy (atomic)", async () => {
      mockDb.agent.findUnique.mockResolvedValue(dbAgent);
      mockEngine.undeploy.mockResolvedValue(undefined);
      mockEngine.deploy.mockResolvedValue({
        id: "agent-ceo-001", name: "CEO Agent",
        status: "RUNNING", lastActivity: new Date(), tokenUsage: 0,
      } as AgentStatus);
      mockDb.agent.update.mockResolvedValue({ ...dbAgent, status: "RUNNING" });
      mockDb.auditLog.create.mockResolvedValue({});

      const status = await orchestrator.redeploy("agent-ceo-001");

      expect(mockEngine.undeploy).toHaveBeenCalled();
      expect(mockEngine.deploy).toHaveBeenCalled();
      expect(status.status).toBe("RUNNING");
    });
  });

  describe("deployAll", () => {
    it("should deploy only isAlwaysOn agents", async () => {
      const agents = [
        { ...dbAgent, id: "agent-ceo-001", isAlwaysOn: true },
        { ...dbAgent, id: "agent-mkt-001", isAlwaysOn: false },
      ];
      mockDb.agent.findMany.mockResolvedValue(agents.filter((a) => a.isAlwaysOn));
      mockDb.agent.findUnique.mockResolvedValue(agents[0]);
      mockEngine.deploy.mockResolvedValue({
        id: "agent-ceo-001", name: "CEO Agent",
        status: "RUNNING", lastActivity: new Date(), tokenUsage: 0,
      } as AgentStatus);
      mockDb.agent.update.mockResolvedValue({ ...agents[0], status: "RUNNING" });
      mockDb.auditLog.create.mockResolvedValue({});

      await orchestrator.deployAll();

      expect(mockDb.agent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isAlwaysOn: true } })
      );
      expect(mockEngine.deploy).toHaveBeenCalledTimes(1);
    });
  });
});

describe("HealthMonitor", () => {
  let monitor: HealthMonitor;
  let mockEngine: jest.Mocked<IAgentEngine>;
  let mockDb: ReturnType<typeof createMockDb>;
  let orchestrator: AgentOrchestrator;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockEngine = createMockEngine();
    mockDb = createMockDb();
    orchestrator = new AgentOrchestrator(mockEngine, mockDb as never);
    monitor = new HealthMonitor(orchestrator, mockEngine, mockDb as never, 30000);
  });

  afterEach(() => {
    monitor.stop();
    jest.useRealTimers();
  });

  it("should detect ERROR status and trigger auto-restart", async () => {
    mockEngine.listAgents.mockResolvedValue([
      { id: "agent-ceo-001", name: "CEO", status: "ERROR", lastActivity: new Date(), tokenUsage: 0 },
    ]);
    // Mock redeploy chain
    mockDb.agent.findUnique.mockResolvedValue({
      id: "agent-ceo-001", name: "CEO", role: "ceo", sop: "", model: "qwen2.5:7b",
      tools: [], skills: [], isAlwaysOn: true, status: "ERROR",
      department: { id: "d1", name: "Exec" }, toolPermissions: [],
    });
    mockEngine.undeploy.mockResolvedValue(undefined);
    mockEngine.deploy.mockResolvedValue({
      id: "agent-ceo-001", name: "CEO", status: "RUNNING",
      lastActivity: new Date(), tokenUsage: 0,
    } as AgentStatus);
    mockDb.agent.update.mockResolvedValue({});
    mockDb.auditLog.create.mockResolvedValue({});

    const report = await monitor.checkAll();

    expect(report.unhealthy).toHaveLength(1);
    expect(report.restarted).toHaveLength(1);
  });

  it("should escalate after max retries (3)", async () => {
    mockDb.auditLog.create.mockResolvedValue({});

    // Simulate 3 failed restarts
    const mockRedeploy = jest.spyOn(orchestrator, "redeploy")
      .mockRejectedValue(new Error("deploy failed"));

    const escalated = await monitor.autoRestart("agent-ceo-001", 3);

    expect(escalated).toBe(true);
    expect(mockRedeploy).toHaveBeenCalledTimes(3);
    expect(mockDb.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "ESCALATION" }),
      })
    );
  });
});

describe("CEOAgentConfig", () => {
  it("should have default delegation rules", () => {
    const config = buildDefaultCEOConfig();

    expect(config.pollIntervalMs).toBe(300000);
    expect(config.delegationRules.length).toBeGreaterThan(0);

    const marketingRule = config.delegationRules.find(
      (r) => r.targetRole === "marketing"
    );
    expect(marketingRule).toBeDefined();
    expect(marketingRule?.keywords).toContain("marketing");
  });

  it("should have escalation policy", () => {
    const config = buildDefaultCEOConfig();

    expect(config.escalationPolicy).toBeDefined();
    expect(config.escalationPolicy.maxRetries).toBe(3);
    expect(config.escalationPolicy.notifyOwner).toBe(true);
  });

  it("should match task to correct delegation rule", () => {
    const config = buildDefaultCEOConfig();

    const matchRule = (desc: string) =>
      config.delegationRules.find((r) =>
        r.keywords.some((k) => desc.toLowerCase().includes(k))
      );

    expect(matchRule("Viết content marketing cho Facebook")?.targetRole).toBe("marketing");
    expect(matchRule("Phân tích báo cáo tài chính")?.targetRole).toBe("finance");
  });
});
