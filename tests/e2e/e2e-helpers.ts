/**
 * E2E Test Helpers — factory functions for fully wired test pipeline.
 *
 * Creates mock-backed instances of all core modules for integration testing.
 *
 * @module tests/e2e/e2e-helpers
 */

import { AgentPipeline } from "@/core/orchestrator/agent-pipeline";
import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";
import { RealtimeHub } from "@/core/realtime/realtime-hub";
import { NotificationService } from "@/core/channels/notification-service";
import { TelegramBot } from "@/core/channels/telegram-bot";

/** Mock engine that returns configurable responses — implements full IAgentEngine */
export function createMockEngine(responses: Record<string, string> = {}) {
  return {
    deploy: jest.fn().mockResolvedValue({ agentId: "mock", runningState: "RUNNING" }),
    undeploy: jest.fn().mockResolvedValue(undefined),
    redeploy: jest.fn().mockResolvedValue({ agentId: "mock", runningState: "RUNNING" }),
    sendMessage: jest.fn().mockImplementation(async (agentId: string, message: string) => ({
      agentId,
      message: responses[agentId] ?? `Mock response for: ${message}`,
      tokenUsed: Math.floor(Math.random() * 500) + 100,
      timestamp: Date.now(),
    })),
    getStatus: jest.fn().mockResolvedValue({ agentId: "mock", runningState: "RUNNING" }),
    listAgents: jest.fn().mockResolvedValue([]),
    healthCheck: jest.fn().mockResolvedValue(true),
  };
}

/** Mock context builder */
export function createMockContextBuilder() {
  return {
    build: jest.fn().mockResolvedValue("Context: company history and corrections"),
  };
}

/** Mock message bus */
export function createMockMessageBus() {
  const published: { channel: string; data: unknown }[] = [];
  return {
    publish: jest.fn().mockImplementation((channel: string, data: unknown) => {
      published.push({ channel, data });
    }),
    getPublished: () => published,
  };
}

/** Mock approval policy */
export function createMockApprovalPolicy(blockedTasks: string[] = []) {
  return {
    evaluate: jest.fn().mockImplementation((taskDescription: string) => {
      const blocked = blockedTasks.some((t) => taskDescription.includes(t));
      return {
        decision: blocked ? "approval-required" : "approved",
        matchedRules: blocked ? ["customer-facing"] : [],
      };
    }),
  };
}

/** Mock conversation logger */
export function createMockConversationLogger() {
  const logs: { agentId: string; role: string; content: string }[] = [];
  return {
    log: jest.fn().mockImplementation(async (agentId: string, role: string, content: string) => {
      logs.push({ agentId, role, content });
    }),
    getLogs: () => logs,
  };
}

/** Create fully wired test pipeline with all modules */
export function createTestPipeline(options: {
  responses?: Record<string, string>;
  blockedTasks?: string[];
} = {}) {
  const engine = createMockEngine(options.responses);
  const contextBuilder = createMockContextBuilder();
  const costTracker = new CostTracker();
  const budgetManager = new BudgetManager(costTracker);
  const messageBus = createMockMessageBus();
  const approvalPolicy = createMockApprovalPolicy(options.blockedTasks);
  const conversationLogger = createMockConversationLogger();
  const realtimeHub = new RealtimeHub();

  const pipeline = new AgentPipeline({
    engine,
    contextBuilder,
    costTracker,
    budgetManager,
    messageBus,
    approvalPolicy,
    conversationLogger,
    realtimeHub,
  });

  return {
    pipeline,
    engine,
    contextBuilder,
    costTracker,
    budgetManager,
    messageBus,
    approvalPolicy,
    conversationLogger,
    realtimeHub,
  };
}

/** Create test Telegram bot */
export function createTestTelegramBot() {
  const sentMessages: { chatId: string; message: string }[] = [];
  const notificationService = new NotificationService({
    sendFn: async (chatId, message) => {
      sentMessages.push({ chatId, message });
    },
    ownerChatId: "owner-test",
  });

  const bot = new TelegramBot({
    notificationService,
    getStatus: async () => ({
      agentsTotal: 3,
      agentsActive: 3,
      tasksRunning: 2,
      tasksPending: 1,
      tokensToday: 1500,
      pendingApprovals: 1,
    }),
    getAgents: async () => [
      { name: "CEO", role: "CEO", status: "RUNNING" },
      { name: "Marketing", role: "MARKETING", status: "RUNNING" },
      { name: "Finance", role: "FINANCE", status: "RUNNING" },
    ],
    getCostReport: () => ({
      totalTokens: 1500,
      totalCostUSD: 0.0075,
      perAgent: [
        { agentId: "a-ceo", totalTokens: 800, estimatedCostUSD: 0.004 },
        { agentId: "a-mkt", totalTokens: 500, estimatedCostUSD: 0.0025 },
        { agentId: "a-fin", totalTokens: 200, estimatedCostUSD: 0.001 },
      ],
    }),
    sendTask: async (desc) => `task-${Date.now()}`,
    getPendingApprovals: async () => [{
      approvalId: "apr-1",
      taskDescription: "Send email to customer",
      agentName: "Marketing",
      reason: "customer-facing",
    }],
  });

  return { bot, notificationService, sentMessages };
}
