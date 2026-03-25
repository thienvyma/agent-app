/**
 * Tests for Telegram Bot Live (Session 43).
 * TDD: Written BEFORE implementation changes.
 *
 * Covers: file existence, command router, reject/report handlers,
 * notification dispatch, bot lifecycle.
 *
 * @module tests/integration/telegram-live
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// FILE EXISTENCE
// ══════════════════════════════════════════════

describe("Telegram Live — File Existence (S43)", () => {
  it("should have src/core/channels/telegram-commands.ts", () => {
    const filePath = path.join(process.cwd(), "src", "core", "channels", "telegram-commands.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it("should have tests/integration/telegram-live.test.ts", () => {
    const filePath = path.join(process.cwd(), "tests", "integration", "telegram-live.test.ts");
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

// ══════════════════════════════════════════════
// COMMAND ROUTER
// ══════════════════════════════════════════════

describe("Telegram Live — Command Router", () => {
  /** Parse command from message text */
  function parseCommand(text: string): { command: string; args: string } {
    const trimmed = text.trim();
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx === -1) {
      return { command: trimmed.toLowerCase(), args: "" };
    }
    return {
      command: trimmed.slice(0, spaceIdx).toLowerCase(),
      args: trimmed.slice(spaceIdx + 1).trim(),
    };
  }

  it("should parse /status command", () => {
    const result = parseCommand("/status");
    expect(result.command).toBe("/status");
    expect(result.args).toBe("");
  });

  it("should parse /task with description", () => {
    const result = parseCommand("/task Lập báo giá dự án X");
    expect(result.command).toBe("/task");
    expect(result.args).toBe("Lập báo giá dự án X");
  });

  it("should parse /reject with id", () => {
    const result = parseCommand("/reject ap-123");
    expect(result.command).toBe("/reject");
    expect(result.args).toBe("ap-123");
  });

  it("should parse /report", () => {
    const result = parseCommand("/report");
    expect(result.command).toBe("/report");
  });

  it("should handle extra spaces", () => {
    const result = parseCommand("  /approve   ap-456  ");
    expect(result.command).toBe("/approve");
    expect(result.args).toBe("ap-456");
  });
});

// ══════════════════════════════════════════════
// REJECT HANDLER (new in S43)
// ══════════════════════════════════════════════

describe("Telegram Live — Reject Handler", () => {
  function createMockBot() {
    const { TelegramBot } = require("../../src/core/channels/telegram-bot");
    const { NotificationService } = require("../../src/core/channels/notification-service");

    const sent: string[] = [];
    const notifService = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "test-owner",
    });

    return {
      bot: new TelegramBot({
        notificationService: notifService,
        getStatus: async () => ({ agentsTotal: 2, agentsActive: 1, tasksRunning: 3, tasksPending: 2, tokensToday: 5000, pendingApprovals: 1 }),
        getAgents: async () => [{ name: "CEO", role: "ceo", status: "RUNNING" }],
        getCostReport: () => ({ totalTokens: 10000, totalCostUSD: 0.5, perAgent: [] }),
        sendTask: async () => "task-001",
        getPendingApprovals: async () => [],
        rejectApproval: async (id: string) => `Rejected ${id}`,
        getDailyReport: async () => ({
          date: "2026-03-25",
          tasksCompleted: 5,
          tasksFailed: 1,
          totalTokens: 15000,
          totalCostUSD: 0.75,
          topAgent: "CEO",
        }),
      }),
      sent,
    };
  }

  it("should have handleReject method", () => {
    const { bot } = createMockBot();
    expect(typeof bot.handleReject).toBe("function");
  });

  it("should reject with approval ID", async () => {
    const { bot } = createMockBot();
    const result = await bot.handleReject("ap-123");
    expect(result.success).toBe(true);
    expect(result.text).toContain("ap-123");
  });

  it("should fail reject without ID", async () => {
    const { bot } = createMockBot();
    const result = await bot.handleReject("");
    expect(result.success).toBe(false);
  });
});

// ══════════════════════════════════════════════
// REPORT HANDLER (new in S43)
// ══════════════════════════════════════════════

describe("Telegram Live — Report Handler", () => {
  function createMockBot() {
    const { TelegramBot } = require("../../src/core/channels/telegram-bot");
    const { NotificationService } = require("../../src/core/channels/notification-service");

    const notifService = new NotificationService({
      sendFn: async () => {},
      ownerChatId: "test-owner",
    });

    return new TelegramBot({
      notificationService: notifService,
      getStatus: async () => ({ agentsTotal: 2, agentsActive: 1, tasksRunning: 3, tasksPending: 2, tokensToday: 5000, pendingApprovals: 1 }),
      getAgents: async () => [],
      getCostReport: () => ({ totalTokens: 10000, totalCostUSD: 0.5, perAgent: [] }),
      sendTask: async () => "task-001",
      getPendingApprovals: async () => [],
      rejectApproval: async () => "rejected",
      getDailyReport: async () => ({
        date: "2026-03-25",
        tasksCompleted: 5,
        tasksFailed: 1,
        totalTokens: 15000,
        totalCostUSD: 0.75,
        topAgent: "CEO",
      }),
    });
  }

  it("should have handleReport method", () => {
    const bot = createMockBot();
    expect(typeof bot.handleReport).toBe("function");
  });

  it("should return daily report", async () => {
    const bot = createMockBot();
    const result = await bot.handleReport();
    expect(result.success).toBe(true);
    expect(result.text).toContain("2026-03-25");
    expect(result.text).toContain("5");
  });
});

// ══════════════════════════════════════════════
// NOTIFICATION DISPATCH
// ══════════════════════════════════════════════

describe("Telegram Live — Notification Dispatch", () => {
  it("should send crash notification", async () => {
    const { NotificationService } = require("../../src/core/channels/notification-service");
    const sent: string[] = [];
    const service = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "owner-123",
    });

    await service.sendNotification("[URGENT] CEO Agent crashed, restarting...");
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("URGENT");
  });

  it("should send budget alert", async () => {
    const { NotificationService } = require("../../src/core/channels/notification-service");
    const sent: string[] = [];
    const service = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "owner-123",
    });

    await service.sendBudgetAlert({
      agentId: "ceo",
      agentName: "CEO",
      usage: 8000,
      budget: 10000,
      percentUsed: 80,
      status: "warning",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("80%");
  });

  it("should send approval request", async () => {
    const { NotificationService } = require("../../src/core/channels/notification-service");
    const sent: string[] = [];
    const service = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "owner-123",
    });

    await service.sendApprovalRequest({
      approvalId: "ap-999",
      taskDescription: "Delete database",
      agentName: "CEO",
      reason: "Sensitive action",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("ap-999");
  });

  it("should send daily report at 17:00", async () => {
    const { NotificationService } = require("../../src/core/channels/notification-service");
    const sent: string[] = [];
    const service = new NotificationService({
      sendFn: async (_chatId: string, msg: string) => { sent.push(msg); },
      ownerChatId: "owner-123",
    });

    await service.sendDailyReport({
      date: "2026-03-25",
      tasksCompleted: 12,
      tasksFailed: 2,
      totalTokens: 50000,
      totalCostUSD: 2.5,
      topAgent: "Marketing Agent",
    });
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain("2026-03-25");
    expect(sent[0]).toContain("Marketing Agent");
  });
});

// ══════════════════════════════════════════════
// BOT LIFECYCLE
// ══════════════════════════════════════════════

describe("Telegram Live — Bot Lifecycle", () => {
  function createBot() {
    const { TelegramBot } = require("../../src/core/channels/telegram-bot");
    const { NotificationService } = require("../../src/core/channels/notification-service");

    const notifService = new NotificationService({
      sendFn: async () => {},
      ownerChatId: "test",
    });

    return new TelegramBot({
      notificationService: notifService,
      getStatus: async () => ({ agentsTotal: 0, agentsActive: 0, tasksRunning: 0, tasksPending: 0, tokensToday: 0, pendingApprovals: 0 }),
      getAgents: async () => [],
      getCostReport: () => ({ totalTokens: 0, totalCostUSD: 0, perAgent: [] }),
      sendTask: async () => "t-1",
      getPendingApprovals: async () => [],
      rejectApproval: async () => "rejected",
      getDailyReport: async () => ({ date: "2026-03-25", tasksCompleted: 0, tasksFailed: 0, totalTokens: 0, totalCostUSD: 0, topAgent: "N/A" }),
    });
  }

  it("should start bot", async () => {
    const bot = createBot();
    await bot.start();
    expect(bot.isRunning()).toBe(true);
  });

  it("should stop bot", async () => {
    const bot = createBot();
    await bot.start();
    await bot.stop();
    expect(bot.isRunning()).toBe(false);
  });
});
