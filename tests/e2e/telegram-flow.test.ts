/**
 * E2E Telegram Flow Tests (Session 45).
 * Scenario 2: Owner commands via Telegram → pipeline → approval → response.
 *
 * @module tests/e2e/telegram-flow
 */

describe("E2E Telegram Flow — Command Handling", () => {
  function createBotWithPipeline() {
    const { TelegramBot } = require("../../src/core/channels/telegram-bot");
    const { NotificationService } = require("../../src/core/channels/notification-service");
    const { createServiceContainer, createPipelineFromContainer } = require("../../src/lib/service-container");

    const sent: string[] = [];
    const notifService = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "owner-test",
    });

    const container = createServiceContainer({ useMock: true, blockedPatterns: ["sensitive"] });
    const pipeline = createPipelineFromContainer(container);

    const bot = new TelegramBot({
      notificationService: notifService,
      getStatus: async () => ({
        agentsTotal: 3, agentsActive: 2, tasksRunning: 1,
        tasksPending: 0, tokensToday: 5000, pendingApprovals: 1,
      }),
      getAgents: async () => [
        { name: "CEO", role: "ceo", status: "RUNNING" },
        { name: "Marketing", role: "marketing", status: "RUNNING" },
      ],
      getCostReport: () => ({
        totalTokens: 5000, totalCostUSD: 0.025,
        perAgent: [{ agentId: "ceo", totalTokens: 3000, estimatedCostUSD: 0.015 }],
      }),
      sendTask: async (desc: string) => `task-${Date.now()}`,
      getPendingApprovals: async () => [{
        approvalId: "apr-1", taskDescription: "Send email",
        agentName: "Marketing", reason: "customer-facing",
      }],
      rejectApproval: async (id: string) => `Rejected ${id}`,
      getDailyReport: async () => ({
        date: "2026-03-25", tasksCompleted: 10, tasksFailed: 2,
        totalTokens: 50000, totalCostUSD: 0.25, topAgent: "CEO",
      }),
    });

    return { bot, sent, container, pipeline };
  }

  it("should handle /status and return formatted status", async () => {
    const { bot } = createBotWithPipeline();
    const result = await bot.handleStatus();
    expect(result.success).toBe(true);
    expect(result.text).toContain("Agents");
  });

  it("should handle /task and create task", async () => {
    const { bot } = createBotWithPipeline();
    const result = await bot.handleTask("Tính ROI dự án ABC");
    expect(result.success).toBe(true);
    expect(result.text).toContain("Task ID");
  });

  it("should handle /approve and list pending", async () => {
    const { bot } = createBotWithPipeline();
    const result = await bot.handleApprove();
    expect(result.success).toBe(true);
    expect(result.text).toContain("apr-1");
  });

  it("should handle /reject with ID", async () => {
    const { bot } = createBotWithPipeline();
    const result = await bot.handleReject("apr-1");
    expect(result.success).toBe(true);
    expect(result.text).toContain("apr-1");
  });

  it("should handle /report and return daily report", async () => {
    const { bot } = createBotWithPipeline();
    const result = await bot.handleReport();
    expect(result.success).toBe(true);
    expect(result.text).toContain("2026-03-25");
    expect(result.text).toContain("CEO");
  });

  it("should send notification via NotificationService", async () => {
    const { bot, sent } = createBotWithPipeline();
    const notifService = (bot as any).deps.notificationService;
    await notifService.sendNotification("[URGENT] Agent crashed");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("URGENT");
  });
});
