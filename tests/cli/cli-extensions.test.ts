/**
 * Tests for CLI extensions — realtime, feedback, pipeline commands.
 * Phase 27: CLI Anything (FINAL SESSION).
 */

import { getRealtimeEventsData, getRealtimeStats } from "@/cli/commands/realtime";
import { getFeedbackListData, getFeedbackStats, previewPromptInjection } from "@/cli/commands/feedback";
import { getPipelineStatusData, formatPipelineExecution } from "@/cli/commands/pipeline";

describe("CLI: ae realtime", () => {
  describe("getRealtimeEventsData", () => {
    it("should return formatted event list", () => {
      const events = [
        { event: "agent:response", data: { agentId: "a-ceo" }, timestamp: Date.now() },
        { event: "task:completed", data: { taskId: "t-1" }, timestamp: Date.now() },
      ];

      const result = getRealtimeEventsData(events);
      expect(result).toHaveLength(2);
      expect(result[0]!.type).toBe("agent:response");
    });
  });

  describe("getRealtimeStats", () => {
    it("should return hub statistics", () => {
      const stats = getRealtimeStats({
        connectionCount: 3,
        totalEvents: 150,
        recentEventCount: 10,
        uptime: 3600,
      });

      expect(stats.connections).toBe(3);
      expect(stats.totalEvents).toBe(150);
      expect(stats.uptimeText).toBe("1h 0m");
    });
  });
});

describe("CLI: ae feedback", () => {
  describe("getFeedbackListData", () => {
    it("should format correction entries for CLI", () => {
      const entries = [
        { id: "corr-1", agentId: "a-fin", taskContext: "bao gia", ruleExtracted: "Rule #47", createdAt: new Date() },
        { id: "corr-2", agentId: "a-mkt", taskContext: "email", ruleExtracted: "Rule #23", createdAt: new Date() },
      ];

      const result = getFeedbackListData(entries);
      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe("corr-1");
      expect(result[0]!.rule).toBe("Rule #47");
    });
  });

  describe("getFeedbackStats", () => {
    it("should format stats for CLI", () => {
      const stats = getFeedbackStats({
        total: 5,
        byAgent: { "a-fin": 3, "a-mkt": 2 },
      });

      expect(stats.total).toBe(5);
      expect(stats.topAgent).toBe("a-fin");
    });
  });

  describe("previewPromptInjection", () => {
    it("should preview injected prompt", () => {
      const preview = previewPromptInjection({
        sop: "You are Finance Analyst",
        corrections: [{ ruleExtracted: "Rule #47: Include labor", taskContext: "pricing" }],
        knowledge: ["Price guide Q1"],
      });

      expect(preview).toContain("Finance Analyst");
      expect(preview).toContain("Rule #47");
      expect(preview).toContain("Price guide Q1");
    });
  });
});

describe("CLI: ae pipeline", () => {
  describe("getPipelineStatusData", () => {
    it("should return all 8 pipeline steps with status", () => {
      const status = getPipelineStatusData();
      expect(status.steps).toHaveLength(8);
      expect(status.steps[0]!.name).toBe("ApprovalPolicy");
      expect(status.steps[7]!.name).toBe("RealtimeHub");
    });
  });

  describe("formatPipelineExecution", () => {
    it("should format pipeline execution result", () => {
      const formatted = formatPipelineExecution({
        agentId: "a-ceo",
        message: "Strategic plan created",
        tokenUsed: 350,
        budgetStatus: "ok",
        contextInjected: true,
      });

      expect(formatted.agent).toBe("a-ceo");
      expect(formatted.response).toBe("Strategic plan created");
      expect(formatted.tokens).toBe(350);
      expect(formatted.budgetStatus).toBe("ok");
    });
  });
});
