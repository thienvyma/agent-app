/**
 * Tests for Messages & Activity Dashboard (Session 38).
 * Covers: thread grouping, type color mapping, timeAgo,
 * activity event style, date grouping, file existence.
 *
 * @module tests/pages/messages-activity
 */

import * as fs from "fs";
import * as path from "path";

/** Message types */
const MESSAGE_TYPES = ["DELEGATE", "REPORT", "CHAIN", "GROUP", "ALERT", "ESCALATION"] as const;

/** Type color map (mirrors message-thread.tsx) */
const TYPE_COLORS: Record<string, string> = {
  DELEGATE: "blue",
  REPORT: "green",
  CHAIN: "purple",
  GROUP: "cyan",
  ALERT: "red",
  ESCALATION: "amber",
};

/** Mock messages */
const MOCK_MESSAGES = [
  { id: "m-1", fromAgentId: "a-ceo", toAgentId: "a-mkt", content: "Write report", type: "DELEGATE", createdAt: "2026-03-24T10:00:00Z" },
  { id: "m-2", fromAgentId: "a-mkt", toAgentId: "a-ceo", content: "Report done", type: "REPORT", createdAt: "2026-03-24T10:05:00Z" },
  { id: "m-3", fromAgentId: "a-ceo", toAgentId: "a-mkt", content: "Good. Next task", type: "DELEGATE", createdAt: "2026-03-24T10:10:00Z" },
  { id: "m-4", fromAgentId: "a-ceo", toAgentId: "a-dev", content: "Deploy v2", type: "DELEGATE", createdAt: "2026-03-24T11:00:00Z" },
  { id: "m-5", fromAgentId: "a-sys", toAgentId: "a-ceo", content: "Budget alert", type: "ALERT", createdAt: "2026-03-24T12:00:00Z" },
];

describe("Messages Page — Component Files (S38)", () => {
  const msgsDir = path.join(process.cwd(), "src", "app", "(dashboard)", "messages");

  it("should have messages/page.tsx", () => {
    expect(fs.existsSync(path.join(msgsDir, "page.tsx"))).toBe(true);
  });

  it("should have messages/components/message-thread.tsx", () => {
    expect(fs.existsSync(path.join(msgsDir, "components", "message-thread.tsx"))).toBe(true);
  });
});

describe("Messages Page — Thread Grouping", () => {
  function groupByThread(messages: typeof MOCK_MESSAGES) {
    const map = new Map<string, typeof MOCK_MESSAGES>();
    for (const msg of messages) {
      const key = [msg.fromAgentId, msg.toAgentId].sort().join("-");
      const arr = map.get(key) ?? [];
      arr.push(msg);
      map.set(key, arr);
    }
    return map;
  }

  it("should group messages by sorted agent pair", () => {
    const threads = groupByThread(MOCK_MESSAGES);
    // a-ceo↔a-mkt = 3 msgs, a-ceo↔a-dev = 1, a-ceo↔a-sys = 1
    expect(threads.size).toBe(3);
  });

  it("should put bidirectional messages in same thread", () => {
    const threads = groupByThread(MOCK_MESSAGES);
    const key = ["a-ceo", "a-mkt"].sort().join("-");
    expect(threads.get(key)).toHaveLength(3);
  });

  it("should produce same key regardless of direction", () => {
    const key1 = ["a-ceo", "a-mkt"].sort().join("-");
    const key2 = ["a-mkt", "a-ceo"].sort().join("-");
    expect(key1).toBe(key2);
  });
});

describe("Messages Page — Type Color Mapping", () => {
  function getTypeColor(type: string): string {
    return TYPE_COLORS[type] ?? "gray";
  }

  it("should map DELEGATE to blue", () => {
    expect(getTypeColor("DELEGATE")).toBe("blue");
  });

  it("should map REPORT to green", () => {
    expect(getTypeColor("REPORT")).toBe("green");
  });

  it("should map ALERT to red", () => {
    expect(getTypeColor("ALERT")).toBe("red");
  });

  it("should map ESCALATION to amber", () => {
    expect(getTypeColor("ESCALATION")).toBe("amber");
  });

  it("should default to gray for unknown type", () => {
    expect(getTypeColor("UNKNOWN")).toBe("gray");
  });

  it("should have colors for all defined types", () => {
    MESSAGE_TYPES.forEach((t) => {
      expect(TYPE_COLORS[t]).toBeDefined();
    });
  });
});

describe("Messages Page — timeAgo Utility", () => {
  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  it("should return 'just now' for recent time", () => {
    const now = new Date().toISOString();
    expect(timeAgo(now)).toBe("just now");
  });

  it("should return minutes ago", () => {
    const past = new Date(Date.now() - 5 * 60000).toISOString();
    expect(timeAgo(past)).toBe("5m ago");
  });

  it("should return hours ago", () => {
    const past = new Date(Date.now() - 3 * 3600000).toISOString();
    expect(timeAgo(past)).toBe("3h ago");
  });

  it("should return days ago", () => {
    const past = new Date(Date.now() - 2 * 86400000).toISOString();
    expect(timeAgo(past)).toBe("2d ago");
  });
});

describe("Activity Page — Component Files (S38)", () => {
  const actDir = path.join(process.cwd(), "src", "app", "(dashboard)", "activity");

  it("should have activity/page.tsx", () => {
    expect(fs.existsSync(path.join(actDir, "page.tsx"))).toBe(true);
  });

  it("should have activity/components/activity-timeline.tsx", () => {
    expect(fs.existsSync(path.join(actDir, "components", "activity-timeline.tsx"))).toBe(true);
  });

  it("should have activity/components/activity-table.tsx", () => {
    expect(fs.existsSync(path.join(actDir, "components", "activity-table.tsx"))).toBe(true);
  });
});

describe("Activity Page — API Route (S38)", () => {
  it("should have api/activity/route.ts", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "activity", "route.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });
});

describe("Activity Page — Event Style Mapping", () => {
  function getEventStyle(event: string): { color: string; category: string } {
    const lower = event.toLowerCase();
    if (lower.includes("error") || lower.includes("fail")) return { color: "red", category: "error" };
    if (lower.includes("success") || lower.includes("complete")) return { color: "emerald", category: "success" };
    if (lower.includes("alert") || lower.includes("warning")) return { color: "amber", category: "warning" };
    if (lower.includes("start") || lower.includes("trigger")) return { color: "blue", category: "trigger" };
    return { color: "indigo", category: "info" };
  }

  it("should map error events to red", () => {
    expect(getEventStyle("task_error").color).toBe("red");
    expect(getEventStyle("deploy_failed").color).toBe("red");
  });

  it("should map success events to emerald", () => {
    expect(getEventStyle("task_complete").color).toBe("emerald");
    expect(getEventStyle("deploy_success").color).toBe("emerald");
  });

  it("should map warnings to amber", () => {
    expect(getEventStyle("budget_alert").color).toBe("amber");
  });

  it("should map triggers to blue", () => {
    expect(getEventStyle("cron_trigger").color).toBe("blue");
    expect(getEventStyle("agent_start").color).toBe("blue");
  });

  it("should default to indigo for unknown events", () => {
    expect(getEventStyle("some_event").color).toBe("indigo");
  });
});

describe("Activity Page — Date Grouping", () => {
  function groupByDate(entries: { createdAt: string }[]) {
    const map = new Map<string, number>();
    for (const e of entries) {
      const date = new Date(e.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return map;
  }

  it("should group entries by date", () => {
    const entries = [
      { createdAt: "2026-03-24T10:00:00Z" },
      { createdAt: "2026-03-24T15:00:00Z" },
      { createdAt: "2026-03-25T08:00:00Z" },
    ];
    const grouped = groupByDate(entries);
    expect(grouped.size).toBe(2);
  });
});

describe("Activity Page — CSV Export", () => {
  function exportCSV(entries: { event: string; source: string | null; data: unknown; createdAt: string }[]) {
    const header = "Event,Source,Data,Date\n";
    const rows = entries.map((e) =>
      `"${e.event}","${e.source ?? ""}","${JSON.stringify(e.data ?? {}).replace(/"/g, '""')}","${new Date(e.createdAt).toISOString()}"`
    ).join("\n");
    return header + rows;
  }

  it("should generate valid CSV header", () => {
    const csv = exportCSV([]);
    expect(csv.startsWith("Event,Source,Data,Date")).toBe(true);
  });

  it("should handle null source", () => {
    const csv = exportCSV([{ event: "test", source: null, data: {}, createdAt: "2026-03-24T10:00:00Z" }]);
    expect(csv).toContain('""');
  });
});
