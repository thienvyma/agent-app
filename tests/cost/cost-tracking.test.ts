/**
 * Tests for CostTracker and BudgetManager.
 * Phase 18: Cost Tracking.
 * Uses in-memory tracking (no Redis dependency in tests).
 */

import { CostTracker } from "@/core/cost/cost-tracker";
import { BudgetManager } from "@/core/cost/budget-manager";

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe("trackUsage", () => {
    it("should accumulate token usage per agent", () => {
      tracker.trackUsage("a-ceo", 100, "qwen2.5:7b");
      tracker.trackUsage("a-ceo", 200, "qwen2.5:7b");
      tracker.trackUsage("a-mkt", 150, "qwen2.5:7b");

      const ceoUsage = tracker.getAgentUsage("a-ceo");
      expect(ceoUsage.totalTokens).toBe(300);

      const mktUsage = tracker.getAgentUsage("a-mkt");
      expect(mktUsage.totalTokens).toBe(150);
    });

    it("should track per-model usage", () => {
      tracker.trackUsage("a-ceo", 100, "qwen2.5:7b");
      tracker.trackUsage("a-ceo", 200, "gpt-4o");

      const usage = tracker.getAgentUsage("a-ceo");
      expect(usage.byModel["qwen2.5:7b"]).toBe(100);
      expect(usage.byModel["gpt-4o"]).toBe(200);
    });
  });

  describe("getReport", () => {
    it("should return per-agent cost breakdown", () => {
      tracker.trackUsage("a-ceo", 1000, "qwen2.5:7b");
      tracker.trackUsage("a-mkt", 500, "gpt-4o");

      const report = tracker.getReport();

      expect(report.perAgent).toHaveLength(2);
      expect(report.totalTokens).toBe(1500);

      // qwen2.5:7b is local = $0
      const ceo = report.perAgent.find((a) => a.agentId === "a-ceo")!;
      expect(ceo.estimatedCostUSD).toBe(0);

      // gpt-4o costs $5/1M tokens
      const mkt = report.perAgent.find((a) => a.agentId === "a-mkt")!;
      expect(mkt.estimatedCostUSD).toBeCloseTo(0.0025, 4);
    });
  });

  describe("getTotalToday", () => {
    it("should return total tokens across all agents", () => {
      tracker.trackUsage("a-1", 100, "qwen2.5:7b");
      tracker.trackUsage("a-2", 200, "qwen2.5:7b");

      expect(tracker.getTotalToday()).toBe(300);
    });
  });

  describe("resetDaily", () => {
    it("should reset all counters to zero", () => {
      tracker.trackUsage("a-1", 500, "qwen2.5:7b");
      tracker.resetDaily();

      expect(tracker.getTotalToday()).toBe(0);
      expect(tracker.getAgentUsage("a-1").totalTokens).toBe(0);
    });
  });
});

describe("BudgetManager", () => {
  let manager: BudgetManager;
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
    manager = new BudgetManager(tracker);
  });

  describe("setBudget / getBudget", () => {
    it("should set and retrieve budget for an agent", () => {
      manager.setBudget("a-ceo", 10000);

      const budget = manager.getBudget("a-ceo");
      expect(budget.limit).toBe(10000);
      expect(budget.used).toBe(0);
      expect(budget.percentUsed).toBe(0);
      expect(budget.status).toBe("ok");
    });
  });

  describe("checkBudget", () => {
    it("should return ok when usage < 80%", () => {
      manager.setBudget("a-1", 1000);
      tracker.trackUsage("a-1", 500, "qwen2.5:7b");

      const result = manager.checkBudget("a-1");
      expect(result.status).toBe("ok");
    });

    it("should return warning when usage 80-99%", () => {
      manager.setBudget("a-1", 1000);
      tracker.trackUsage("a-1", 850, "qwen2.5:7b");

      const result = manager.checkBudget("a-1");
      expect(result.status).toBe("warning");
    });

    it("should return exceeded when usage >= 100%", () => {
      manager.setBudget("a-1", 1000);
      tracker.trackUsage("a-1", 1200, "qwen2.5:7b");

      const result = manager.checkBudget("a-1");
      expect(result.status).toBe("exceeded");
      expect(result.percentUsed).toBe(120);
    });

    it("should return ok when no budget set", () => {
      tracker.trackUsage("a-1", 99999, "qwen2.5:7b");

      const result = manager.checkBudget("a-1");
      expect(result.status).toBe("ok");
    });
  });

  describe("listBudgets", () => {
    it("should list all agents with budgets", () => {
      manager.setBudget("a-1", 1000);
      manager.setBudget("a-2", 5000);
      tracker.trackUsage("a-1", 800, "qwen2.5:7b");

      const list = manager.listBudgets();
      expect(list).toHaveLength(2);

      const a1 = list.find((b) => b.agentId === "a-1")!;
      expect(a1.percentUsed).toBe(80);
    });
  });

  describe("resetDaily", () => {
    it("should reset tracker and preserve budgets", () => {
      manager.setBudget("a-1", 1000);
      tracker.trackUsage("a-1", 900, "qwen2.5:7b");

      manager.resetDaily();

      const budget = manager.getBudget("a-1");
      expect(budget.limit).toBe(1000);
      expect(budget.used).toBe(0);
    });
  });
});
