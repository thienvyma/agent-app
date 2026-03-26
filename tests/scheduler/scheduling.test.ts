/**
 * Tests for Agent Scheduling modules.
 * Phase 29: Agent Scheduling (Hybrid).
 *
 * Tests: ScheduleManager (WRAP), AlwaysOnManager (BUILD),
 *        AutoDelegator (BUILD), DailyReportGenerator (BUILD).
 */

import { ScheduleManager, type ScheduledJob } from "@/core/scheduler/schedule-manager";
import { AlwaysOnManager, type WorkingHours } from "@/core/scheduler/always-on";
import { AutoDelegator } from "@/core/scheduler/auto-delegator";
import { DailyReportGenerator } from "@/core/scheduler/daily-report";

describe("ScheduleManager (WRAP OpenClaw cron)", () => {
  let manager: ScheduleManager;

  beforeEach(() => {
    manager = new ScheduleManager();
  });

  describe("registerJob", () => {
    it("should register a cron job and return command for OpenClaw", async () => {
      const result = await manager.registerJob({
        name: "CEO daily check",
        cronExpression: "0 6 * * *",
        agentId: "ceo-001",
        taskTemplate: "Check email and report",
      });

      expect(result.jobId).toBeDefined();
      expect(result.openclawCommand).toContain("cron");
      expect(result.openclawCommand).toContain("0 6 * * *");
    });
  });

  describe("listJobs", () => {
    it("should list all registered jobs", async () => {
      await manager.registerJob({ name: "j1", cronExpression: "0 6 * * *", agentId: "ceo", taskTemplate: "t1" });
      await manager.registerJob({ name: "j2", cronExpression: "0 17 * * *", agentId: "ceo", taskTemplate: "t2" });

      const jobs = manager.listJobs();
      expect(jobs).toHaveLength(2);
    });
  });

  describe("removeJob", () => {
    it("should remove a job by id", async () => {
      const { jobId } = await manager.registerJob({ name: "temp", cronExpression: "* * * * *", agentId: "ceo", taskTemplate: "t" });
      await manager.removeJob(jobId);

      expect(manager.listJobs()).toHaveLength(0);
    });
  });

  describe("pauseJob / resumeJob", () => {
    it("should toggle job enabled state", async () => {
      const { jobId } = await manager.registerJob({ name: "j1", cronExpression: "0 6 * * *", agentId: "ceo", taskTemplate: "t" });

      await manager.pauseJob(jobId);
      expect(manager.listJobs()[0]!.enabled).toBe(false);

      await manager.resumeJob(jobId);
      expect(manager.listJobs()[0]!.enabled).toBe(true);
    });
  });
});

describe("AlwaysOnManager (BUILD)", () => {
  let manager: AlwaysOnManager;

  beforeEach(() => {
    manager = new AlwaysOnManager();
  });

  describe("checkAgentHealth", () => {
    it("should detect healthy agent", () => {
      const result = manager.checkAgentHealth({ sessionKey: "ceo-001", responding: true, lastActivity: Date.now() });
      expect(result.status).toBe("healthy");
    });

    it("should detect crashed agent (not responding)", () => {
      const result = manager.checkAgentHealth({ sessionKey: "ceo-001", responding: false, lastActivity: Date.now() - 60000 });
      expect(result.status).toBe("crashed");
      expect(result.action).toBe("restart");
    });

    it("should detect stale agent (no activity > threshold)", () => {
      const result = manager.checkAgentHealth({ sessionKey: "ceo-001", responding: true, lastActivity: Date.now() - 600000 });
      expect(result.status).toBe("stale");
    });
  });

  describe("isWithinWorkingHours", () => {
    it("should return true during working hours", () => {
      const hours: WorkingHours = { start: "08:00", end: "17:00", timezone: "Asia/Ho_Chi_Minh", weekdays: [1, 2, 3, 4, 5] };
      // Test with a known weekday 10AM
      const testDate = new Date("2026-03-24T10:00:00+07:00");
      expect(manager.isWithinWorkingHours(hours, testDate)).toBe(true);
    });

    it("should return false outside working hours", () => {
      const hours: WorkingHours = { start: "08:00", end: "17:00", timezone: "Asia/Ho_Chi_Minh", weekdays: [1, 2, 3, 4, 5] };
      const testDate = new Date("2026-03-24T22:00:00+07:00");
      expect(manager.isWithinWorkingHours(hours, testDate)).toBe(false);
    });
  });

  describe("shouldProcessTask", () => {
    it("should allow urgent tasks in night mode", () => {
      const result = manager.shouldProcessTask(9, false);
      expect(result).toBe(true);
    });

    it("should block non-urgent tasks in night mode", () => {
      const result = manager.shouldProcessTask(3, false);
      expect(result).toBe(false);
    });
  });
});

describe("AutoDelegator (BUILD)", () => {
  let delegator: AutoDelegator;

  beforeEach(() => {
    delegator = new AutoDelegator({
      agents: [
        { id: "ceo-001", role: "CEO", department: "executive", status: "running", budgetRemaining: 50000 },
        { id: "mkt-001", role: "Marketing", department: "marketing", status: "running", budgetRemaining: 30000 },
        { id: "fin-001", role: "Finance", department: "finance", status: "running", budgetRemaining: 20000 },
        { id: "dev-001", role: "Developer", department: "engineering", status: "idle", budgetRemaining: 0 },
      ],
    });
  });

  describe("getSuggestion", () => {
    it("should suggest Marketing for content tasks", () => {
      const suggestion = delegator.getSuggestion("Viet content marketing Q2");
      expect(suggestion.agentId).toBe("mkt-001");
      expect(suggestion.confidence).toBeGreaterThan(0.5);
    });

    it("should suggest Finance for financial tasks", () => {
      const suggestion = delegator.getSuggestion("Tinh ROI du an moi");
      expect(suggestion.agentId).toBe("fin-001");
    });

    it("should suggest CEO for strategic tasks", () => {
      const suggestion = delegator.getSuggestion("Lap ke hoach chien luoc Q3");
      expect(suggestion.agentId).toBe("ceo-001");
    });
  });

  describe("delegateTask", () => {
    it("should delegate to suggested agent", () => {
      const result = delegator.delegateTask("Viet bai blog ve AI");
      expect(result.assignedTo).toBe("mkt-001");
      expect(result.reason).toBeDefined();
    });

    it("should skip agents with no budget", () => {
      const result = delegator.delegateTask("Deploy new feature");
      // dev-001 has 0 budget, should not be assigned
      expect(result.assignedTo).not.toBe("dev-001");
    });
  });
});

describe("DailyReportGenerator (BUILD)", () => {
  let generator: DailyReportGenerator;

  beforeEach(() => {
    generator = new DailyReportGenerator();
  });

  describe("generate", () => {
    it("should generate daily report from stats", () => {
      const report = generator.generate({
        tasksCompleted: 15,
        tasksFailed: 2,
        tasksPending: 5,
        totalTokens: 45000,
        approvals: { pending: 1, approved: 8, rejected: 2 },
        corrections: 3,
        agentStats: [
          { agentId: "ceo-001", name: "CEO", tasksCompleted: 5, tokensUsed: 20000 },
          { agentId: "mkt-001", name: "Marketing", tasksCompleted: 10, tokensUsed: 25000 },
        ],
      });

      expect(report.date).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.tasksCompleted).toBe(15);
      expect(report.totalTokens).toBe(45000);
    });
  });

  describe("formatForTelegram", () => {
    it("should format report with emojis for Telegram", () => {
      const report = generator.generate({
        tasksCompleted: 10, tasksFailed: 1, tasksPending: 3,
        totalTokens: 30000, approvals: { pending: 0, approved: 5, rejected: 1 },
        corrections: 2, agentStats: [],
      });

      const text = generator.formatForTelegram(report);
      expect(text).toContain("📊");
      expect(text).toContain("10");
      expect(text).toContain("30000");
    });
  });
});

// ============================================================
// Session 68: OpenClaw Cron + Health Enhancement Tests
// ============================================================

describe("ScheduleManager (OpenClaw Cron Enhancement)", () => {
  let manager: ScheduleManager;
  let mockCli: jest.Mock;

  beforeEach(() => {
    mockCli = jest.fn().mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    manager = new ScheduleManager({ cliExecutor: mockCli });
  });

  describe("registerJob with CLI", () => {
    it("should call cronAdd via CLI when executor provided", async () => {
      mockCli.mockResolvedValue({ stdout: '{"id":"cron-1"}', stderr: "", exitCode: 0, json: { id: "cron-1" } });

      const result = await manager.registerJob({
        name: "CEO daily check",
        cronExpression: "0 6 * * *",
        agentId: "ceo-001",
        taskTemplate: "Check email and report",
      });

      expect(result.jobId).toBeDefined();
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "add"]),
        expect.any(Number)
      );
    });
  });

  describe("removeJob with CLI", () => {
    it("should call cronRemove via CLI when executor provided", async () => {
      mockCli.mockResolvedValue({ stdout: '{"id":"cron-1"}', stderr: "", exitCode: 0, json: { id: "cron-1" } });
      const { jobId } = await manager.registerJob({
        name: "temp", cronExpression: "* * * * *", agentId: "ceo", taskTemplate: "t",
      });

      await manager.removeJob(jobId);

      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "rm"]),
        expect.any(Number)
      );
    });
  });

  describe("pauseJob / resumeJob with CLI", () => {
    it("should call cronDisable and cronEnable via CLI", async () => {
      mockCli.mockResolvedValue({ stdout: '{"id":"cron-1"}', stderr: "", exitCode: 0, json: { id: "cron-1" } });
      const { jobId } = await manager.registerJob({
        name: "j1", cronExpression: "0 6 * * *", agentId: "ceo", taskTemplate: "t",
      });

      await manager.pauseJob(jobId);
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "disable"]),
        expect.any(Number)
      );

      await manager.resumeJob(jobId);
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "enable"]),
        expect.any(Number)
      );
    });
  });

  describe("getJobHistory", () => {
    it("should return cron run history from CLI", async () => {
      mockCli.mockResolvedValue({
        stdout: '{"runs":[{"id":"run-1","status":"ok","timestamp":"2026-03-26T10:00:00Z"}]}',
        stderr: "", exitCode: 0,
        json: { runs: [{ id: "run-1", status: "ok", timestamp: "2026-03-26T10:00:00Z" }] },
      });

      const history = await manager.getJobHistory("cron-1");
      expect(history).toBeDefined();
      expect(Array.isArray(history)).toBe(true);
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "runs"]),
        expect.any(Number)
      );
    });
  });

  describe("runJobNow", () => {
    it("should trigger immediate job execution via CLI", async () => {
      mockCli.mockResolvedValue({ stdout: '{"status":"triggered"}', stderr: "", exitCode: 0, json: { status: "triggered" } });

      const result = await manager.runJobNow("cron-1");
      expect(result.success).toBe(true);
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["cron", "run"]),
        expect.any(Number)
      );
    });
  });

  describe("graceful fallback", () => {
    it("should still work in-memory when CLI fails", async () => {
      mockCli.mockRejectedValue(new Error("CLI not found"));

      const result = await manager.registerJob({
        name: "fallback job", cronExpression: "0 9 * * *", agentId: "ceo-001", taskTemplate: "Test",
      });

      expect(result.jobId).toBeDefined();
      expect(manager.listJobs()).toHaveLength(1);
    });
  });
});

describe("AlwaysOnManager (OpenClaw Health Enhancement)", () => {
  let manager: AlwaysOnManager;
  let mockCli: jest.Mock;

  beforeEach(() => {
    mockCli = jest.fn().mockResolvedValue({ stdout: "", stderr: "", exitCode: 0 });
    manager = new AlwaysOnManager({ cliExecutor: mockCli });
  });

  describe("checkAgentHealthAuto", () => {
    it("should auto-query OpenClaw sessions and return health", async () => {
      mockCli.mockResolvedValue({
        stdout: '{"sessions":[{"key":"agent:ceo:main","active":true}]}',
        stderr: "", exitCode: 0,
        json: { sessions: [{ key: "agent:ceo:main", active: true }] },
      });

      const result = await manager.checkAgentHealthAuto("ceo");
      expect(result.status).toBe("healthy");
      expect(mockCli).toHaveBeenCalledWith(
        expect.arrayContaining(["sessions"]),
        expect.any(Number)
      );
    });

    it("should detect no-session agent as crashed", async () => {
      mockCli.mockResolvedValue({
        stdout: '{"sessions":[]}', stderr: "", exitCode: 0,
        json: { sessions: [] },
      });

      const result = await manager.checkAgentHealthAuto("missing-agent");
      expect(result.status).toBe("crashed");
      expect(result.action).toBe("restart");
    });
  });

  describe("getSystemHealth", () => {
    it("should return parsed system health from CLI", async () => {
      mockCli.mockResolvedValue({
        stdout: '{"status":"ok","services":{"gateway":"running","ollama":"running"}}',
        stderr: "", exitCode: 0,
        json: { status: "ok", services: { gateway: "running", ollama: "running" } },
      });

      const health = await manager.getSystemHealth();
      expect(health.status).toBe("ok");
      expect(health.services).toBeDefined();
    });
  });

  describe("getPresence", () => {
    it("should return agent presence from CLI", async () => {
      mockCli.mockResolvedValue({
        stdout: '{"agents":[{"id":"ceo","online":true}]}',
        stderr: "", exitCode: 0,
        json: { agents: [{ id: "ceo", online: true }] },
      });

      const presence = await manager.getPresence();
      expect(presence).toBeDefined();
      expect(Array.isArray(presence)).toBe(true);
    });
  });
});
