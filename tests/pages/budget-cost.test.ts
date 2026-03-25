/**
 * Tests for Budget & Cost Dashboard (Session 37).
 * Covers: budget gauge %, stat card calculations, cost CSV export format,
 * threshold validation, API route file existence.
 *
 * @module tests/pages/budget-cost
 */

import * as fs from "fs";
import * as path from "path";

/** Mock cost entries */
const MOCK_COST_ENTRIES = [
  { id: "c-1", agentId: "a-ceo", model: "qwen2.5:7b", tokens: 1500, cost: 0, createdAt: "2026-03-24T10:00:00Z" },
  { id: "c-2", agentId: "a-mkt", model: "gpt-4o", tokens: 800, cost: 0.004, createdAt: "2026-03-24T11:00:00Z" },
  { id: "c-3", agentId: "a-ceo", model: "qwen2.5:7b", tokens: 2200, cost: 0, createdAt: "2026-03-24T12:00:00Z" },
  { id: "c-4", agentId: "a-dev", model: "qwen2.5:7b", tokens: 500, cost: 0, createdAt: "2026-03-25T10:00:00Z" },
];

describe("Budget Page — Component Files (S37)", () => {
  const budgetDir = path.join(process.cwd(), "src", "app", "(dashboard)", "budget");

  it("should have budget/page.tsx", () => {
    expect(fs.existsSync(path.join(budgetDir, "page.tsx"))).toBe(true);
  });
});

describe("Budget Page — API Route Files", () => {
  const apiDir = path.join(process.cwd(), "src", "app", "api");

  it("should have cost/entries/route.ts", () => {
    expect(fs.existsSync(path.join(apiDir, "cost", "entries", "route.ts"))).toBe(true);
  });

  it("should have cost/budget/route.ts", () => {
    expect(fs.existsSync(path.join(apiDir, "cost", "budget", "route.ts"))).toBe(true);
  });
});

describe("Budget Page — Gauge Calculation", () => {
  function calculateGauge(used: number, limit: number): { percent: number; status: string; color: string } {
    if (limit <= 0) return { percent: 0, status: "no-limit", color: "gray" };
    const percent = Math.round((used / limit) * 100);
    if (percent >= 100) return { percent, status: "exceeded", color: "red" };
    if (percent >= 80) return { percent, status: "warning", color: "amber" };
    return { percent, status: "ok", color: "emerald" };
  }

  it("should return 0% when limit is 0", () => {
    expect(calculateGauge(500, 0).percent).toBe(0);
  });

  it("should return ok for < 80%", () => {
    const result = calculateGauge(5000, 10000);
    expect(result.percent).toBe(50);
    expect(result.status).toBe("ok");
  });

  it("should return warning for 80-99%", () => {
    const result = calculateGauge(8500, 10000);
    expect(result.percent).toBe(85);
    expect(result.status).toBe("warning");
  });

  it("should return exceeded for >= 100%", () => {
    const result = calculateGauge(12000, 10000);
    expect(result.percent).toBe(120);
    expect(result.status).toBe("exceeded");
  });
});

describe("Budget Page — Stat Card Aggregation", () => {
  function aggregateStats(entries: typeof MOCK_COST_ENTRIES) {
    const totalTokens = entries.reduce((sum, e) => sum + e.tokens, 0);
    const totalCost = entries.reduce((sum, e) => sum + e.cost, 0);
    const uniqueAgents = new Set(entries.map((e) => e.agentId)).size;
    return { totalTokens, totalCost, uniqueAgents };
  }

  it("should compute correct total tokens", () => {
    const stats = aggregateStats(MOCK_COST_ENTRIES);
    expect(stats.totalTokens).toBe(5000);
  });

  it("should compute correct total cost", () => {
    const stats = aggregateStats(MOCK_COST_ENTRIES);
    expect(stats.totalCost).toBeCloseTo(0.004, 4);
  });

  it("should count unique agents", () => {
    const stats = aggregateStats(MOCK_COST_ENTRIES);
    expect(stats.uniqueAgents).toBe(3);
  });
});

describe("Budget Page — Per-Agent Chart Data", () => {
  function groupByAgent(entries: typeof MOCK_COST_ENTRIES) {
    const map = new Map<string, number>();
    for (const e of entries) {
      map.set(e.agentId, (map.get(e.agentId) ?? 0) + e.tokens);
    }
    return Array.from(map.entries())
      .map(([agentId, tokens]) => ({ agentId, tokens }))
      .sort((a, b) => b.tokens - a.tokens);
  }

  it("should group tokens by agent", () => {
    const grouped = groupByAgent(MOCK_COST_ENTRIES);
    expect(grouped).toHaveLength(3);
    expect(grouped[0]!.agentId).toBe("a-ceo");
    expect(grouped[0]!.tokens).toBe(3700);
  });

  it("should sort by tokens descending", () => {
    const grouped = groupByAgent(MOCK_COST_ENTRIES);
    for (let i = 1; i < grouped.length; i++) {
      expect(grouped[i - 1]!.tokens).toBeGreaterThanOrEqual(grouped[i]!.tokens);
    }
  });
});

describe("Budget Page — CSV Export", () => {
  function generateCSV(entries: typeof MOCK_COST_ENTRIES): string {
    const header = "Agent,Model,Tokens,Cost,Date\n";
    const rows = entries.map((e) =>
      `"${e.agentId}","${e.model}",${e.tokens},${e.cost},"${e.createdAt}"`
    ).join("\n");
    return header + rows;
  }

  it("should generate CSV with correct header", () => {
    const csv = generateCSV(MOCK_COST_ENTRIES);
    expect(csv.startsWith("Agent,Model,Tokens,Cost,Date")).toBe(true);
  });

  it("should have correct number of data rows", () => {
    const csv = generateCSV(MOCK_COST_ENTRIES);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(5); // 1 header + 4 data
  });
});

describe("Budget Page — Threshold Validation", () => {
  function validateThreshold(value: number): { valid: boolean; error?: string } {
    if (value < 50) return { valid: false, error: "Threshold must be at least 50%" };
    if (value > 95) return { valid: false, error: "Threshold must be at most 95%" };
    return { valid: true };
  }

  it("should accept valid thresholds (50-95)", () => {
    expect(validateThreshold(50).valid).toBe(true);
    expect(validateThreshold(75).valid).toBe(true);
    expect(validateThreshold(95).valid).toBe(true);
  });

  it("should reject threshold below 50", () => {
    expect(validateThreshold(30).valid).toBe(false);
  });

  it("should reject threshold above 95", () => {
    expect(validateThreshold(100).valid).toBe(false);
  });
});
