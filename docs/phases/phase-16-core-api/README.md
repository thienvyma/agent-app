# Phase 16: Core API Routes (S16)

> API backend cho Dashboard + external integrations

---

## Muc tieu
REST API routes cho Company + Agent + Health + Auth middleware.

## Files tao moi

### 1. src/lib/api-auth.ts
Auth middleware:
  - withAuth(handler): wrap API route handler
  - Check NextAuth session -> 401 if unauthenticated
  - Extract userId from session
  - Rate limiting: 100 requests/minute per user

### 2. src/app/api/company/route.ts
  GET /api/company -> list companies (with departments + agents count)
  POST /api/company -> create company { name, description }
  GET /api/company/:id -> company detail (include departments, agents)
  PUT /api/company/:id -> update company

### 3. src/app/api/agents/route.ts
  GET /api/agents -> list all agents (with status, department)
  POST /api/agents -> create agent { name, role, sop, model, tools, departmentId }
  GET /api/agents/:id -> agent detail
  PUT /api/agents/:id -> update agent config
  POST /api/agents/:id/deploy -> deploy via AgentOrchestrator
  POST /api/agents/:id/undeploy -> undeploy
  POST /api/agents/:id/message -> send message to agent

### 4. src/app/api/health/route.ts
  GET /api/health -> {
    status: "healthy",
    services: { db: true, redis: true, openclaw: true, ollama: true },
    agents: { total: 5, active: 3 },
    uptime: "24h 30m"
  }

## Kiem tra
1. GET /api/health -> 200 + service statuses
2. POST /api/company -> 201 + company created
3. POST /api/agents -> 201 + agent created
4. Unauthenticated request -> 401
5. Invalid body -> 400 + validation errors

## Dependencies: Phase 5-7 (DB + Company + Orchestrator)
## Lien quan: PRD F7 Dashboard API
