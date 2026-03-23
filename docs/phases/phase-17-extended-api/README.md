# Phase 17: Extended API Routes (S17)

> API cho Tasks, Messages, Approvals, Audit

---

## Muc tieu
Complete REST API coverage cho dashboard consumption.

## Files tao moi

### 1. src/app/api/tasks/route.ts
  GET /api/tasks -> list tasks (filter: status, agent, date)
  POST /api/tasks -> create + assign task { description, agentId, priority }
  GET /api/tasks/:id -> task detail (include sub-tasks, approval, result)
  PUT /api/tasks/:id -> update status
  POST /api/tasks/:id/retry -> retry failed task

### 2. src/app/api/messages/route.ts
  GET /api/messages -> list messages (filter: agent, type, date, paginated)
  POST /api/messages -> send message between agents

### 3. src/app/api/approvals/route.ts
  GET /api/approvals -> list pending approvals
  POST /api/approvals/:id/approve -> approve { response }
  POST /api/approvals/:id/reject -> reject { feedback }
  POST /api/approvals/:id/modify -> modify { modifications }

### 4. src/app/api/audit/route.ts
  GET /api/audit -> search audit logs (filter: agent, action, date range)

### 5. src/app/api/cost/route.ts
  GET /api/cost/report -> cost report { perAgent, total, budget }
  GET /api/cost/budget -> budget status per agent

## Kiem tra
1. POST /api/tasks -> task created + assigned
2. GET /api/approvals -> pending list
3. POST /api/approvals/:id/approve -> status updated
4. GET /api/audit?agent=ceo -> filtered results

## Dependencies: Phase 16 (auth middleware), Phase 8-9 (tools + tasks)
## Lien quan: PRD F7 Dashboard API
