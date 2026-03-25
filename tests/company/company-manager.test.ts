/**
 * Tests for CompanyManager, HierarchyEngine, and AgentConfigBuilder.
 * Uses mocked Prisma client — no real DB needed.
 */

import { CompanyManager } from "@/core/company/company-manager";
import { HierarchyEngine } from "@/core/company/hierarchy-engine";
import { AgentConfigBuilder } from "@/core/company/agent-config-builder";
import type { AgentConfig } from "@/types/agent";

// Typed mock for Prisma client
interface MockModel {
  create: jest.Mock;
  findUnique: jest.Mock;
  findMany: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
}

function createMockModel(): MockModel {
  return {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}

const mockCompany = createMockModel();
const mockDepartment = createMockModel();
const mockAgent = createMockModel();
const mockTask = createMockModel();

const mockPrisma = {
  company: mockCompany,
  department: mockDepartment,
  agent: mockAgent,
  task: mockTask,
} as unknown;

describe("CompanyManager", () => {
  let manager: CompanyManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new CompanyManager(mockPrisma as never);
  });

  describe("createCompany", () => {
    it("should create a company and return it", async () => {
      const mockResult = { id: "co-1", name: "Test Corp", config: {} };
      mockCompany.create.mockResolvedValue(mockResult);

      const result = await manager.createCompany({
        name: "Test Corp",
        description: "A test company",
      });

      expect(result.name).toBe("Test Corp");
      expect(mockCompany.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "Test Corp" }),
        })
      );
    });
  });

  describe("getCompany", () => {
    it("should return company with departments and agents", async () => {
      const mockResult = {
        id: "co-1",
        name: "My Enterprise",
        departments: [
          { id: "dept-1", name: "Marketing", agents: [{ id: "a-1", name: "Marketing Manager" }] },
        ],
      };
      mockCompany.findUnique.mockResolvedValue(mockResult);

      const result = await manager.getCompany("co-1");

      expect(result?.name).toBe("My Enterprise");
      expect(mockCompany.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({ departments: expect.anything() }),
        })
      );
    });

    it("should throw if company not found", async () => {
      mockCompany.findUnique.mockResolvedValue(null);
      await expect(manager.getCompany("non-existent")).rejects.toThrow(/not found/i);
    });
  });

  describe("createDepartment", () => {
    it("should create department under company", async () => {
      const mockResult = { id: "dept-1", name: "Finance", companyId: "co-1" };
      mockDepartment.create.mockResolvedValue(mockResult);

      const result = await manager.createDepartment("co-1", { name: "Finance" });
      expect(result.name).toBe("Finance");
    });
  });

  describe("createAgent", () => {
    it("should create agent under department", async () => {
      const mockResult = {
        id: "a-1", name: "CEO Agent", role: "ceo",
        sop: "Manage everything", model: "qwen2.5:7b",
        tools: ["email"], skills: ["leadership"], status: "IDLE",
      };
      mockAgent.create.mockResolvedValue(mockResult);

      const result = await manager.createAgent("dept-1", {
        name: "CEO Agent",
        role: "ceo",
        sop: "Manage everything",
        model: "qwen2.5:7b",
        tools: ["email"],
        skills: ["leadership"],
      });
      expect(result.name).toBe("CEO Agent");
      expect(result.role).toBe("ceo");
    });
  });

  describe("deleteAgent", () => {
    it("should throw error when agent has active tasks", async () => {
      mockTask.count.mockResolvedValue(3);
      await expect(manager.deleteAgent("a-1")).rejects.toThrow(/active tasks/i);
    });

    it("should delete agent when no active tasks", async () => {
      mockTask.count.mockResolvedValue(0);
      mockAgent.delete.mockResolvedValue({});

      await manager.deleteAgent("a-1");
      expect(mockAgent.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "a-1" } })
      );
    });
  });
});

describe("HierarchyEngine", () => {
  let engine: HierarchyEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    engine = new HierarchyEngine(mockPrisma as never);
  });

  describe("getOrgTree", () => {
    it("should return nested org tree", async () => {
      mockCompany.findUnique.mockResolvedValue({
        id: "co-1",
        name: "My Enterprise",
        departments: [
          {
            id: "dept-exec", name: "Executive", parentId: null,
            agents: [{ id: "a-ceo", name: "CEO Agent", role: "ceo", status: "RUNNING" }],
          },
          {
            id: "dept-mkt", name: "Marketing", parentId: null,
            agents: [{ id: "a-mkt", name: "Marketing Manager", role: "marketing", status: "IDLE" }],
          },
        ],
      });

      const tree = await engine.getOrgTree("co-1");
      expect(tree.name).toBe("My Enterprise");
      expect(tree.departments).toHaveLength(2);
    });
  });

  describe("findAgentsByRole", () => {
    it("should find agents by role", async () => {
      mockAgent.findMany.mockResolvedValue([
        { id: "a-1", name: "Marketing Manager", role: "marketing" },
      ]);

      const agents = await engine.findAgentsByRole("co-1", "marketing");
      expect(agents).toHaveLength(1);
      expect(agents[0]?.name).toBe("Marketing Manager");
    });
  });

  describe("findBestAgent", () => {
    it("should match task to agent by skills/role keywords", async () => {
      mockAgent.findMany.mockResolvedValue([
        { id: "a-ceo", name: "CEO Agent", role: "ceo", skills: ["leadership"], tools: [] },
        { id: "a-mkt", name: "Marketing Manager", role: "marketing", skills: ["content_writing", "social_media"], tools: ["facebook_api"] },
        { id: "a-fin", name: "Finance Analyst", role: "finance", skills: ["financial_analysis"], tools: ["quickbooks"] },
      ]);

      const best = await engine.findBestAgent("co-1", "viet content marketing cho Facebook");
      expect(best?.name).toBe("Marketing Manager");
    });
  });
});

describe("AgentConfigBuilder", () => {
  const dbAgent = {
    id: "a-ceo",
    name: "CEO Agent",
    role: "ceo",
    sop: "Review daily reports",
    model: "qwen2.5:7b",
    tools: ["email", "calendar"],
    skills: ["leadership", "delegation"],
    isAlwaysOn: true,
    cronSchedule: "*/5 * * * *",
    status: "RUNNING",
  };

  describe("fromDBAgent", () => {
    it("should convert Prisma Agent to IAgentEngine AgentConfig", () => {
      const config: AgentConfig = AgentConfigBuilder.fromDBAgent(dbAgent as never);

      expect(config.id).toBe("a-ceo");
      expect(config.name).toBe("CEO Agent");
      expect(config.role).toBe("ceo");
      expect(config.sop).toBe("Review daily reports");
      expect(config.model).toBe("qwen2.5:7b");
      expect(config.tools).toEqual(["email", "calendar"]);
      expect(config.skills).toEqual(["leadership", "delegation"]);
      expect(config.isAlwaysOn).toBe(true);
      expect(config.cronSchedule).toBe("*/5 * * * *");
    });
  });

  describe("buildSystemPrompt", () => {
    it("should combine role, SOP, tools, and context", () => {
      const prompt = AgentConfigBuilder.buildSystemPrompt(
        dbAgent as never,
        "Today's revenue is $1000"
      );

      expect(prompt).toContain("ceo");
      expect(prompt).toContain("Review daily reports");
      expect(prompt).toContain("email");
      expect(prompt).toContain("Today's revenue is $1000");
    });
  });
});
