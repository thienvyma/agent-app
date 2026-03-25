/**
 * Tests for Data Pages providers.
 * Phase 24: Data Pages.
 *
 * Tests: TaskPageProvider, MessageProvider, AuditProvider.
 */

import { validateNewTask, formatTaskDetail, handleDragDrop } from "@/components/pages/task-page-provider";
import { filterMessages, getMessageColor, groupByThread } from "@/components/pages/message-provider";
import { paginateAudit, filterAudit, formatCSVExport } from "@/components/pages/audit-provider";

describe("TaskPageProvider", () => {
  describe("validateNewTask", () => {
    it("should pass valid task", () => {
      const result = validateNewTask({
        description: "Write marketing report",
        assignTo: "a-mkt",
        priority: 3,
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty description", () => {
      const result = validateNewTask({ description: "", priority: 5 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Description is required");
    });

    it("should reject invalid priority", () => {
      const result = validateNewTask({ description: "Test", priority: 0 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Priority must be between 1 and 10");
    });
  });

  describe("formatTaskDetail", () => {
    it("should format task for detail view", () => {
      const detail = formatTaskDetail({
        id: "t-1",
        description: "Write Q2 plan",
        status: "IN_PROGRESS",
        assignedTo: "Marketing Agent",
        priority: 3,
        createdAt: new Date("2026-03-24T10:00:00Z"),
        result: null,
        error: null,
        subtasks: [],
      });

      expect(detail.id).toBe("t-1");
      expect(detail.priorityBadge.level).toBe("high");
      expect(detail.hasResult).toBe(false);
      expect(detail.hasError).toBe(false);
    });
  });

  describe("handleDragDrop", () => {
    it("should generate status change payload", () => {
      const payload = handleDragDrop("t-1", "COMPLETED");
      expect(payload.taskId).toBe("t-1");
      expect(payload.newStatus).toBe("COMPLETED");
      expect(payload.timestamp).toBeDefined();
    });
  });
});

describe("MessageProvider", () => {
  const messages = [
    { id: "m-1", from: "CEO", to: "Marketing", type: "DELEGATE", content: "Write report", timestamp: new Date("2026-03-24T10:30:00Z") },
    { id: "m-2", from: "Marketing", to: "CEO", type: "REPORT", content: "Done", timestamp: new Date("2026-03-24T10:32:00Z") },
    { id: "m-3", from: "SYSTEM", to: "Owner", type: "ALERT", content: "Budget warning", timestamp: new Date("2026-03-24T10:35:00Z") },
    { id: "m-4", from: "CEO", to: "Finance", type: "DELEGATE", content: "Calculate ROI", timestamp: new Date("2026-03-24T10:36:00Z") },
  ];

  describe("filterMessages", () => {
    it("should filter by agent (from or to)", () => {
      const result = filterMessages(messages, { agent: "Marketing" });
      expect(result).toHaveLength(2);
    });

    it("should filter by type", () => {
      const result = filterMessages(messages, { type: "DELEGATE" });
      expect(result).toHaveLength(2);
    });

    it("should filter by search text", () => {
      const result = filterMessages(messages, { search: "ROI" });
      expect(result).toHaveLength(1);
    });
  });

  describe("getMessageColor", () => {
    it("should return correct colors", () => {
      expect(getMessageColor("DELEGATE")).toBe("blue");
      expect(getMessageColor("REPORT")).toBe("green");
      expect(getMessageColor("ALERT")).toBe("red");
      expect(getMessageColor("CHAIN")).toBe("purple");
    });

    it("should return default for unknown type", () => {
      expect(getMessageColor("OTHER")).toBe("gray");
    });
  });

  describe("groupByThread", () => {
    it("should group messages by conversation pair", () => {
      const threads = groupByThread(messages);
      // CEO↔Marketing = 1 thread, SYSTEM→Owner = 1, CEO→Finance = 1
      expect(Object.keys(threads).length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("AuditProvider", () => {
  const entries = Array.from({ length: 120 }, (_, i) => ({
    id: `aud-${i}`,
    agent: i % 2 === 0 ? "CEO" : "Marketing",
    action: i % 3 === 0 ? "DEPLOY" : "SEND_MSG",
    details: `Detail ${i}`,
    timestamp: new Date(Date.now() - i * 60000),
  }));

  describe("paginateAudit", () => {
    it("should return correct page", () => {
      const result = paginateAudit(entries, 1, 50);
      expect(result.items).toHaveLength(50);
      expect(result.totalPages).toBe(3);
      expect(result.currentPage).toBe(1);
    });

    it("should return last page with remaining items", () => {
      const result = paginateAudit(entries, 3, 50);
      expect(result.items).toHaveLength(20);
    });
  });

  describe("filterAudit", () => {
    it("should filter by agent", () => {
      const result = filterAudit(entries, { agent: "CEO" });
      expect(result.length).toBe(60);
    });

    it("should filter by action", () => {
      const result = filterAudit(entries, { action: "DEPLOY" });
      expect(result.length).toBe(40);
    });
  });

  describe("formatCSVExport", () => {
    it("should generate CSV with header", () => {
      const csv = formatCSVExport(entries.slice(0, 2));
      const lines = csv.split("\n");
      expect(lines[0]).toBe("id,agent,action,details,timestamp");
      expect(lines.length).toBe(3); // header + 2 rows
    });
  });
});
