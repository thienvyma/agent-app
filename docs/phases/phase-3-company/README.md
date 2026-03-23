# Phase 3: Company Core + Tools (Sessions 4–5)

> **Status**: ⬜ Not Started
> **Sessions**: S4 (Company DB + CRUD), S5 (Orchestrator + Tools + Audit)
> **Phụ thuộc**: Phase 2 hoàn tất

---

## Mục Tiêu

Database schema cho company structure + agent lifecycle + tool permissions + audit trail + error recovery.

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
- `Agent` (id, name, role, systemPrompt, model, provider, status, deptId, reportsTo, skills, tools, toolPermissions, schedule, engineRef)
- `Task` (id, title, description, status, priority, agentId, parentTaskId, result, tokenUsed, cost)
- `Message` (id, fromId, toId, content, type, channel)
- `CorrectionLog` (id, agentId, taskId, originalOutput, correction, ruleExtracted, ruleCategory)
- `AuditLog` (id, agentId, action, details, timestamp)
- `ToolPermission` (id, agentId, toolName, allowed, config)

## Session 5: Orchestrator + Tools + Audit

**Mục tiêu**: Agent lifecycle + tool permissions + audit + error recovery

**Files tạo mới**:
```
src/core/orchestrator/agent-orchestrator.ts   — Lifecycle management
src/core/orchestrator/health-monitor.ts       — Health checks + auto-restart
src/core/tools/tool-registry.ts               — Register custom tools
src/core/tools/tool-permission.ts             — Per-agent tool access control
src/core/audit/audit-logger.ts                — Log mọi action
src/core/orchestrator/error-recovery.ts       — Retry + escalation
src/core/orchestrator/task-decomposer.ts      — CEO auto-split complex tasks
tests/orchestrator/orchestrator.test.ts
tests/tools/tool-permission.test.ts
```

**Orchestrator methods**:
- `deployAgent(agentId)` → Read DB config → Adapter.createAgent → start
- `undeployAgent(agentId)` → stop → destroy → update DB
- `redeployAgent(agentId)` → undeploy → deploy
- `getDeployedAgents()` → list running
- `healthCheck()` → check all agents status

**Tool Permission System**:
```typescript
// Mỗi agent chỉ được dùng tools được cấp phép
toolPermission.check("marketing-agent", "facebook_ads_api") → true
toolPermission.check("marketing-agent", "bank_transfer") → false
```

**Error Recovery**:
```
Agent fail → retry (max 3, exponential backoff)
  → still fail → escalate to CEO
  → CEO can't handle → escalate to Owner (Telegram alert)
  → Partial results saved → không mất công việc đã làm
```

**Audit Logger**:
```
Mọi action agent thực hiện → AuditLog table
  → action: "send_email", "create_document", "call_api"
  → details: input/output summary
  → Searchable trên Dashboard
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*


