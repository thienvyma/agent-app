/**
 * Integration tests for AgentPipeline.
 * Proves ALL modules are WIRED into the actual execution flow.
 *
 * Integration Session — fixes gap identified in S8-S18 audit.
 * Tests: IAgentEngine, ContextBuilder, CostTracker, BudgetManager,
 *        MessageBus, ApprovalPolicy, ConversationLogger.
 */

import { AgentPipeline } from "@/core/orchestrator/agent-pipeline";
import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";

// Mock IAgentEngine (OpenClaw)
const createMockEngine = () => ({
  sendMessage: jest.fn().mockResolvedValue({
    agentId: "a-ceo",
    message: "I'll handle the marketing plan.",
    tokenUsed: 150,
    timestamp: new Date(),
  }),
  deploy: jest.fn(),
  undeploy: jest.fn(),
  redeploy: jest.fn(),
  getStatus: jest.fn(),
  listAgents: jest.fn(),
  healthCheck: jest.fn(),
});

const createMockContextBuilder = () => ({
  build: jest.fn().mockResolvedValue("Company: Acme Corp. Recent: Q1 report."),
});

const createMockMessageBus = () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
});

const createMockApprovalPolicy = () => ({
  evaluate: jest.fn().mockReturnValue({ decision: "auto-approved", matchedRules: [] }),
});

const createMockConversationLogger = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

describe("AgentPipeline — Integration", () => {
  let pipeline: AgentPipeline;
  let mockEngine: ReturnType<typeof createMockEngine>;
  let mockContextBuilder: ReturnType<typeof createMockContextBuilder>;
  let mockMessageBus: ReturnType<typeof createMockMessageBus>;
  let mockApprovalPolicy: ReturnType<typeof createMockApprovalPolicy>;
  let mockConversationLogger: ReturnType<typeof createMockConversationLogger>;
  let costTracker: CostTracker;
  let budgetManager: BudgetManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEngine = createMockEngine();
    mockContextBuilder = createMockContextBuilder();
    mockMessageBus = createMockMessageBus();
    mockApprovalPolicy = createMockApprovalPolicy();
    mockConversationLogger = createMockConversationLogger();
    costTracker = new CostTracker();
    budgetManager = new BudgetManager(costTracker);

    pipeline = new AgentPipeline({
      engine: mockEngine,
      contextBuilder: mockContextBuilder,
      costTracker,
      budgetManager,
      messageBus: mockMessageBus,
      approvalPolicy: mockApprovalPolicy,
      conversationLogger: mockConversationLogger,
    });
  });

  // === Step 1: ApprovalPolicy (S15) ===
  it("should check ApprovalPolicy before sending message", async () => {
    await pipeline.execute("a-ceo", "Plan Q2");

    expect(mockApprovalPolicy.evaluate).toHaveBeenCalledWith("Plan Q2");
    expect(mockEngine.sendMessage).toHaveBeenCalled();
  });

  it("should block message when approval required", async () => {
    mockApprovalPolicy.evaluate.mockReturnValue({
      decision: "approval-required",
      matchedRules: ["customer-facing"],
    });

    await expect(
      pipeline.execute("a-ceo", "Send email to client")
    ).rejects.toThrow("Approval required: matched rules [customer-facing]");

    // Engine should NOT be called
    expect(mockEngine.sendMessage).not.toHaveBeenCalled();
    // Cost should NOT be tracked
    expect(costTracker.getTotalToday()).toBe(0);
  });

  // === Step 2: ContextBuilder (S12) ===
  it("should inject context from ContextBuilder into engine call", async () => {
    await pipeline.execute("a-ceo", "Plan Q2 marketing");

    expect(mockContextBuilder.build).toHaveBeenCalledWith("a-ceo");
    expect(mockEngine.sendMessage).toHaveBeenCalledWith(
      "a-ceo",
      "Plan Q2 marketing",
      "Company: Acme Corp. Recent: Q1 report."
    );
  });

  it("should skip context gracefully if ContextBuilder fails", async () => {
    mockContextBuilder.build.mockRejectedValue(new Error("No context"));

    const response = await pipeline.execute("a-ceo", "No context available");

    expect(mockEngine.sendMessage).toHaveBeenCalledWith(
      "a-ceo", "No context available", undefined
    );
    expect(response.contextInjected).toBe(false);
  });

  // === Step 3+4: IAgentEngine + CostTracker (S3-4, S18) ===
  it("should track cost via CostTracker after engine response", async () => {
    await pipeline.execute("a-ceo", "Analyze competitors");

    const usage = costTracker.getAgentUsage("a-ceo");
    expect(usage.totalTokens).toBe(150);
  });

  it("should NOT track cost if engine fails", async () => {
    mockEngine.sendMessage.mockRejectedValue(new Error("OpenClaw down"));

    await expect(pipeline.execute("a-ceo", "Fail")).rejects.toThrow("OpenClaw down");
    expect(costTracker.getTotalToday()).toBe(0);
  });

  // === Step 5: BudgetManager (S18) ===
  it("should return budget status from BudgetManager", async () => {
    budgetManager.setBudget("a-ceo", 1000);
    const response = await pipeline.execute("a-ceo", "Write report");

    expect(response.budgetStatus).toBe("ok");
  });

  it("should return warning when budget 80-99%", async () => {
    budgetManager.setBudget("a-ceo", 180);
    const response = await pipeline.execute("a-ceo", "Big task");

    expect(response.budgetStatus).toBe("warning");
  });

  it("should return exceeded when budget >= 100%", async () => {
    budgetManager.setBudget("a-ceo", 100);
    const response = await pipeline.execute("a-ceo", "Over budget");

    expect(response.budgetStatus).toBe("exceeded");
  });

  // === Step 6: ConversationLogger (S10) ===
  it("should log conversation via ConversationLogger", async () => {
    await pipeline.execute("a-ceo", "Hello agent");

    expect(mockConversationLogger.log).toHaveBeenCalledTimes(2);
    expect(mockConversationLogger.log).toHaveBeenCalledWith("a-ceo", "user", "Hello agent");
    expect(mockConversationLogger.log).toHaveBeenCalledWith(
      "a-ceo", "assistant", "I'll handle the marketing plan."
    );
  });

  it("should continue if ConversationLogger fails", async () => {
    mockConversationLogger.log.mockRejectedValue(new Error("DB error"));

    const response = await pipeline.execute("a-ceo", "Log will fail");
    expect(response.message).toBe("I'll handle the marketing plan.");
  });

  // === Step 7: MessageBus (S13) ===
  it("should publish response to MessageBus", async () => {
    await pipeline.execute("a-ceo", "Send update");

    expect(mockMessageBus.publish).toHaveBeenCalledWith(
      "agent:response",
      expect.objectContaining({
        agentId: "a-ceo",
        message: "I'll handle the marketing plan.",
        tokenUsed: 150,
      })
    );
  });

  // === Pipeline without optional deps ===
  it("should work without ApprovalPolicy and ConversationLogger", async () => {
    const minPipeline = new AgentPipeline({
      engine: mockEngine,
      contextBuilder: mockContextBuilder,
      costTracker,
      budgetManager,
      messageBus: mockMessageBus,
    });

    const response = await minPipeline.execute("a-ceo", "Minimal pipeline");
    expect(response.message).toBe("I'll handle the marketing plan.");
    expect(response.budgetStatus).toBe("ok");
  });
});
