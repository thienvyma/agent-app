/**
 * CompanyManager — CRUD operations for Company, Department, and Agent.
 *
 * All database operations go through this service layer.
 * Enforces business rules (e.g., no delete agent with active tasks).
 *
 * @module core/company/company-manager
 */

import { PrismaClient, Prisma } from "@prisma/client";

/** Input for creating a company */
export interface CreateCompanyInput {
  name: string;
  description?: string;
  config?: Record<string, unknown>;
}

/** Input for updating a company */
export interface UpdateCompanyInput {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
}

/** Input for creating a department */
export interface CreateDeptInput {
  name: string;
  description?: string;
  parentId?: string;
}

/** Input for creating an agent */
export interface CreateAgentInput {
  name: string;
  role: string;
  sop: string;
  model: string;
  tools?: string[];
  skills?: string[];
  isAlwaysOn?: boolean;
  cronSchedule?: string;
}

/** Input for updating an agent */
export interface UpdateAgentInput {
  name?: string;
  role?: string;
  sop?: string;
  model?: string;
  tools?: string[];
  skills?: string[];
  isAlwaysOn?: boolean;
  cronSchedule?: string;
}

/**
 * Service layer for Company/Department/Agent CRUD.
 */
export class CompanyManager {
  constructor(private readonly db: PrismaClient) {}

  /**
   * Create a new company.
   */
  async createCompany(data: CreateCompanyInput) {
    return this.db.company.create({
      data: {
        name: data.name,
        description: data.description,
        config: (data.config ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  /**
   * Get company with full hierarchy (departments + agents).
   *
   * @throws Error if company not found
   */
  async getCompany(id: string) {
    const company = await this.db.company.findUnique({
      where: { id },
      include: {
        departments: {
          include: {
            agents: true,
          },
        },
      },
    });

    if (!company) {
      throw new Error(`Company ${id} not found`);
    }

    return company;
  }

  /**
   * Update company details.
   */
  async updateCompany(id: string, data: UpdateCompanyInput) {
    return this.db.company.update({
      where: { id },
      data: {
        ...data,
        config: data.config !== undefined ? (data.config as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  /**
   * Create a department under a company.
   */
  async createDepartment(companyId: string, data: CreateDeptInput) {
    return this.db.department.create({
      data: {
        name: data.name,
        description: data.description,
        parentId: data.parentId,
        companyId,
      },
    });
  }

  /**
   * Create an agent under a department.
   */
  async createAgent(departmentId: string, data: CreateAgentInput) {
    return this.db.agent.create({
      data: {
        name: data.name,
        role: data.role,
        sop: data.sop,
        model: data.model,
        tools: data.tools ?? [],
        skills: data.skills ?? [],
        isAlwaysOn: data.isAlwaysOn ?? false,
        cronSchedule: data.cronSchedule,
        departmentId,
      },
    });
  }

  /**
   * Update agent details.
   */
  async updateAgent(agentId: string, data: UpdateAgentInput) {
    return this.db.agent.update({
      where: { id: agentId },
      data,
    });
  }

  /**
   * Delete an agent. Checks for active tasks first.
   *
   * @throws Error if agent has active (non-completed, non-failed) tasks
   */
  async deleteAgent(agentId: string) {
    const activeTasks = await this.db.task.count({
      where: {
        assignedToId: agentId,
        status: { in: ["PENDING", "IN_PROGRESS", "WAITING_APPROVAL"] },
      },
    });

    if (activeTasks > 0) {
      throw new Error(
        `Cannot delete agent ${agentId}: has ${activeTasks} active tasks`
      );
    }

    return this.db.agent.delete({ where: { id: agentId } });
  }

  /**
   * Get agent with department and toolPermissions.
   *
   * @throws Error if agent not found
   */
  async getAgent(agentId: string) {
    const agent = await this.db.agent.findUnique({
      where: { id: agentId },
      include: {
        department: true,
        toolPermissions: true,
      },
    });

    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return agent;
  }
}
