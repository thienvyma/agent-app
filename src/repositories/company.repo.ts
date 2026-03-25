/**
 * CompanyRepository — CRUD for Company + Departments.
 * Replaces CompanyManager in-memory storage.
 *
 * @module repositories/company
 */

import { getPrisma } from "./base";

export class CompanyRepository {
  private prisma = getPrisma();

  async create(data: { name: string; description?: string; config?: object }) {
    return this.prisma.company.create({ data: { ...data, config: data.config ?? {} } });
  }

  async findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: { departments: { include: { agents: true } } },
    });
  }

  async list() {
    return this.prisma.company.findMany({
      include: { departments: { include: { agents: true } } },
    });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.company.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.company.delete({ where: { id } });
  }

  // Department sub-operations
  async createDepartment(companyId: string, data: { name: string; description?: string; parentId?: string }) {
    return this.prisma.department.create({ data: { ...data, companyId } });
  }

  async listDepartments(companyId: string) {
    return this.prisma.department.findMany({
      where: { companyId },
      include: { agents: true, children: true },
    });
  }

  async deleteDepartment(id: string) {
    return this.prisma.department.delete({ where: { id } });
  }
}
