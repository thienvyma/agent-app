# Phase 32: Database Integration (S32)

> Wire tat ca in-memory modules sang Prisma/PostgreSQL.
> Sau phase nay, data PERSIST qua restart.

## Modules can wire

| Module | Hien tai | Sau S32 |
|--------|---------|---------|
| CompanyManager | In-memory array | Prisma Company/Department |
| AgentConfig | In-memory map | Prisma Agent |
| TaskDecomposer | In-memory | Prisma Task/SubTask |
| CostTracker | In-memory | Prisma CostEntry |
| BudgetManager | In-memory | Prisma Budget |
| ApprovalEngine | In-memory | Prisma ApprovalRequest |
| ConversationLogger | In-memory | Prisma Conversation/Message |
| CorrectionLogManager | In-memory | Prisma CorrectionLog |
| ScheduleManager | In-memory | Prisma ScheduledJob |
| TenantManager | In-memory | Prisma Tenant |
| AuditLogger | In-memory | Prisma ActivityLog |

## Approach: Repository Pattern

```typescript
// Moi module co 1 Repository thay the in-memory store
// Vi du:
class CompanyRepository {
  constructor(private prisma: PrismaClient) {}
  
  async create(data) { return this.prisma.company.create({ data }); }
  async findById(id) { return this.prisma.company.findUnique({ where: { id } }); }
  async list() { return this.prisma.company.findMany({ include: { departments: true, agents: true } }); }
  async update(id, data) { return this.prisma.company.update({ where: { id }, data }); }
  async delete(id) { return this.prisma.company.delete({ where: { id } }); }
}
```

## Files tao moi
1. `src/repositories/company.repo.ts`
2. `src/repositories/agent.repo.ts`
3. `src/repositories/task.repo.ts`
4. `src/repositories/cost.repo.ts`
5. `src/repositories/approval.repo.ts`
6. `src/repositories/conversation.repo.ts`
7. `src/repositories/correction.repo.ts`
8. `src/repositories/schedule.repo.ts`
9. `src/repositories/tenant.repo.ts`
10. `src/repositories/activity.repo.ts`
11. `tests/repositories/repositories.test.ts`

## Kiem tra
- CRUD operations qua Prisma
- Data persist qua restart
- Relations (Agent → Company → Department)
- Query performance
