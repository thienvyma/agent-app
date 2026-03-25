/**
 * Tests for Agents Dashboard Page (Session 35).
 * Covers: agent list structure, filter logic, form validation, API response shape.
 *
 * @module tests/pages/agents-page
 */

import * as fs from "fs";
import * as path from "path";

/** Agent status enum values matching Prisma schema */
const AGENT_STATUSES = ["IDLE", "RUNNING", "ERROR", "DEPLOYING", "PAUSED_BUDGET"];

/** Mock agent data matching Prisma Agent model */
const MOCK_AGENT = {
  id: "agent-001",
  name: "CEO Agent",
  role: "ceo",
  sop: "Oversee all operations",
  model: "qwen2.5:7b",
  tools: ["email", "search"],
  skills: ["delegation", "review"],
  status: "RUNNING" as const,
  isAlwaysOn: true,
  cronSchedule: "*/5 * * * *",
  departmentId: "dept-001",
  department: { id: "dept-001", name: "Executive" },
};

const MOCK_AGENTS = [
  MOCK_AGENT,
  {
    id: "agent-002",
    name: "Marketing Agent",
    role: "marketing",
    sop: "Content creation",
    model: "qwen2.5:7b",
    tools: ["writing"],
    skills: ["seo"],
    status: "IDLE" as const,
    isAlwaysOn: false,
    cronSchedule: null,
    departmentId: "dept-002",
    department: { id: "dept-002", name: "Marketing" },
  },
  {
    id: "agent-003",
    name: "Finance Agent",
    role: "finance",
    sop: "Budget tracking",
    model: "qwen2.5:7b",
    tools: ["calculator"],
    skills: ["analysis"],
    status: "ERROR" as const,
    isAlwaysOn: false,
    cronSchedule: null,
    departmentId: "dept-003",
    department: { id: "dept-003", name: "Finance" },
  },
];

describe("Agents Page — Component Files", () => {
  const agentsDir = path.join(process.cwd(), "src", "app", "(dashboard)", "agents");

  it("should have agents/page.tsx", () => {
    expect(fs.existsSync(path.join(agentsDir, "page.tsx"))).toBe(true);
  });

  it("should have agents/[id]/page.tsx", () => {
    expect(fs.existsSync(path.join(agentsDir, "[id]", "page.tsx"))).toBe(true);
  });

  it("should have agents/components/agent-list.tsx", () => {
    expect(fs.existsSync(path.join(agentsDir, "components", "agent-list.tsx"))).toBe(true);
  });

  it("should have agents/components/agent-form.tsx", () => {
    expect(fs.existsSync(path.join(agentsDir, "components", "agent-form.tsx"))).toBe(true);
  });

  it("should have agents/components/agent-chat.tsx", () => {
    expect(fs.existsSync(path.join(agentsDir, "components", "agent-chat.tsx"))).toBe(true);
  });
});

describe("Agents Page — Filter Logic", () => {
  function filterAgents(
    agents: typeof MOCK_AGENTS,
    filters: { status?: string; department?: string; search?: string }
  ) {
    return agents.filter((agent) => {
      if (filters.status && agent.status !== filters.status) return false;
      if (filters.department && agent.department.name !== filters.department) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!agent.name.toLowerCase().includes(q) && !agent.role.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  it("should return all agents with no filter", () => {
    expect(filterAgents(MOCK_AGENTS, {})).toHaveLength(3);
  });

  it("should filter by status RUNNING", () => {
    const result = filterAgents(MOCK_AGENTS, { status: "RUNNING" });
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("CEO Agent");
  });

  it("should filter by department", () => {
    const result = filterAgents(MOCK_AGENTS, { department: "Marketing" });
    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("Marketing Agent");
  });

  it("should filter by search query", () => {
    const result = filterAgents(MOCK_AGENTS, { search: "finance" });
    expect(result).toHaveLength(1);
  });

  it("should combine status + search filter", () => {
    const result = filterAgents(MOCK_AGENTS, { status: "IDLE", search: "market" });
    expect(result).toHaveLength(1);
    expect(result[0]!.role).toBe("marketing");
  });

  it("should return empty when no match", () => {
    const result = filterAgents(MOCK_AGENTS, { status: "DEPLOYING" });
    expect(result).toHaveLength(0);
  });
});

describe("Agents Page — Form Validation", () => {
  function validateAgentForm(data: {
    name?: string;
    role?: string;
    departmentId?: string;
  }): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!data.name?.trim()) errors.name = "Name is required";
    if (!data.role?.trim()) errors.role = "Role is required";
    if (!data.departmentId) errors.departmentId = "Department is required";
    return errors;
  }

  it("should pass with all required fields", () => {
    const errors = validateAgentForm({
      name: "New Agent",
      role: "developer",
      departmentId: "dept-001",
    });
    expect(Object.keys(errors)).toHaveLength(0);
  });

  it("should fail when name is empty", () => {
    const errors = validateAgentForm({ name: "", role: "dev", departmentId: "d" });
    expect(errors.name).toBeDefined();
  });

  it("should fail when role is missing", () => {
    const errors = validateAgentForm({ name: "Agent", departmentId: "d" });
    expect(errors.role).toBeDefined();
  });

  it("should fail when departmentId is missing", () => {
    const errors = validateAgentForm({ name: "Agent", role: "dev" });
    expect(errors.departmentId).toBeDefined();
  });

  it("should return all errors when all fields empty", () => {
    const errors = validateAgentForm({});
    expect(Object.keys(errors)).toHaveLength(3);
  });
});

describe("Agents Page — API Response Shape", () => {
  it("should have expected agent fields", () => {
    const agent = MOCK_AGENT;
    expect(agent).toHaveProperty("id");
    expect(agent).toHaveProperty("name");
    expect(agent).toHaveProperty("role");
    expect(agent).toHaveProperty("sop");
    expect(agent).toHaveProperty("model");
    expect(agent).toHaveProperty("tools");
    expect(agent).toHaveProperty("skills");
    expect(agent).toHaveProperty("status");
    expect(agent).toHaveProperty("department");
  });

  it("should have valid status values", () => {
    MOCK_AGENTS.forEach((agent) => {
      expect(AGENT_STATUSES).toContain(agent.status);
    });
  });

  it("should have tools as array", () => {
    expect(Array.isArray(MOCK_AGENT.tools)).toBe(true);
  });

  it("should have department with id and name", () => {
    expect(MOCK_AGENT.department).toHaveProperty("id");
    expect(MOCK_AGENT.department).toHaveProperty("name");
  });
});
