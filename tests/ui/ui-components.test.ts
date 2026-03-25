/**
 * Tests for UI component logic — StatusBadge, AgentCard, OrgChart, TaskBoard.
 * Phase 22: UI Components.
 */

import { getStatusConfig, AGENT_STATUSES } from "@/components/status-badge";
import { formatTokenCount, formatTimeAgo, formatAgentCard } from "@/components/agent-card";
import { buildOrgTree, flattenTree } from "@/components/org-chart";
import { groupByStatus, getPriorityBadge, TASK_COLUMNS } from "@/components/task-board";

describe("StatusBadge", () => {
  it("should return correct config for RUNNING", () => {
    const config = getStatusConfig("RUNNING");
    expect(config.label).toBe("Running");
    expect(config.cssClass).toBe("status-badge--running");
    expect(config.animation).toBe("pulse");
  });

  it("should return correct config for IDLE", () => {
    const config = getStatusConfig("IDLE");
    expect(config.label).toBe("Idle");
    expect(config.animation).toBeNull();
  });

  it("should return correct config for ERROR", () => {
    const config = getStatusConfig("ERROR");
    expect(config.label).toBe("Error");
    expect(config.cssClass).toBe("status-badge--error");
  });

  it("should return correct config for DEPLOYING", () => {
    const config = getStatusConfig("DEPLOYING");
    expect(config.animation).toBe("spin");
  });

  it("should return correct config for PAUSED_BUDGET", () => {
    const config = getStatusConfig("PAUSED_BUDGET");
    expect(config.label).toBe("Paused (Budget)");
  });

  it("should have 5 defined statuses", () => {
    expect(AGENT_STATUSES).toHaveLength(5);
  });

  it("should return fallback for unknown status", () => {
    const config = getStatusConfig("UNKNOWN");
    expect(config.label).toBe("Unknown");
  });
});

describe("AgentCard", () => {
  describe("formatTokenCount", () => {
    it("should format with comma separators", () => {
      expect(formatTokenCount(1234)).toBe("1,234");
      expect(formatTokenCount(0)).toBe("0");
      expect(formatTokenCount(1000000)).toBe("1,000,000");
    });
  });

  describe("formatTimeAgo", () => {
    it("should format seconds ago", () => {
      const now = new Date();
      const thirtySecsAgo = new Date(now.getTime() - 30_000);
      expect(formatTimeAgo(thirtySecsAgo)).toBe("just now");
    });

    it("should format minutes ago", () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60_000);
      expect(formatTimeAgo(fiveMinAgo)).toBe("5 min ago");
    });

    it("should format hours ago", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600_000);
      expect(formatTimeAgo(twoHoursAgo)).toBe("2 hours ago");
    });

    it("should format days ago", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400_000);
      expect(formatTimeAgo(threeDaysAgo)).toBe("3 days ago");
    });
  });

  describe("formatAgentCard", () => {
    it("should format agent data for display", () => {
      const card = formatAgentCard({
        id: "a-1",
        name: "Marketing Agent",
        role: "MARKETING",
        department: "Marketing",
        model: "qwen2.5:7b",
        status: "RUNNING",
        toolCount: 3,
        tokensToday: 1234,
        lastActive: new Date(Date.now() - 5 * 60_000),
      });

      expect(card.name).toBe("Marketing Agent");
      expect(card.formattedTokens).toBe("1,234");
      expect(card.statusConfig.label).toBe("Running");
      expect(card.lastActiveText).toBe("5 min ago");
    });
  });
});

describe("OrgChart", () => {
  const company = {
    name: "Acme Corp",
    ceo: { id: "a-ceo", name: "CEO Agent", status: "RUNNING" },
    departments: [
      {
        name: "Marketing",
        agents: [
          { id: "a-mkt", name: "Marketing Manager", status: "RUNNING" },
          { id: "a-cnt", name: "Content Writer", status: "IDLE" },
        ],
      },
      {
        name: "Finance",
        agents: [
          { id: "a-fin", name: "Finance Analyst", status: "RUNNING" },
        ],
      },
    ],
  };

  it("should build tree from company data", () => {
    const tree = buildOrgTree(company);
    expect(tree.name).toBe("CEO Agent");
    expect(tree.children).toHaveLength(2);
    expect(tree.children[0]!.name).toBe("Marketing");
    expect(tree.children[0]!.children).toHaveLength(2);
  });

  it("should flatten tree for rendering", () => {
    const tree = buildOrgTree(company);
    const flat = flattenTree(tree);
    expect(flat.length).toBeGreaterThanOrEqual(6); // CEO + 2 depts + 3 agents
  });
});

describe("TaskBoard", () => {
  const tasks = [
    { id: "t-1", status: "PENDING", description: "Plan Q2", priority: 3 },
    { id: "t-2", status: "IN_PROGRESS", description: "Write report", priority: 5 },
    { id: "t-3", status: "COMPLETED", description: "Done task", priority: 7 },
    { id: "t-4", status: "PENDING", description: "Review code", priority: 2 },
    { id: "t-5", status: "FAILED", description: "Failed task", priority: 1 },
  ];

  it("should have 5 columns", () => {
    expect(TASK_COLUMNS).toHaveLength(5);
  });

  it("should group tasks by status", () => {
    const grouped = groupByStatus(tasks);
    expect(grouped.PENDING).toHaveLength(2);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
    expect(grouped.COMPLETED).toHaveLength(1);
    expect(grouped.FAILED).toHaveLength(1);
    expect(grouped.WAITING_APPROVAL).toHaveLength(0);
  });

  describe("getPriorityBadge", () => {
    it("should return high for priority 1-3", () => {
      expect(getPriorityBadge(1).level).toBe("high");
      expect(getPriorityBadge(3).level).toBe("high");
    });

    it("should return medium for priority 4-6", () => {
      expect(getPriorityBadge(5).level).toBe("medium");
    });

    it("should return low for priority 7-10", () => {
      expect(getPriorityBadge(8).level).toBe("low");
    });
  });
});
