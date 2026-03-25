/**
 * Tests for Core Pages data providers.
 * Phase 23: Core Pages.
 *
 * Tests: DashboardProvider, AgentFilter, CostDashboard.
 */

import { generateStatCards, formatActivityItem, getBudgetAlerts } from "@/components/pages/dashboard-provider";
import { filterAgents, getFilterOptions, sortAgents } from "@/components/pages/agent-filter";
import { generateBarChartData, generateBudgetTable, calculateTrend } from "@/components/pages/cost-dashboard";

describe("DashboardProvider", () => {
  describe("generateStatCards", () => {
    it("should generate 4 stat cards", () => {
      const cards = generateStatCards({
        agentsTotal: 5,
        agentsActive: 3,
        tasksRunning: 5,
        tasksTotal: 12,
        pendingApprovals: 2,
        tokensToday: 1234,
      });

      expect(cards).toHaveLength(4);
      expect(cards[0]!.label).toBe("Agents");
      expect(cards[0]!.value).toBe("3/5 Active");
      expect(cards[1]!.label).toBe("Tasks");
      expect(cards[1]!.value).toBe("5 Running / 12 Total");
      expect(cards[2]!.label).toBe("Approvals");
      expect(cards[2]!.value).toBe("2 Pending");
      expect(cards[2]!.highlight).toBe(true);
      expect(cards[3]!.label).toBe("Cost");
      expect(cards[3]!.value).toBe("1,234 tokens");
    });

    it("should not highlight approvals when 0", () => {
      const cards = generateStatCards({
        agentsTotal: 5, agentsActive: 3,
        tasksRunning: 0, tasksTotal: 0,
        pendingApprovals: 0, tokensToday: 0,
      });
      expect(cards[2]!.highlight).toBe(false);
    });
  });

  describe("formatActivityItem", () => {
    it("should format audit entry to activity item", () => {
      const item = formatActivityItem({
        id: "aud-1",
        action: "agent:deployed",
        agentName: "CEO Agent",
        timestamp: new Date("2026-03-24T10:00:00Z"),
        details: "Deployed to production",
      });

      expect(item.icon).toBeDefined();
      expect(item.text).toContain("CEO Agent");
      expect(item.timeText).toBeDefined();
    });
  });

  describe("getBudgetAlerts", () => {
    it("should return agents over 80% budget", () => {
      const alerts = getBudgetAlerts([
        { agentId: "a-1", name: "CEO", usage: 5000, budget: 10000 },
        { agentId: "a-2", name: "Marketing", usage: 4500, budget: 5000 },
        { agentId: "a-3", name: "Finance", usage: 1000, budget: 3000 },
      ]);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.name).toBe("Marketing");
      expect(alerts[0]!.percent).toBe(90);
    });

    it("should include exceeded budgets", () => {
      const alerts = getBudgetAlerts([
        { agentId: "a-1", name: "CEO", usage: 12000, budget: 10000 },
      ]);

      expect(alerts).toHaveLength(1);
      expect(alerts[0]!.percent).toBe(120);
      expect(alerts[0]!.exceeded).toBe(true);
    });
  });
});

describe("AgentFilter", () => {
  const agents = [
    { id: "a-1", name: "CEO", status: "RUNNING", department: "Executive", role: "CEO" },
    { id: "a-2", name: "Marketing", status: "IDLE", department: "Marketing", role: "MANAGER" },
    { id: "a-3", name: "Finance", status: "RUNNING", department: "Finance", role: "ANALYST" },
    { id: "a-4", name: "Designer", status: "ERROR", department: "Marketing", role: "DESIGNER" },
  ];

  describe("filterAgents", () => {
    it("should filter by status", () => {
      const result = filterAgents(agents, { status: "RUNNING" });
      expect(result).toHaveLength(2);
    });

    it("should filter by department", () => {
      const result = filterAgents(agents, { department: "Marketing" });
      expect(result).toHaveLength(2);
    });

    it("should filter by multiple criteria", () => {
      const result = filterAgents(agents, { status: "RUNNING", department: "Finance" });
      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe("Finance");
    });

    it("should return all when no filters", () => {
      const result = filterAgents(agents, {});
      expect(result).toHaveLength(4);
    });
  });

  describe("getFilterOptions", () => {
    it("should extract unique filter values", () => {
      const options = getFilterOptions(agents);
      expect(options.statuses).toContain("RUNNING");
      expect(options.statuses).toContain("IDLE");
      expect(options.statuses).toContain("ERROR");
      expect(options.departments).toHaveLength(3);
      expect(options.roles).toHaveLength(4);
    });
  });

  describe("sortAgents", () => {
    it("should sort by name ascending", () => {
      const sorted = sortAgents(agents, "name");
      expect(sorted[0]!.name).toBe("CEO");
      expect(sorted[3]!.name).toBe("Marketing");
    });

    it("should sort by status", () => {
      const sorted = sortAgents(agents, "status");
      expect(sorted[0]!.status).toBe("ERROR");
    });
  });
});

describe("CostDashboard", () => {
  describe("generateBarChartData", () => {
    it("should generate per-agent bar data sorted by usage", () => {
      const bars = generateBarChartData([
        { agentId: "a-1", name: "CEO", tokens: 5000 },
        { agentId: "a-2", name: "Marketing", tokens: 3200 },
        { agentId: "a-3", name: "Finance", tokens: 2100 },
      ]);

      expect(bars).toHaveLength(3);
      expect(bars[0]!.name).toBe("CEO");
      expect(bars[0]!.tokens).toBe(5000);
      expect(bars[0]!.percent).toBe(100);
      expect(bars[2]!.percent).toBe(42); // 2100/5000 * 100
    });
  });

  describe("generateBudgetTable", () => {
    it("should generate budget rows with status", () => {
      const rows = generateBudgetTable([
        { agentId: "a-1", name: "CEO", used: 5000, budget: 10000 },
        { agentId: "a-2", name: "Marketing", used: 4500, budget: 5000 },
        { agentId: "a-3", name: "Finance", used: 3100, budget: 3000 },
      ]);

      expect(rows).toHaveLength(3);
      expect(rows[0]!.status).toBe("OK");
      expect(rows[0]!.percent).toBe(50);
      expect(rows[1]!.status).toBe("WARNING");
      expect(rows[1]!.percent).toBe(90);
      expect(rows[2]!.status).toBe("EXCEEDED");
      expect(rows[2]!.percent).toBe(103);
    });
  });

  describe("calculateTrend", () => {
    it("should calculate daily totals from history", () => {
      const trend = calculateTrend([
        { date: "2026-03-20", tokens: 1000 },
        { date: "2026-03-21", tokens: 1500 },
        { date: "2026-03-22", tokens: 2000 },
      ]);

      expect(trend).toHaveLength(3);
      expect(trend[0]!.date).toBe("2026-03-20");
      expect(trend[2]!.tokens).toBe(2000);
    });
  });
});
