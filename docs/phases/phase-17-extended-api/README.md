# Phase 17: Extended API Routes (S17)

> API cho Tasks, Messages, Approvals, Audit, Cost

---

## Muc tieu
Complete REST API coverage cho dashboard + Telegram bot consumption.

## Files tao moi

### 1. src/app/api/tasks/route.ts
  GET    /api/tasks             -> list (filter: status, agent, priority, date)
  POST   /api/tasks             -> create { description, agentId?, priority? }
    If agentId provided -> direct assign
    If no agentId -> TaskDecomposer decides
  GET    /api/tasks/:id         -> detail (include: sub-tasks tree, approval, result, error log)
  PUT    /api/tasks/:id         -> update { status?, assignedToId? }
  POST   /api/tasks/:id/retry   -> ErrorRecovery.retry(id)
  GET    /api/tasks/:id/subtasks -> list sub-tasks (tree format)

### 2. src/app/api/messages/route.ts
  GET    /api/messages           -> list (filter: agent, type, date, search content)
    Pagination: cursor-based, default 50 per page
  POST   /api/messages           -> send { fromAgentId, toAgentId, content, type }
  GET    /api/messages/threads/:agentId -> conversation threads for an agent

### 3. src/app/api/approvals/route.ts
  GET    /api/approvals          -> list pending (include task details)
  GET    /api/approvals/:id      -> detail (task, agent, reason, policy)
  POST   /api/approvals/:id/approve -> { response? }
  POST   /api/approvals/:id/reject  -> { feedback } (creates CorrectionLog)
  POST   /api/approvals/:id/modify  -> { modifications }
  GET    /api/approvals/stats    -> { pending, approved, rejected, avgResponseTime }

### 4. src/app/api/audit/route.ts
  GET    /api/audit              -> search (filter: agent, action, date range, tool)
    Default: last 24h, 100 entries
  GET    /api/audit/export       -> CSV download

### 5. src/app/api/cost/route.ts
  GET    /api/cost/report        -> CostTracker.getReport(period)
    query: ?period=day|week|month
  GET    /api/cost/budget        -> budget status per agent
  PUT    /api/cost/budget/:agentId -> setBudget { maxTokensPerDay }

## Kiem tra
1. POST /api/tasks -> task created + assigned (or queued for decomposition)
2. GET /api/approvals -> pending list with task details
3. POST /api/approvals/:id/approve -> status updated + task resumes
4. POST /api/approvals/:id/reject -> CorrectionLog created
5. GET /api/audit?agent=ceo-id -> filtered results
6. GET /api/cost/report?period=week -> per-agent breakdown

## Dependencies: Phase 16 (auth middleware), Phase 8-15 (all core modules)
## Lien quan: PRD F7 Dashboard API, F4 Approval, F11 Audit + Cost
