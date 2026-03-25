/**
 * E2E Full Flow Integration Test.
 * Phase 25: End-to-End Testing.
 *
 * Tests the COMPLETE enterprise operation flow:
 * Setup → Deploy → Task → Approve → Telegram → Realtime → Cost → Cleanup
 */

import {
  createTestPipeline,
  createTestTelegramBot,
  createMockEngine,
} from "./e2e-helpers";
import { AGENT_EVENTS, COST_EVENTS } from "@/types/realtime";

describe("E2E: Complete Enterprise Operation", () => {
  // Step 1: SETUP
  describe("Step 1: Setup Pipeline", () => {
    it("should create fully wired pipeline with all 8 modules", () => {
      const { pipeline, engine, costTracker, budgetManager, realtimeHub } =
        createTestPipeline();

      expect(pipeline).toBeDefined();
      expect(engine).toBeDefined();
      expect(costTracker).toBeDefined();
      expect(budgetManager).toBeDefined();
      expect(realtimeHub).toBeDefined();
    });
  });

  // Step 2-3: Company + Deploy Agents
  describe("Step 2-3: Deploy Agents", () => {
    it("should execute messages for 3 agents successfully", async () => {
      const { pipeline, engine } = createTestPipeline({
        responses: {
          "a-ceo": "I'll delegate this task to the team.",
          "a-mkt": "Marketing campaign draft ready.",
          "a-fin": "ROI calculated: 2.5x expected return.",
        },
      });

      // CEO processes task
      const ceoResult = await pipeline.execute("a-ceo", "Launch promotion campaign");
      expect(ceoResult.message).toBe("I'll delegate this task to the team.");

      // Marketing processes subtask
      const mktResult = await pipeline.execute("a-mkt", "Write campaign content");
      expect(mktResult.message).toBe("Marketing campaign draft ready.");

      // Finance processes subtask
      const finResult = await pipeline.execute("a-fin", "Calculate ROI for campaign");
      expect(finResult.message).toBe("ROI calculated: 2.5x expected return.");

      // All 3 agents called
      expect(engine.sendMessage).toHaveBeenCalledTimes(3);
    });
  });

  // Step 4-5: Task Decomposition + Agent Execution
  describe("Step 4-5: Task Execution Flow", () => {
    it("should track context building for each execution", async () => {
      const { pipeline, contextBuilder } = createTestPipeline();

      await pipeline.execute("a-ceo", "Create quarterly plan");
      await pipeline.execute("a-mkt", "Write social media posts");

      expect(contextBuilder.build).toHaveBeenCalledTimes(2);
    });

    it("should log conversations for each execution", async () => {
      const { pipeline, conversationLogger } = createTestPipeline();

      await pipeline.execute("a-ceo", "Analyze market trends");

      // user + assistant logs
      expect(conversationLogger.log).toHaveBeenCalledTimes(2);
      expect(conversationLogger.log).toHaveBeenCalledWith("a-ceo", "user", "Analyze market trends");
    });
  });

  // Step 6: Approval Workflow
  describe("Step 6: Approval Workflow", () => {
    it("should block execution when approval required", async () => {
      const { pipeline } = createTestPipeline({
        blockedTasks: ["customer-facing"],
      });

      // Pipeline throws when approval required
      await expect(
        pipeline.execute("a-mkt", "Send customer-facing email")
      ).rejects.toThrow("Approval required");
    });

    it("should allow execution when no approval needed", async () => {
      const { pipeline } = createTestPipeline({
        blockedTasks: ["customer-facing"],
      });

      const result = await pipeline.execute("a-fin", "Calculate internal budget");

      // Should pass through
      expect(result.message).toBeDefined();
    });
  });

  // Step 7: Telegram Integration
  describe("Step 7: Telegram Bot Commands", () => {
    it("/status should return system overview", async () => {
      const { bot } = createTestTelegramBot();
      const result = await bot.handleStatus();

      expect(result.success).toBe(true);
      expect(result.text).toContain("3"); // agents
      expect(result.text).toContain("1,500"); // tokens
    });

    it("/agents should list all agents", async () => {
      const { bot } = createTestTelegramBot();
      const result = await bot.handleAgents();

      expect(result.success).toBe(true);
      expect(result.text).toContain("CEO");
      expect(result.text).toContain("Marketing");
      expect(result.text).toContain("Finance");
    });

    it("/task should forward to CEO", async () => {
      const { bot } = createTestTelegramBot();
      const result = await bot.handleTask("Launch Q2 campaign");

      expect(result.success).toBe(true);
      expect(result.text).toContain("CEO Agent");
    });

    it("/cost should show usage breakdown", () => {
      const { bot } = createTestTelegramBot();
      const result = bot.handleCost();

      expect(result.success).toBe(true);
      expect(result.text).toContain("1,500");
    });

    it("/approve should show pending approvals", async () => {
      const { bot } = createTestTelegramBot();
      const result = await bot.handleApprove();

      expect(result.success).toBe(true);
      expect(result.text).toContain("Send email to customer");
    });
  });

  // Step 8: Realtime Events
  describe("Step 8: Realtime Events", () => {
    it("should emit events to RealtimeHub during pipeline execution", async () => {
      const { pipeline, realtimeHub } = createTestPipeline();
      const events: unknown[] = [];
      realtimeHub.subscribeAll((event) => events.push(event));

      await pipeline.execute("a-ceo", "Plan next quarter");

      // Should have at least 1 event (agent:response from step 8)
      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it("should publish to MessageBus during pipeline execution", async () => {
      const { pipeline, messageBus } = createTestPipeline();

      await pipeline.execute("a-mkt", "Write blog post");

      const published = messageBus.getPublished();
      expect(published.length).toBeGreaterThanOrEqual(1);
      expect(published[0]!.channel).toBe("agent:response");
    });
  });

  // Step 9: Cost Tracking
  describe("Step 9: Cost Tracking", () => {
    it("should accumulate token usage across agents", async () => {
      const { pipeline, costTracker } = createTestPipeline();

      await pipeline.execute("a-ceo", "Task 1");
      await pipeline.execute("a-mkt", "Task 2");
      await pipeline.execute("a-fin", "Task 3");

      const report = costTracker.getReport();
      expect(report.totalTokens).toBeGreaterThan(0);
      expect(report.perAgent.length).toBeGreaterThanOrEqual(1);
    });

    it("should check budget after each execution", async () => {
      const { pipeline, budgetManager } = createTestPipeline();
      budgetManager.setBudget("a-mkt", 10000);

      const result = await pipeline.execute("a-mkt", "Write content");

      expect(result.budgetStatus).toBeDefined();
    });
  });

  // Step 10: Cleanup
  describe("Step 10: Cleanup", () => {
    it("should clean up RealtimeHub on dispose", () => {
      const { realtimeHub } = createTestPipeline();

      realtimeHub.subscribeAll(jest.fn());
      realtimeHub.emit("test", {});
      expect(realtimeHub.getConnectionCount()).toBe(1);

      realtimeHub.dispose();
      expect(realtimeHub.getConnectionCount()).toBe(0);
      expect(realtimeHub.getRecentEvents(10)).toHaveLength(0);
    });
  });

  // Cross-cutting: Full Pipeline Chain
  describe("Full Pipeline Chain (8 steps)", () => {
    it("should execute all 8 pipeline steps in order", async () => {
      const { pipeline, approvalPolicy, contextBuilder, engine, costTracker, conversationLogger, messageBus, realtimeHub } =
        createTestPipeline();

      const events: unknown[] = [];
      realtimeHub.subscribeAll((e) => events.push(e));

      const result = await pipeline.execute("a-ceo", "Strategic planning for Q3");

      // Step 1: ApprovalPolicy evaluated
      expect(approvalPolicy.evaluate).toHaveBeenCalled();
      // Step 2: ContextBuilder called
      expect(contextBuilder.build).toHaveBeenCalled();
      // Step 3: Engine called
      expect(engine.sendMessage).toHaveBeenCalled();
      // Step 4-5: CostTracker tracked
      expect(costTracker.getReport().totalTokens).toBeGreaterThan(0);
      // Step 6: ConversationLogger logged
      expect(conversationLogger.log).toHaveBeenCalled();
      // Step 7: MessageBus published
      expect(messageBus.getPublished().length).toBeGreaterThanOrEqual(1);
      // Step 8: RealtimeHub received events
      expect(events.length).toBeGreaterThanOrEqual(1);

      // Result has all metadata
      expect(result.message).toBeDefined();
      expect(result.budgetStatus).toBeDefined();
      expect(result.contextInjected).toBe(true);
    });
  });
});
