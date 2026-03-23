# 📋 SESSIONS.md — Chi Tiết Từng Session

> File này mô tả CHÍNH XÁC mỗi session cần làm gì.
> Trước khi bắt đầu session N, đọc mục Session N trong file này.
> **Tổng cộng: 15 sessions, 8 phases + CLI song song**

---

## Phase 1: Foundation & Scaffold

### Session 0: Foundation Documents ✅
**Đã hoàn thành** — 20 files, 6 commits. Xem PROGRESS.md.

### Session 1: Project Scaffold

**Mục tiêu**: `npm run dev` → Next.js chạy, Docker chạy.

**Bước thực hiện**:
1. `npx -y create-next-app@latest ./` — Next.js 15, TypeScript, App Router, NO Tailwind
2. Cài dependencies:
   ```bash
   npm i prisma @prisma/client bullmq ioredis socket.io socket.io-client grammy next-auth
   npm i -D vitest @types/node
   ```
3. `docker-compose.yml` (PostgreSQL 16 + pgvector + Redis 7)
4. Prisma init + `.env`
5. Tạo folder structure:
   ```
   src/core/adapter/     src/core/company/     src/core/orchestrator/
   src/core/memory/      src/core/messaging/   src/core/approval/
   src/core/feedback/    src/core/channels/    src/core/tools/
   src/core/audit/       src/core/cost/        src/core/triggers/
   src/cli/              src/types/            src/lib/
   tests/
   ```
6. CLI-Anything setup (nếu có)

**Test**: `npm run dev` → OK, `docker compose up` → OK
**Commit**: `chore(scaffold): Next.js 15 + Prisma + Docker + folder structure`

---

## Phase 2: Adapter Layer

### Session 2: IAgentEngine Interface + Tests

**Mục tiêu**: Interface contract + mock adapter + all tests pass.

**Files**:
```
src/types/agent.ts                    — AgentConfig, AgentStatus, AgentResponse
src/types/engine.ts                   — IAgentEngine interface
src/core/adapter/mock-adapter.ts      — MockAdapter for testing
tests/adapter/engine.test.ts
```

**Tests**: createAgent, startAgent, stopAgent, sendMessage, getAgentStatus, listActiveAgents, invalid config throws
**CLI**: `ae agent --help` (placeholder)
**Commit**: `feat(adapter): IAgentEngine interface + types + mock + tests`

### Session 3: OpenClaw Adapter

**Mục tiêu**: Adapter giao tiếp thật với OpenClaw Gateway qua HTTP.

**Files**:
```
src/core/adapter/openclaw-adapter.ts  — OpenClawAdapter implements IAgentEngine
src/core/adapter/openclaw-client.ts   — HTTP client cho Gateway API
src/core/adapter/adapter-factory.ts   — Factory: Mock vs OpenClaw
tests/adapter/openclaw.test.ts
```

**OpenClaw endpoints**: POST /api/sessions, DELETE /api/sessions/:id, POST /api/sessions/:id/chat, GET /api/sessions/:id, GET /api/sessions
**Commit**: `feat(adapter): OpenClaw adapter via HTTP Gateway API`

---

## Phase 3: Company Core + Tools

### Session 4: Company Module (DB + CRUD)

**Mục tiêu**: CRUD company/departments/agents trong PostgreSQL.

**Files**:
```
prisma/schema.prisma                  — Full schema (Company, Dept, Agent, Task, Message, CorrectionLog, AuditLog, ToolPermission)
src/core/company/company-manager.ts
src/core/company/hierarchy-engine.ts
src/app/api/company/route.ts
src/app/api/departments/route.ts
src/app/api/agents/route.ts
tests/company/company-manager.test.ts
```

**CLI**: `ae company create`, `ae agent create`, `ae agent list`
**Commit**: `feat(company): DB schema + CompanyManager CRUD + API routes`

### Session 5: Orchestrator + Tools + Audit

**Mục tiêu**: Agent lifecycle + tool permissions + audit + error recovery.

**Files**:
```
src/core/orchestrator/agent-orchestrator.ts
src/core/orchestrator/health-monitor.ts
src/core/orchestrator/error-recovery.ts
src/core/orchestrator/task-decomposer.ts
src/core/tools/tool-registry.ts
src/core/tools/tool-permission.ts
src/core/audit/audit-logger.ts
tests/orchestrator/orchestrator.test.ts
tests/tools/tool-permission.test.ts
```

**CLI**: `ae agent deploy <id>`, `ae agent undeploy <id>`, `ae agent status`
**Commit**: `feat(orchestrator): lifecycle + tools + audit + error recovery`

---

## Phase 4: Memory & Knowledge Base (3-Tier)

### Session 6: pgvector + Embedding Service (Tier 2)

**Mục tiêu**: pgvector setup + embedding pipeline.

**Files**:
```
src/core/memory/vector-store.ts       — pgvector CRUD
src/core/memory/embedding-service.ts  — Ollama embedding (local, free)
src/core/memory/memory-types.ts
tests/memory/vector-store.test.ts
tests/memory/embedding-service.test.ts
```

**Note**: Tier 1 (OpenClaw MEMORY.md + Mem0) đã có sẵn, Tier 3 (Redis) đã có.
**CLI**: `ae memory status`, `ae memory search "query"`
**Commit**: `feat(memory): pgvector + embedding service (3-tier Tier 2)`

### Session 7: Knowledge Base + Context Builder

**Mục tiêu**: Auto-log + document ingestion + context building.

**Files**:
```
src/core/memory/conversation-logger.ts
src/core/memory/document-ingester.ts
src/core/memory/knowledge-base.ts
src/core/memory/context-builder.ts
tests/memory/conversation-logger.test.ts
tests/memory/knowledge-base.test.ts
```

**CLI**: `ae memory ingest <file>`, `ae memory list --type DOCUMENT`
**Commit**: `feat(memory): knowledge base + context builder`

---

## Phase 5: Communication & Approval

### Session 8: Message Bus + Triggers

**Mục tiêu**: Agent messaging + external event triggers.

**Files**:
```
src/core/messaging/message-bus.ts
src/core/messaging/message-router.ts
src/core/messaging/message-types.ts
src/core/triggers/trigger-registry.ts
src/core/triggers/webhook-handler.ts
src/core/triggers/schedule-trigger.ts
src/core/triggers/trigger-router.ts
tests/messaging/message-bus.test.ts
tests/triggers/trigger-router.test.ts
```

**CLI**: `ae trigger list`, `ae trigger add --type cron "0 9 * * *"`
**Commit**: `feat(messaging): message bus + external triggers`

### Session 9: Approval Engine (HITL)

**Mục tiêu**: Tasks nhạy cảm chờ owner duyệt.

**Files**:
```
src/core/approval/approval-engine.ts
src/core/approval/approval-policy.ts
src/core/approval/approval-queue.ts
tests/approval/approval-engine.test.ts
```

**CLI**: `ae approve list`, `ae approve accept <id>`, `ae approve reject <id>`
**Commit**: `feat(approval): HITL approval engine + policy rules`

---

## Phase 6: Interfaces (API + Telegram)

### Session 10: Dashboard API + Cost Management

**Mục tiêu**: All REST endpoints + cost tracking.

**Files**:
```
src/app/api/company/[id]/route.ts
src/app/api/departments/[id]/route.ts
src/app/api/agents/[id]/route.ts
src/app/api/agents/[id]/deploy/route.ts
src/app/api/agents/[id]/message/route.ts
src/app/api/tasks/route.ts
src/app/api/messages/route.ts
src/app/api/approvals/route.ts
src/app/api/health/route.ts
src/core/cost/cost-tracker.ts
src/core/cost/budget-manager.ts
src/lib/socket.ts
```

**CLI**: `ae cost report`, `ae cost budget set <agent> <limit>`
**Commit**: `feat(api): dashboard API + Socket.IO + cost management`

### Session 11: Telegram Bot

**Mục tiêu**: Owner tương tác qua Telegram.

**Files**:
```
src/core/channels/telegram-bot.ts
src/core/channels/telegram-commands.ts
src/core/channels/telegram-approval.ts
```

**Commands**: /status, /agents, /task, /approve, /report, /cost
**Commit**: `feat(telegram): bot + commands + approval keyboards`

---

## Phase 7: UI & Integration Testing

### Session 12: Dashboard UI

**Mục tiêu**: Web dashboard localhost, dark mode, responsive.

**Files**:
```
src/app/page.tsx, src/app/company/page.tsx, src/app/agents/page.tsx
src/app/tasks/page.tsx, src/app/messages/page.tsx
src/components/org-chart.tsx, src/components/agent-card.tsx
src/components/task-board.tsx, src/components/status-badge.tsx
src/app/globals.css
```

**Commit**: `feat(ui): dashboard with org chart + agent monitor + kanban`

### Session 13: Integration Test

**Mục tiêu**: Full flow E2E.

**Test**: Create company → agents → deploy → delegate → execute → approve → verify
**Commit**: `test(integration): full flow CEO delegate + approval`

---

## Phase 8: Intelligence & Learning

### Session 14: Feedback Loop

**Mục tiêu**: Agent tự học từ corrections (sử dụng Memory Phase 4).

**Files**:
```
src/core/feedback/feedback-loop.ts
src/core/feedback/correction-log.ts
src/core/feedback/prompt-injector.ts
tests/feedback/feedback-loop.test.ts
```

**Note**: FeedbackLoop tích hợp VectorStore (Phase 4) thay vì DB thường.
**Commit**: `feat(feedback): self-learning from corrections via vector memory`
