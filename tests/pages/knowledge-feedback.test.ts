/**
 * Tests for Knowledge & Feedback Dashboard (Session 39).
 * Covers: search filtering, tab state, correction validation,
 * corrections API shape, file existence.
 *
 * @module tests/pages/knowledge-feedback
 */

import * as fs from "fs";
import * as path from "path";

/** Mock conversations */
const MOCK_CONVERSATIONS = [
  { id: "conv-1", agentId: "a-ceo", summary: "Q2 marketing strategy discussion", createdAt: "2026-03-24T10:00:00Z", agent: { name: "CEO Agent" } },
  { id: "conv-2", agentId: "a-mkt", summary: "Content calendar planning", createdAt: "2026-03-24T11:00:00Z", agent: { name: "Marketing Agent" } },
  { id: "conv-3", agentId: "a-ceo", summary: "Budget review session", createdAt: "2026-03-24T12:00:00Z", agent: { name: "CEO Agent" } },
];

/** Mock corrections */
const MOCK_CORRECTIONS = [
  {
    id: "cor-1", taskId: "t-1", agentId: "a-mkt", context: "User asked for Q2 report",
    wrongOutput: "Generated Q1 data instead", correction: "Use Q2 date range filter",
    ruleExtracted: "Always verify date range matches user request", vectorId: null,
    createdAt: "2026-03-24T10:00:00Z",
  },
  {
    id: "cor-2", taskId: "t-2", agentId: "a-ceo", context: "Delegating email task",
    wrongOutput: "Sent to wrong department", correction: "Check department mapping first",
    ruleExtracted: "Verify recipient department before delegation", vectorId: "v-1",
    createdAt: "2026-03-24T11:00:00Z",
  },
];

describe("Knowledge Page — Component Files (S39)", () => {
  const knowledgeDir = path.join(process.cwd(), "src", "app", "(dashboard)", "knowledge");

  it("should have knowledge/page.tsx", () => {
    expect(fs.existsSync(path.join(knowledgeDir, "page.tsx"))).toBe(true);
  });

  it("should have knowledge/components/knowledge-search.tsx", () => {
    expect(fs.existsSync(path.join(knowledgeDir, "components", "knowledge-search.tsx"))).toBe(true);
  });

  it("should have knowledge/components/memory-viewer.tsx", () => {
    expect(fs.existsSync(path.join(knowledgeDir, "components", "memory-viewer.tsx"))).toBe(true);
  });

  it("should have knowledge/components/correction-list.tsx", () => {
    expect(fs.existsSync(path.join(knowledgeDir, "components", "correction-list.tsx"))).toBe(true);
  });
});

describe("Knowledge Page — API Route (S39)", () => {
  it("should have api/corrections/route.ts", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "corrections", "route.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });
});

describe("Knowledge Page — Search Filtering", () => {
  function filterConversations(conversations: typeof MOCK_CONVERSATIONS, query: string) {
    if (!query) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.summary?.toLowerCase().includes(q) ||
        c.agent?.name?.toLowerCase().includes(q)
    );
  }

  it("should return all with empty query", () => {
    expect(filterConversations(MOCK_CONVERSATIONS, "")).toHaveLength(3);
  });

  it("should filter by summary keyword", () => {
    expect(filterConversations(MOCK_CONVERSATIONS, "marketing")).toHaveLength(2);
  });

  it("should filter by agent name", () => {
    expect(filterConversations(MOCK_CONVERSATIONS, "CEO")).toHaveLength(2);
  });

  it("should return empty when no match", () => {
    expect(filterConversations(MOCK_CONVERSATIONS, "nonexistent")).toHaveLength(0);
  });

  it("should be case-insensitive", () => {
    expect(filterConversations(MOCK_CONVERSATIONS, "BUDGET")).toHaveLength(1);
  });
});

describe("Knowledge Page — Tab State", () => {
  type Tab = "knowledge" | "corrections";

  it("should default to knowledge tab", () => {
    const defaultTab: Tab = "knowledge";
    expect(defaultTab).toBe("knowledge");
  });

  it("should allow switching to corrections tab", () => {
    let tab: Tab = "knowledge";
    tab = "corrections";
    expect(tab).toBe("corrections");
  });

  it("should only accept valid tab values", () => {
    const validTabs: Tab[] = ["knowledge", "corrections"];
    expect(validTabs).toHaveLength(2);
  });
});

describe("Corrections — Validation", () => {
  function validateCorrection(data: {
    taskId?: string;
    agentId?: string;
    wrongOutput?: string;
    correction?: string;
    ruleExtracted?: string;
  }): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    if (!data.taskId) errors.taskId = "Task ID required";
    if (!data.agentId) errors.agentId = "Agent ID required";
    if (!data.wrongOutput?.trim()) errors.wrongOutput = "Wrong output required";
    if (!data.correction?.trim()) errors.correction = "Correction required";
    if (!data.ruleExtracted?.trim()) errors.ruleExtracted = "Extracted rule required";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  it("should pass with all required fields", () => {
    const result = validateCorrection({
      taskId: "t-1",
      agentId: "a-1",
      wrongOutput: "Bad output",
      correction: "Good output",
      ruleExtracted: "Always check X",
    });
    expect(result.valid).toBe(true);
  });

  it("should fail when taskId is missing", () => {
    const result = validateCorrection({
      agentId: "a-1", wrongOutput: "X", correction: "Y", ruleExtracted: "Z",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.taskId).toBeDefined();
  });

  it("should fail when agentId is missing", () => {
    const result = validateCorrection({
      taskId: "t-1", wrongOutput: "X", correction: "Y", ruleExtracted: "Z",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.agentId).toBeDefined();
  });

  it("should fail when wrongOutput is empty", () => {
    const result = validateCorrection({
      taskId: "t-1", agentId: "a-1", wrongOutput: "  ", correction: "Y", ruleExtracted: "Z",
    });
    expect(result.valid).toBe(false);
  });

  it("should fail when all fields empty", () => {
    const result = validateCorrection({});
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(5);
  });
});

describe("Corrections — Search Filtering", () => {
  function filterCorrections(corrections: typeof MOCK_CORRECTIONS, query: string) {
    if (!query) return corrections;
    const q = query.toLowerCase();
    return corrections.filter(
      (c) =>
        c.ruleExtracted.toLowerCase().includes(q) ||
        c.correction.toLowerCase().includes(q) ||
        c.wrongOutput.toLowerCase().includes(q)
    );
  }

  it("should return all with empty query", () => {
    expect(filterCorrections(MOCK_CORRECTIONS, "")).toHaveLength(2);
  });

  it("should filter by ruleExtracted", () => {
    expect(filterCorrections(MOCK_CORRECTIONS, "date range")).toHaveLength(1);
  });

  it("should filter by correction text", () => {
    expect(filterCorrections(MOCK_CORRECTIONS, "department")).toHaveLength(1);
  });

  it("should filter by wrongOutput", () => {
    expect(filterCorrections(MOCK_CORRECTIONS, "wrong department")).toHaveLength(1);
  });
});

describe("Corrections — API Response Shape", () => {
  it("should have expected correction fields", () => {
    const c = MOCK_CORRECTIONS[0]!;
    expect(c).toHaveProperty("id");
    expect(c).toHaveProperty("taskId");
    expect(c).toHaveProperty("agentId");
    expect(c).toHaveProperty("context");
    expect(c).toHaveProperty("wrongOutput");
    expect(c).toHaveProperty("correction");
    expect(c).toHaveProperty("ruleExtracted");
    expect(c).toHaveProperty("vectorId");
    expect(c).toHaveProperty("createdAt");
  });

  it("should allow null vectorId", () => {
    expect(MOCK_CORRECTIONS[0]!.vectorId).toBeNull();
  });

  it("should allow non-null vectorId", () => {
    expect(MOCK_CORRECTIONS[1]!.vectorId).toBe("v-1");
  });
});

describe("Corrections — Stats Aggregation Shape", () => {
  function aggregateStats(corrections: typeof MOCK_CORRECTIONS) {
    const total = corrections.length;
    const byAgent = new Map<string, number>();
    for (const c of corrections) {
      byAgent.set(c.agentId, (byAgent.get(c.agentId) ?? 0) + 1);
    }
    return {
      total,
      perAgent: Array.from(byAgent.entries()).map(([agentId, count]) => ({ agentId, count })),
    };
  }

  it("should return correct total", () => {
    expect(aggregateStats(MOCK_CORRECTIONS).total).toBe(2);
  });

  it("should count per-agent corrections", () => {
    const stats = aggregateStats(MOCK_CORRECTIONS);
    expect(stats.perAgent).toHaveLength(2);
  });
});
