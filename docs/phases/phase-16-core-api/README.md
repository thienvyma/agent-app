# Phase 16: Core API Routes (S16)

> REST API backend cho Dashboard + external tools

---

## Muc tieu
Company + Agent + Health API routes + Auth middleware.
Tat ca routes duoc protect boi NextAuth session.

## Architecture

`
Browser/Postman/CLI
    |
    v
  NextAuth Session Check (api-auth.ts)
    |
    v
  API Route Handler
    |
    v
  Core Business Logic (CompanyManager, AgentOrchestrator)
    |
    v
  Prisma DB
`

## Files tao moi

### 1. src/lib/api-auth.ts
Auth middleware pattern:

export async function withAuth(req: NextRequest): Promise<Session>
  1. getServerSession(req)
  2. If no session -> throw 401 { error: "Unauthorized" }
  3. Return session with userId

export function withErrorHandling(handler: Function)
  1. try/catch wrapper
  2. Prisma errors -> 400 with message
  3. Not found -> 404
  4. Validation errors -> 422 with field details
  5. Unknown -> 500 with generic message
  6. All errors logged to console

Rate limiter:
  - 100 requests/minute per IP (free tier)
  - Track in Redis: INCR rate:ip:{ip} EXPIRE 60

### 2. src/app/api/company/route.ts
  GET    /api/company         -> list companies
  POST   /api/company         -> create { name, description, config? }
  GET    /api/company/:id     -> detail (include departments, agents count)
  PUT    /api/company/:id     -> update { name?, description?, config? }
  DELETE /api/company/:id     -> soft delete (check no active agents)

  GET    /api/company/:id/departments -> list departments
  POST   /api/company/:id/departments -> create { name, parentId? }

### 3. src/app/api/agents/route.ts
  GET    /api/agents           -> list all (filter: status, role, department)
  POST   /api/agents           -> create { name, role, sop, model, tools, skills, departmentId }
  GET    /api/agents/:id       -> detail (include tools, permissions, recent activity)
  PUT    /api/agents/:id       -> update config { sop?, model?, tools? }
  DELETE /api/agents/:id       -> remove (must undeploy first)
  POST   /api/agents/:id/deploy   -> orchestrator.deploy(id)
  POST   /api/agents/:id/undeploy -> orchestrator.undeploy(id)
  POST   /api/agents/:id/message  -> engine.sendMessage(id, body.message)

### 4. src/app/api/health/route.ts (no auth required)
  GET /api/health -> {
    status: "healthy" | "degraded" | "down",
    services: {
      database: { status: "connected", latencyMs: 3 },
      redis: { status: "connected", latencyMs: 1 },
      openclaw: { status: "connected" | "disconnected", port: 18789 },
      ollama: { status: "connected" | "disconnected", port: 11434 }
    },
    agents: { total: 5, active: 3, idle: 1, error: 1 },
    system: { uptime: "24h 30m", memoryUsage: "256MB" }
  }

## Response format chuan
  Success: { data: ..., meta?: { total, page, limit } }
  Error: { error: { code: "NOT_FOUND", message: "Agent not found", details?: {} } }

## Kiem tra
1. GET /api/health -> 200 + all services status
2. POST /api/company -> 201 + company object returned
3. POST /api/agents -> 201 + agent with auto-generated ID
4. POST /api/agents/:id/deploy -> 200 + status = RUNNING
5. Request without auth -> 401
6. Create with invalid data -> 422 + validation errors
7. Rate limit exceeded -> 429

## Edge Cases
- Deploy agent khi OpenClaw down -> 503 + clear message
- Delete company voi active agents -> 409 Conflict
- Concurrent deploy same agent -> lock mechanism
- Large response pagination -> cursor-based paging

## Dependencies: Phase 1 (NextAuth), Phase 5-7 (DB + Company + Orchestrator)
## Lien quan: PRD F7 Dashboard API backend
