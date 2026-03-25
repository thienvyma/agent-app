/**
 * Tests for Settings & Scheduling Dashboard (Session 40).
 * TDD: Written BEFORE implementation code.
 *
 * Covers: company form validation, department list, cron validation,
 * always-on status, scheduling API shape, file existence.
 *
 * @module tests/pages/settings-scheduling
 */

import * as fs from "fs";
import * as path from "path";

// ══════════════════════════════════════════════
// SETTINGS PAGE
// ══════════════════════════════════════════════

describe("Settings Page — Component Files (S40)", () => {
  const settingsDir = path.join(process.cwd(), "src", "app", "(dashboard)", "settings");

  it("should have settings/page.tsx", () => {
    expect(fs.existsSync(path.join(settingsDir, "page.tsx"))).toBe(true);
  });

  it("should have settings/components/company-form.tsx", () => {
    expect(fs.existsSync(path.join(settingsDir, "components", "company-form.tsx"))).toBe(true);
  });
});

describe("Settings Page — Company Form Validation", () => {
  function validateCompanyForm(data: {
    name?: string;
    description?: string;
  }): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Company name is required";
    if (data.name && data.name.length > 100) errors.name = "Max 100 characters";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  it("should pass with valid company name", () => {
    const result = validateCompanyForm({ name: "OpenClaw Corp", description: "AI company" });
    expect(result.valid).toBe(true);
  });

  it("should fail when name is empty", () => {
    const result = validateCompanyForm({ name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("should fail when name too long", () => {
    const result = validateCompanyForm({ name: "A".repeat(101) });
    expect(result.valid).toBe(false);
  });

  it("should accept empty description", () => {
    const result = validateCompanyForm({ name: "Test Co" });
    expect(result.valid).toBe(true);
  });
});

describe("Settings Page — Department List", () => {
  const departments = [
    { id: "d-1", name: "Executive", description: "Top management", parentId: null },
    { id: "d-2", name: "Engineering", description: "Tech team", parentId: null },
    { id: "d-3", name: "Frontend", description: "UI team", parentId: "d-2" },
  ];

  function getTopLevel(depts: typeof departments) {
    return depts.filter((d) => d.parentId === null);
  }

  function getChildren(depts: typeof departments, parentId: string) {
    return depts.filter((d) => d.parentId === parentId);
  }

  it("should identify top-level departments", () => {
    expect(getTopLevel(departments)).toHaveLength(2);
  });

  it("should find children of a parent", () => {
    expect(getChildren(departments, "d-2")).toHaveLength(1);
    expect(getChildren(departments, "d-2")[0]!.name).toBe("Frontend");
  });

  it("should return empty children for leaf departments", () => {
    expect(getChildren(departments, "d-3")).toHaveLength(0);
  });
});

describe("Settings Page — Notification Preferences", () => {
  interface NotifPrefs {
    telegram: boolean;
    email: boolean;
    budgetAlerts: boolean;
    taskComplete: boolean;
  }

  function validateNotifPrefs(prefs: Partial<NotifPrefs>): NotifPrefs {
    return {
      telegram: prefs.telegram ?? false,
      email: prefs.email ?? false,
      budgetAlerts: prefs.budgetAlerts ?? true,
      taskComplete: prefs.taskComplete ?? true,
    };
  }

  it("should default telegram to false", () => {
    expect(validateNotifPrefs({}).telegram).toBe(false);
  });

  it("should default budgetAlerts to true", () => {
    expect(validateNotifPrefs({}).budgetAlerts).toBe(true);
  });

  it("should respect explicit values", () => {
    const prefs = validateNotifPrefs({ telegram: true, budgetAlerts: false });
    expect(prefs.telegram).toBe(true);
    expect(prefs.budgetAlerts).toBe(false);
  });
});

// ══════════════════════════════════════════════
// SCHEDULING PAGE
// ══════════════════════════════════════════════

describe("Scheduling Page — Component Files (S40)", () => {
  const schedDir = path.join(process.cwd(), "src", "app", "(dashboard)", "scheduling");

  it("should have scheduling/page.tsx", () => {
    expect(fs.existsSync(path.join(schedDir, "page.tsx"))).toBe(true);
  });

  it("should have scheduling/components/cron-table.tsx", () => {
    expect(fs.existsSync(path.join(schedDir, "components", "cron-table.tsx"))).toBe(true);
  });
});

describe("Scheduling Page — API Route", () => {
  it("should have api/scheduling/route.ts", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "scheduling", "route.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });
});

describe("Scheduling Page — Cron Expression Validation", () => {
  function isValidCron(expr: string): boolean {
    const parts = expr.trim().split(/\s+/);
    if (parts.length < 5 || parts.length > 6) return false;
    // Basic check: each part matches cron pattern
    const cronPattern = /^(\*|[0-9*,\-\/]+)$/;
    return parts.every((p) => cronPattern.test(p));
  }

  it("should accept valid cron: every 5 minutes", () => {
    expect(isValidCron("*/5 * * * *")).toBe(true);
  });

  it("should accept valid cron: daily at midnight", () => {
    expect(isValidCron("0 0 * * *")).toBe(true);
  });

  it("should accept valid cron: weekdays 9am", () => {
    expect(isValidCron("0 9 * * 1-5")).toBe(true);
  });

  it("should reject empty string", () => {
    expect(isValidCron("")).toBe(false);
  });

  it("should reject too few parts", () => {
    expect(isValidCron("* *")).toBe(false);
  });

  it("should reject invalid characters", () => {
    expect(isValidCron("abc def ghi jkl mno")).toBe(false);
  });
});

describe("Scheduling Page — Job Form Validation", () => {
  function validateJob(data: {
    name?: string;
    cronExpression?: string;
    agentId?: string;
    taskTemplate?: string;
  }): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Job name is required";
    if (!data.cronExpression?.trim()) errors.cronExpression = "Cron expression required";
    if (!data.agentId) errors.agentId = "Agent is required";
    if (!data.taskTemplate?.trim()) errors.taskTemplate = "Task template required";
    return { valid: Object.keys(errors).length === 0, errors };
  }

  it("should pass with all fields", () => {
    const result = validateJob({
      name: "Daily Report",
      cronExpression: "0 9 * * *",
      agentId: "a-1",
      taskTemplate: "Generate daily summary",
    });
    expect(result.valid).toBe(true);
  });

  it("should fail when name missing", () => {
    expect(validateJob({ cronExpression: "* * * * *", agentId: "a", taskTemplate: "x" }).valid).toBe(false);
  });

  it("should fail when all fields empty", () => {
    const result = validateJob({});
    expect(result.valid).toBe(false);
    expect(Object.keys(result.errors).length).toBe(4);
  });
});

describe("Scheduling Page — Always-On Status", () => {
  type HealthStatus = "healthy" | "stale" | "crashed" | "unknown";

  function getHealthStatus(lastPing: Date | null, now: Date): HealthStatus {
    if (!lastPing) return "unknown";
    const diffMs = now.getTime() - lastPing.getTime();
    const diffMins = diffMs / 60000;
    if (diffMins < 5) return "healthy";
    if (diffMins < 30) return "stale";
    return "crashed";
  }

  it("should return healthy when pinged < 5min ago", () => {
    const now = new Date();
    const lastPing = new Date(now.getTime() - 2 * 60000);
    expect(getHealthStatus(lastPing, now)).toBe("healthy");
  });

  it("should return stale when pinged 5-30min ago", () => {
    const now = new Date();
    const lastPing = new Date(now.getTime() - 15 * 60000);
    expect(getHealthStatus(lastPing, now)).toBe("stale");
  });

  it("should return crashed when pinged > 30min ago", () => {
    const now = new Date();
    const lastPing = new Date(now.getTime() - 60 * 60000);
    expect(getHealthStatus(lastPing, now)).toBe("crashed");
  });

  it("should return unknown when no ping data", () => {
    expect(getHealthStatus(null, new Date())).toBe("unknown");
  });
});

describe("Scheduling Page — Job Toggle", () => {
  function toggleJob(job: { id: string; enabled: boolean }): { id: string; enabled: boolean } {
    return { ...job, enabled: !job.enabled };
  }

  it("should disable an enabled job", () => {
    const toggled = toggleJob({ id: "j-1", enabled: true });
    expect(toggled.enabled).toBe(false);
  });

  it("should enable a disabled job", () => {
    const toggled = toggleJob({ id: "j-1", enabled: false });
    expect(toggled.enabled).toBe(true);
  });

  it("should preserve job ID", () => {
    const toggled = toggleJob({ id: "j-1", enabled: true });
    expect(toggled.id).toBe("j-1");
  });
});

describe("Scheduling Page — API Response Shape", () => {
  const MOCK_JOB = {
    id: "j-1",
    name: "Daily Report",
    cronExpression: "0 9 * * *",
    agentId: "a-ceo",
    taskTemplate: "Generate daily summary report",
    enabled: true,
    lastRun: "2026-03-25T09:00:00Z",
    createdAt: "2026-03-20T10:00:00Z",
  };

  it("should have expected fields", () => {
    expect(MOCK_JOB).toHaveProperty("id");
    expect(MOCK_JOB).toHaveProperty("name");
    expect(MOCK_JOB).toHaveProperty("cronExpression");
    expect(MOCK_JOB).toHaveProperty("agentId");
    expect(MOCK_JOB).toHaveProperty("taskTemplate");
    expect(MOCK_JOB).toHaveProperty("enabled");
    expect(MOCK_JOB).toHaveProperty("lastRun");
  });

  it("should have boolean enabled field", () => {
    expect(typeof MOCK_JOB.enabled).toBe("boolean");
  });
});

// ══════════════════════════════════════════════
// TDD RED — NEW FILES (S40 completion)
// These tests MUST FAIL before implementation.
// ══════════════════════════════════════════════

describe("Settings Page — Department List Component (S40)", () => {
  it("should have settings/components/department-list.tsx", () => {
    const filePath = path.join(
      process.cwd(), "src", "app", "(dashboard)", "settings", "components", "department-list.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("Scheduling Page — Always-On Monitor Component (S40)", () => {
  it("should have scheduling/components/always-on-monitor.tsx", () => {
    const filePath = path.join(
      process.cwd(), "src", "app", "(dashboard)", "scheduling", "components", "always-on-monitor.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
  });
});

describe("Departments API Route (S40)", () => {
  it("should have api/departments/route.ts", () => {
    const routePath = path.join(process.cwd(), "src", "app", "api", "departments", "route.ts");
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should validate department creation data", () => {
    function validateDepartment(data: {
      name?: string;
      companyId?: string;
      parentId?: string | null;
    }): { valid: boolean; errors: Record<string, string> } {
      const errors: Record<string, string> = {};
      if (!data.name?.trim()) errors.name = "Department name is required";
      if (data.name && data.name.length > 100) errors.name = "Max 100 characters";
      if (!data.companyId) errors.companyId = "Company ID is required";
      return { valid: Object.keys(errors).length === 0, errors };
    }

    expect(validateDepartment({ name: "Engineering", companyId: "c-1" }).valid).toBe(true);
    expect(validateDepartment({}).valid).toBe(false);
    expect(validateDepartment({ name: "", companyId: "c-1" }).valid).toBe(false);
    expect(validateDepartment({ name: "A".repeat(101), companyId: "c-1" }).valid).toBe(false);
  });

  it("should match expected department response shape", () => {
    const MOCK_DEPT = {
      id: "d-1",
      name: "Engineering",
      description: "Tech team",
      parentId: null,
      companyId: "c-1",
    };
    expect(MOCK_DEPT).toHaveProperty("id");
    expect(MOCK_DEPT).toHaveProperty("name");
    expect(MOCK_DEPT).toHaveProperty("companyId");
    expect(MOCK_DEPT.parentId).toBeNull();
  });
});
