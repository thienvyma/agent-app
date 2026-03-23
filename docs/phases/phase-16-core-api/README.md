# Phase 16: Core API Routes (S16)

## Muc tieu
API routes cho Company + Agent + Health check + Auth middleware.

## Session 16
- Files: api/company/route.ts, api/agents/route.ts, api/health/route.ts, lib/api-auth.ts
- Auth middleware: NextAuth session -> chi owner moi access API
- Company API: GET/POST/PUT company + departments
- Agent API: GET/POST agents, POST deploy, DELETE undeploy
- Health API: GET system health status
- Test: curl create company + agent OK, unauthenticated -> 401

## Lien quan PRD: F7 Dashboard API backend
