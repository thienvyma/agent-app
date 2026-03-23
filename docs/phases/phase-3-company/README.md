# Phase 3: Company Core (Sessions 4–5)

> **Status**: ⬜ Not Started
> **Sessions**: S4 (Company DB + CRUD), S5 (Agent Orchestrator)
> **Phụ thuộc**: Phase 2 hoàn tất

---

## Mục Tiêu

Database schema cho company structure + agent lifecycle management qua adapter.

## Session 4: Company Module (DB + CRUD)

**Mục tiêu**: CRUD company/departments/agents trong PostgreSQL

**Files tạo mới**:
```
prisma/schema.prisma                    — Full DB schema
src/core/company/company-manager.ts     — CompanyManager class
src/core/company/hierarchy-engine.ts    — Hierarchy queries
src/app/api/company/route.ts            — Company API
src/app/api/departments/route.ts        — Department API
src/app/api/agents/route.ts             — Agent API
tests/company/company-manager.test.ts
```

**DB Models**:
- `Company` (id, name, goal)
- `Department` (id, name, parentId → self-ref, companyId)
- `Agent` (id, name, role, systemPrompt, model, provider, status, deptId, reportsTo, skills, tools, schedule, engineRef)
- `Task` (id, title, description, status, priority, agentId, result)
- `Message` (id, fromId, toId, content, type)
- `CorrectionLog` (id, agentId, originalOutput, correction, ruleExtracted)

## Session 5: Agent Orchestrator

**Mục tiêu**: Start/stop agents lifecycle qua adapter

**Files tạo mới**:
```
src/core/orchestrator/agent-orchestrator.ts
src/core/orchestrator/health-monitor.ts
tests/orchestrator/orchestrator.test.ts
```

**Orchestrator methods**:
- `deployAgent(agentId)` → Read DB config → Adapter.createAgent → start
- `undeployAgent(agentId)` → stop → destroy → update DB
- `redeployAgent(agentId)` → undeploy → deploy
- `getDeployedAgents()` → list running
- `healthCheck()` → check all agents status

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
