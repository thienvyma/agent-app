/**
 * Tests for Self-Learning modules.
 * Phase 26: Self Learning.
 *
 * Tests: CorrectionLogManager, FeedbackLoop, PromptInjector.
 */

import { CorrectionLogManager, type CorrectionEntry } from "@/core/feedback/correction-log";
import { FeedbackLoop } from "@/core/feedback/feedback-loop";
import { PromptInjector } from "@/core/feedback/prompt-injector";

describe("CorrectionLogManager", () => {
  let manager: CorrectionLogManager;

  beforeEach(() => {
    manager = new CorrectionLogManager();
  });

  describe("create", () => {
    it("should create a correction entry", () => {
      const entry = manager.create({
        agentId: "a-fin",
        taskContext: "lap bao gia du an website",
        wrongOutput: "tong 50tr, khong co nhan cong",
        correction: "can cong them chi phi nhan cong",
        ruleExtracted: "Rule #47: Luon cong them chi phi nhan cong vao tong gia bao gia",
      });

      expect(entry.id).toBeDefined();
      expect(entry.agentId).toBe("a-fin");
      expect(entry.ruleExtracted).toContain("Rule #47");
    });
  });

  describe("getByAgent", () => {
    it("should return corrections for specific agent", () => {
      manager.create({ agentId: "a-fin", taskContext: "ctx1", wrongOutput: "w1", correction: "c1", ruleExtracted: "r1" });
      manager.create({ agentId: "a-mkt", taskContext: "ctx2", wrongOutput: "w2", correction: "c2", ruleExtracted: "r2" });
      manager.create({ agentId: "a-fin", taskContext: "ctx3", wrongOutput: "w3", correction: "c3", ruleExtracted: "r3" });

      const finCorrections = manager.getByAgent("a-fin");
      expect(finCorrections).toHaveLength(2);
    });
  });

  describe("getRelevant", () => {
    it("should find corrections matching query keywords", () => {
      manager.create({ agentId: "a-fin", taskContext: "bao gia website", wrongOutput: "w1", correction: "c1", ruleExtracted: "chi phi nhan cong" });
      manager.create({ agentId: "a-fin", taskContext: "tinh luong nhan vien", wrongOutput: "w2", correction: "c2", ruleExtracted: "cong thuc tinh luong" });

      const relevant = manager.getRelevant("bao gia mobile app", 5);
      expect(relevant.length).toBeGreaterThanOrEqual(1);
      expect(relevant[0]!.taskContext).toContain("bao gia");
    });
  });

  describe("getStats", () => {
    it("should return correct stats", () => {
      manager.create({ agentId: "a-fin", taskContext: "c1", wrongOutput: "w1", correction: "c1", ruleExtracted: "r1" });
      manager.create({ agentId: "a-fin", taskContext: "c2", wrongOutput: "w2", correction: "c2", ruleExtracted: "r2" });
      manager.create({ agentId: "a-mkt", taskContext: "c3", wrongOutput: "w3", correction: "c3", ruleExtracted: "r3" });

      const stats = manager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byAgent["a-fin"]).toBe(2);
      expect(stats.byAgent["a-mkt"]).toBe(1);
    });
  });
});

describe("FeedbackLoop", () => {
  let feedbackLoop: FeedbackLoop;
  let correctionLog: CorrectionLogManager;

  beforeEach(() => {
    correctionLog = new CorrectionLogManager();
    feedbackLoop = new FeedbackLoop(correctionLog);
  });

  describe("processRejection", () => {
    it("should create correction log from rejection", () => {
      const result = feedbackLoop.processRejection({
        agentId: "a-fin",
        taskDescription: "Lap bao gia du an website",
        agentOutput: "Tong: 50,000,000 VND",
        ownerFeedback: "Thieu chi phi nhan cong",
      });

      expect(result.correctionId).toBeDefined();
      expect(result.ruleExtracted).toBeDefined();

      const corrections = correctionLog.getByAgent("a-fin");
      expect(corrections).toHaveLength(1);
    });
  });

  describe("formatRuleFromFeedback", () => {
    it("should format rule text from context, wrong output, correction", () => {
      const rule = feedbackLoop.formatRuleFromFeedback(
        "lap bao gia du an",
        "50tr khong co nhan cong",
        "can cong them chi phi nhan cong"
      );

      expect(rule).toContain("bao");
      expect(rule).toContain("nhan cong");
    });
  });

  describe("processModification", () => {
    it("should create correction log from modification", () => {
      const result = feedbackLoop.processModification({
        agentId: "a-mkt",
        taskDescription: "Viet email marketing",
        agentOutput: "Dear customer, ...",
        modifications: "Them loi chuc dau thu",
      });

      expect(result.correctionId).toBeDefined();
    });
  });
});

describe("PromptInjector", () => {
  describe("inject", () => {
    it("should combine SOP + corrections + knowledge", () => {
      const injector = new PromptInjector();

      const prompt = injector.inject({
        sop: "You are a Finance Analyst. Follow accounting standards.",
        corrections: [
          { ruleExtracted: "Rule #47: Luon cong them chi phi nhan cong", taskContext: "bao gia" },
          { ruleExtracted: "Rule #23: Kiem tra gia vat tu truoc khi bao gia", taskContext: "bao gia" },
        ],
        knowledge: ["Price list Q1 2026", "Company policy on pricing"],
      });

      expect(prompt).toContain("Finance Analyst");
      expect(prompt).toContain("RULES FROM PAST CORRECTIONS");
      expect(prompt).toContain("Rule #47");
      expect(prompt).toContain("Rule #23");
      expect(prompt).toContain("RELEVANT KNOWLEDGE");
      expect(prompt).toContain("Price list Q1 2026");
    });

    it("should return SOP only when no corrections or knowledge", () => {
      const injector = new PromptInjector();

      const prompt = injector.inject({
        sop: "You are a CEO Agent.",
        corrections: [],
        knowledge: [],
      });

      expect(prompt).toBe("You are a CEO Agent.");
      expect(prompt).not.toContain("RULES FROM");
    });
  });

  describe("formatCorrections", () => {
    it("should format corrections as numbered rules", () => {
      const injector = new PromptInjector();

      const formatted = injector.formatCorrections([
        { ruleExtracted: "Always include labor cost", taskContext: "pricing" },
        { ruleExtracted: "Check material prices first", taskContext: "pricing" },
      ]);

      expect(formatted).toContain("1.");
      expect(formatted).toContain("2.");
      expect(formatted).toContain("Always include labor cost");
    });
  });

  describe("prioritization", () => {
    it("should limit corrections to max 50", () => {
      const injector = new PromptInjector();
      const manyCorrections = Array.from({ length: 60 }, (_, i) => ({
        ruleExtracted: `Rule #${i}`,
        taskContext: `context ${i}`,
      }));

      const prompt = injector.inject({
        sop: "SOP",
        corrections: manyCorrections,
        knowledge: [],
      });

      // Should truncate to 50
      expect(prompt).toContain("Rule #0");
      expect(prompt).not.toContain("Rule #55");
    });
  });
});
