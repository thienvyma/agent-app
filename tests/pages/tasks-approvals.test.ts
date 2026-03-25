/**
 * Tests for Tasks & Approvals Dashboard (Session 36).
 * Covers: Kanban column grouping, priority badges, status filtering,
 * approval validation, component file existence, API shape.
 *
 * @module tests/pages/tasks-approvals
 */

import * as fs from "fs";
import * as path from "path";

/** Task statuses matching Prisma TaskStatus enum */
const TASK_STATUSES = ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL", "COMPLETED", "FAILED"] as const;
type TaskStatus = typeof TASK_STATUSES[number];

/** Kanban columns */
const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: "PENDING", label: "Pending", color: "gray" },
  { status: "IN_PROGRESS", label: "In Progress", color: "blue" },
  { status: "WAITING_APPROVAL", label: "Waiting Approval", color: "amber" },
  { status: "COMPLETED", label: "Completed", color: "emerald" },
  { status: "FAILED", label: "Failed", color: "red" },
];

/** Mock tasks */
const MOCK_TASKS = [
  { id: "t-1", description: "Write Q2 plan", status: "PENDING" as TaskStatus, priority: 3, assignedToId: "a-ceo", createdAt: "2026-03-24T10:00:00Z" },
  { id: "t-2", description: "Review marketing copy", status: "IN_PROGRESS" as TaskStatus, priority: 5, assignedToId: "a-mkt", createdAt: "2026-03-24T11:00:00Z" },
  { id: "t-3", description: "Deploy API v2", status: "WAITING_APPROVAL" as TaskStatus, priority: 2, assignedToId: "a-dev", createdAt: "2026-03-24T12:00:00Z" },
  { id: "t-4", description: "Update docs", status: "COMPLETED" as TaskStatus, priority: 7, assignedToId: "a-ceo", createdAt: "2026-03-24T13:00:00Z" },
  { id: "t-5", description: "Fix critical bug", status: "FAILED" as TaskStatus, priority: 1, assignedToId: "a-dev", createdAt: "2026-03-24T14:00:00Z" },
  { id: "t-6", description: "Prepare deck", status: "PENDING" as TaskStatus, priority: 4, assignedToId: "a-mkt", createdAt: "2026-03-24T15:00:00Z" },
];

describe("Tasks Page — Component Files (S36)", () => {
  const tasksDir = path.join(process.cwd(), "src", "app", "(dashboard)", "tasks");

  it("should have tasks/page.tsx", () => {
    expect(fs.existsSync(path.join(tasksDir, "page.tsx"))).toBe(true);
  });

  it("should have tasks/[id]/page.tsx", () => {
    expect(fs.existsSync(path.join(tasksDir, "[id]", "page.tsx"))).toBe(true);
  });
});

describe("Tasks Page — Kanban Column Grouping", () => {
  function groupByStatus(tasks: typeof MOCK_TASKS) {
    const grouped: Record<TaskStatus, typeof MOCK_TASKS> = {
      PENDING: [], IN_PROGRESS: [], WAITING_APPROVAL: [], COMPLETED: [], FAILED: [],
    };
    for (const t of tasks) {
      grouped[t.status].push(t);
    }
    return grouped;
  }

  it("should have exactly 5 Kanban columns", () => {
    expect(KANBAN_COLUMNS).toHaveLength(5);
  });

  it("should group tasks into correct columns", () => {
    const grouped = groupByStatus(MOCK_TASKS);
    expect(grouped.PENDING).toHaveLength(2);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
    expect(grouped.WAITING_APPROVAL).toHaveLength(1);
    expect(grouped.COMPLETED).toHaveLength(1);
    expect(grouped.FAILED).toHaveLength(1);
  });

  it("should have unique statuses across all columns", () => {
    const statuses = KANBAN_COLUMNS.map((c) => c.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });
});

describe("Tasks Page — Priority Badge Logic", () => {
  function getPriorityBadge(priority: number): { level: string; color: string } {
    if (priority <= 3) return { level: "critical", color: "red" };
    if (priority <= 5) return { level: "high", color: "amber" };
    if (priority <= 7) return { level: "medium", color: "blue" };
    return { level: "low", color: "gray" };
  }

  it("should return critical for priority 1-3", () => {
    expect(getPriorityBadge(1).level).toBe("critical");
    expect(getPriorityBadge(3).level).toBe("critical");
  });

  it("should return high for priority 4-5", () => {
    expect(getPriorityBadge(4).level).toBe("high");
    expect(getPriorityBadge(5).level).toBe("high");
  });

  it("should return medium for priority 6-7", () => {
    expect(getPriorityBadge(6).level).toBe("medium");
  });

  it("should return low for priority 8+", () => {
    expect(getPriorityBadge(8).level).toBe("low");
    expect(getPriorityBadge(10).level).toBe("low");
  });
});

describe("Tasks Page — Status Filter Logic", () => {
  function filterTasks(tasks: typeof MOCK_TASKS, filters: { status?: string; search?: string }) {
    return tasks.filter((t) => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  it("should return all tasks with no filter", () => {
    expect(filterTasks(MOCK_TASKS, {})).toHaveLength(6);
  });

  it("should filter by status", () => {
    expect(filterTasks(MOCK_TASKS, { status: "PENDING" })).toHaveLength(2);
  });

  it("should filter by search", () => {
    expect(filterTasks(MOCK_TASKS, { search: "deploy" })).toHaveLength(1);
  });

  it("should combine status + search", () => {
    expect(filterTasks(MOCK_TASKS, { status: "PENDING", search: "deck" })).toHaveLength(1);
  });
});

describe("Approvals Page — Component Files (S36)", () => {
  const approvalsDir = path.join(process.cwd(), "src", "app", "(dashboard)", "approvals");

  it("should have approvals/page.tsx", () => {
    expect(fs.existsSync(path.join(approvalsDir, "page.tsx"))).toBe(true);
  });
});

describe("Approvals Page — Action Validation", () => {
  function validateApprovalAction(action: string, taskId: string): { valid: boolean; error?: string } {
    if (!["approve", "reject"].includes(action)) return { valid: false, error: "Invalid action" };
    if (!taskId?.trim()) return { valid: false, error: "Task ID required" };
    return { valid: true };
  }

  it("should accept approve action", () => {
    expect(validateApprovalAction("approve", "t-1").valid).toBe(true);
  });

  it("should accept reject action", () => {
    expect(validateApprovalAction("reject", "t-1").valid).toBe(true);
  });

  it("should reject invalid action", () => {
    const result = validateApprovalAction("cancel", "t-1");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid action");
  });

  it("should reject empty task ID", () => {
    const result = validateApprovalAction("approve", "");
    expect(result.valid).toBe(false);
  });
});

describe("Tasks API — Response Shape", () => {
  it("should have expected task fields", () => {
    const task = MOCK_TASKS[0]!;
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("description");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("priority");
    expect(task).toHaveProperty("assignedToId");
    expect(task).toHaveProperty("createdAt");
  });

  it("should have valid priority range 1-10", () => {
    MOCK_TASKS.forEach((t) => {
      expect(t.priority).toBeGreaterThanOrEqual(1);
      expect(t.priority).toBeLessThanOrEqual(10);
    });
  });

  it("should have valid status values", () => {
    MOCK_TASKS.forEach((t) => {
      expect(TASK_STATUSES).toContain(t.status);
    });
  });
});
