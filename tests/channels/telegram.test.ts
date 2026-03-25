/**
 * Tests for NotificationService and TelegramBot.
 * Phase 20: Telegram Bot.
 *
 * Tests notification formatting, command routing, and pipeline integration.
 */

import { NotificationService } from "@/core/channels/notification-service";

describe("NotificationService", () => {
  let service: NotificationService;
  let sentMessages: { chatId: string; message: string }[];

  beforeEach(() => {
    sentMessages = [];
    service = new NotificationService({
      sendFn: async (chatId, message) => {
        sentMessages.push({ chatId, message });
      },
      ownerChatId: "owner-123",
    });
  });

  describe("sendNotification", () => {
    it("should send message to owner", async () => {
      await service.sendNotification("Task completed: Marketing plan");

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]!.chatId).toBe("owner-123");
      expect(sentMessages[0]!.message).toContain("Marketing plan");
    });
  });

  describe("formatStatus", () => {
    it("should format system status overview", () => {
      const result = service.formatStatus({
        agentsTotal: 5,
        agentsActive: 3,
        tasksRunning: 5,
        tasksPending: 3,
        tokensToday: 1234,
        pendingApprovals: 2,
      });

      expect(result).toContain("5");
      expect(result).toContain("3 active");
      expect(result).toContain("1,234");
      expect(result).toContain("2");
    });
  });

  describe("formatAgentList", () => {
    it("should format agents with status emojis", () => {
      const result = service.formatAgentList([
        { name: "CEO Agent", role: "CEO", status: "RUNNING" },
        { name: "Marketing", role: "MARKETING", status: "IDLE" },
        { name: "Finance", role: "FINANCE", status: "ERROR" },
      ]);

      expect(result).toContain("🟢");   // RUNNING
      expect(result).toContain("⚪");   // IDLE
      expect(result).toContain("🔴");   // ERROR
      expect(result).toContain("CEO Agent");
    });
  });

  describe("formatCostReport", () => {
    it("should format cost breakdown", () => {
      const result = service.formatCostReport({
        totalTokens: 5000,
        totalCostUSD: 0.025,
        perAgent: [
          { agentId: "a-1", totalTokens: 3000, estimatedCostUSD: 0.015 },
          { agentId: "a-2", totalTokens: 2000, estimatedCostUSD: 0.010 },
        ],
      });

      expect(result).toContain("5,000");
      expect(result).toContain("$0.025");
    });
  });

  describe("formatApprovalRequest", () => {
    it("should format approval with action buttons text", () => {
      const result = service.formatApprovalRequest({
        approvalId: "apr-1",
        taskDescription: "Send email to client X",
        agentName: "Marketing Agent",
        reason: "customer-facing content",
      });

      expect(result).toContain("Send email to client X");
      expect(result).toContain("Marketing Agent");
      expect(result).toContain("customer-facing");
    });
  });

  describe("sendApprovalRequest", () => {
    it("should send formatted approval to owner", async () => {
      await service.sendApprovalRequest({
        approvalId: "apr-1",
        taskDescription: "Deploy new feature",
        agentName: "CEO Agent",
        reason: "deployment",
      });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]!.message).toContain("Deploy new feature");
    });
  });

  describe("sendBudgetAlert", () => {
    it("should send budget warning with details", async () => {
      await service.sendBudgetAlert({
        agentId: "a-mkt",
        agentName: "Marketing",
        usage: 8500,
        budget: 10000,
        percentUsed: 85,
        status: "warning",
      });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]!.message).toContain("⚠️");
      expect(sentMessages[0]!.message).toContain("85%");
    });

    it("should send budget exceeded alert", async () => {
      await service.sendBudgetAlert({
        agentId: "a-mkt",
        agentName: "Marketing",
        usage: 12000,
        budget: 10000,
        percentUsed: 120,
        status: "exceeded",
      });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]!.message).toContain("🚨");
      expect(sentMessages[0]!.message).toContain("120%");
    });
  });

  describe("sendDailyReport", () => {
    it("should format and send daily report", async () => {
      await service.sendDailyReport({
        date: "2026-03-24",
        tasksCompleted: 12,
        tasksFailed: 1,
        totalTokens: 15000,
        totalCostUSD: 0.075,
        topAgent: "CEO Agent",
      });

      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]!.message).toContain("📊");
      expect(sentMessages[0]!.message).toContain("12");
      expect(sentMessages[0]!.message).toContain("2026-03-24");
    });
  });
});
