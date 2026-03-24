# 📋 SESSIONS.md — 26 Phases / 27 Sessions

> Mỗi session giới hạn **2-4 files** — tối đa an toàn cho vibe coding.
> CLI-Anything dựng nền từ Phase 2, mỗi phase sau bổ sung commands.

---

## Giai Đoạn A: Nền Tảng (P1-2, S0-S2)

### Phase 1: Foundation & Scaffold (S0-S1)

**Session 0** ✅ — Foundation documents, rules v6, 14 superpowers skills (18 commits).

**Session 1** — Next.js 15 + Docker Compose (PostgreSQL 16+pgvector, Redis 7) + Prisma init + NextAuth.js setup + folder structure.
- Files: package.json, docker-compose.yml, tsconfig.json, src/lib/auth.ts
- Test: `npm run dev` OK, `docker compose up` OK, NextAuth login page renders
- Commit: `chore(scaffold): Next.js 15 + Prisma + Docker + NextAuth + folders`

### Phase 2: CLI Environment (S2)

**Session 2** ✅ — Commander.js `ae` CLI (D14: CLI-Anything evaluated → rejected). Cấu trúc: `ae <group> <command>`. Output JSON. Tạo `ae status` + `ae --help`.
- Files: src/cli/index.ts, src/cli/commands/status.ts, src/cli/utils/output.ts
- Test: `ae status` trả JSON (7/7 pass), `ae --help` liệt kê 8 groups
- CLI: `ae status`, `ae status --format table`, `ae --help`
- Commit: `feat(cli): ae CLI framework + ae status`

---

## Giai Đoạn B: Engine (P3-4, S3-S4)

### Phase 3: Engine Interface (S3)

**Session 3** — IAgentEngine interface + TypeScript types (AgentConfig, AgentStatus, AgentResponse) + MockAdapter + tests.
- Files: src/types/agent.ts, src/core/adapter/i-agent-engine.ts, src/core/adapter/mock-adapter.ts, tests/adapter/mock-adapter.test.ts
- Test: all mock tests pass
- CLI: `ae engine status` (placeholder)
- Commit: `feat(adapter): IAgentEngine + types + mock + tests`

### Phase 4: OpenClaw Adapter (S4)

**Session 4** — OpenClawAdapter implements IAgentEngine via HTTP + openclaw-client.ts + AdapterFactory + integration test.
- Files: src/core/adapter/openclaw-adapter.ts, src/core/adapter/openclaw-client.ts, src/core/adapter/adapter-factory.ts, tests/adapter/openclaw-adapter.test.ts
- Test: send message to real OpenClaw Gateway
- CLI: `ae engine test` (ping Gateway)
- Commit: `feat(adapter): OpenClaw HTTP adapter + factory`

---

## Giai Đoạn C: Nhân Sự (P5-9, S5-S9)

### Phase 5: Database Schema (S5)

**Session 5** — Prisma schema: Company, Department, Agent, Task, Message, CorrectionLog, AuditLog, ToolPermission, ApprovalRequest (9 tables). Migration + seed script.
- Files: prisma/schema.prisma, prisma/seed.ts, src/lib/prisma.ts
- Tables: Company (name, config) → Department (name, parentId) → Agent (name, role, sop, model, tools, skills, status) → Task (description, status, assignedTo, parentTask) → Message (from, to, content, type) → CorrectionLog (context, wrongOutput, correction, rule) → AuditLog (agentId, action, details) → ToolPermission (agentId, toolName, granted) → ApprovalRequest (taskId, status, policy)
- Test: `npx prisma migrate dev` + `npx prisma db seed` OK
- Commit: `feat(db): 9-table Prisma schema + migration + seed`

### Phase 6: Company Manager (S6)

**Session 6** — CompanyManager CRUD + HierarchyEngine + AgentConfigBuilder (tạo agent với role, SOP, model, tools, skills) + tests.
- Files: src/core/company/company-manager.ts, src/core/company/hierarchy-engine.ts, src/core/company/agent-config-builder.ts, tests/company/company-manager.test.ts
- Test: create company → department → agent (with SOP, model, tools), query hierarchy
- CLI: `ae company create`, `ae company info`, `ae agent create --role "CEO" --sop "..." --model qwen`, `ae agent list`
- Commit: `feat(company): CompanyManager + hierarchy + agent config builder`

### Phase 7: Agent Lifecycle (S7)

**Session 7** — AgentOrchestrator (deploy/undeploy/redeploy) + HealthMonitor (periodic check + auto-restart) + **CEO Agent Config** (always-on, cron poll 5 phút, delegation logic) + tests.
- Files: src/core/orchestrator/agent-orchestrator.ts, src/core/orchestrator/health-monitor.ts, src/core/orchestrator/ceo-agent-config.ts, tests/orchestrator/agent-orchestrator.test.ts
- CEO Config: always-on mode, cron check email/Telegram/tasks mỗi 5 phút, auto-delegate theo role hierarchy
- Test: deploy CEO agent, health check detects failure + auto-restart, CEO cron fires
- CLI: `ae agent deploy <id>`, `ae agent undeploy <id>`, `ae agent status <id>`
- Commit: `feat(orchestrator): lifecycle + health + CEO always-on config`

### Phase 8: Tools & Security (S8)

**Session 8** — ToolRegistry (register custom tools) + ToolPermission (per-agent ACL) + AuditLogger (log all actions) + tests.
- Files: src/core/tools/tool-registry.ts, src/core/tools/tool-permission.ts, src/core/tools/audit-logger.ts, tests/tools/tool-registry.test.ts
- Test: agent A uses tool X OK, agent B blocked
- CLI: `ae tool list`, `ae tool grant <agent> <tool>`
- Commit: `feat(tools): registry + permissions + audit`

### Phase 9: Task Engine (S9)

**Session 9** — TaskDecomposer (split complex tasks → sub-tasks) + ErrorRecovery (retry + escalation + partial save) + tests.
- Files: src/core/tasks/task-decomposer.ts, src/core/tasks/error-recovery.ts, tests/tasks/task-decomposer.test.ts
- Test: complex task → sub-tasks + retry on failure
- CLI: `ae task assign <agent> "desc"`, `ae task list`, `ae task status <id>`
- Commit: `feat(tasks): decomposer + error recovery`

---

## Giai Đoạn D: Trí Nhớ (P10-12, S10-S12)

### Phase 10: Vector Memory (S10)

**Session 10** — pgvector extension setup + VectorStore CRUD + EmbeddingService (Ollama local) + **RedisSTM** (session short-term memory, real-time state cache) + memory types + tests.
- Files: src/core/memory/vector-store.ts, src/core/memory/embedding-service.ts, src/core/memory/redis-stm.ts, src/types/memory.ts, tests/memory/vector-store.test.ts
- RedisSTM: agent session state, conversation cache, task progress cache (volatile, auto-expire)
- Test: embed text → store → semantic search + Redis set/get/expire
- CLI: `ae memory status`
- Commit: `feat(memory): pgvector + embedding + Redis STM`

### Phase 11: Conversation Memory (S11)

**Session 11** — ConversationLogger (auto-log conversations + embed) + DocumentIngester (upload → chunk → embed) + tests.
- Files: src/core/memory/conversation-logger.ts, src/core/memory/document-ingester.ts, tests/memory/conversation-logger.test.ts
- Test: log conversation → embed → searchable
- CLI: `ae memory ingest <file>`
- Commit: `feat(memory): conversation logger + document ingester`

### Phase 12: Knowledge Engine (S12)

**Session 12** — **LightRAG integration (D15)**: LightRAGClient (HTTP bridge to Python LightRAG service) + ContextBuilder (build context per task using LightRAG graph search + VectorStore fallback) + Docker setup + tests.
- Files: src/core/memory/lightrag-client.ts, src/core/memory/context-builder.ts, docker/lightrag/Dockerfile, tests/memory/knowledge-engine.test.ts
- Docker: LightRAG Python service (port 9621, PostgreSQL backend, Ollama 192.168.1.35:8080)
- Test: insert document → query → graph-enhanced results; ContextBuilder builds context with LightRAG
- CLI: `ae memory search "query" --mode hybrid`, `ae memory graph-status`
- Commit: `feat(memory): LightRAG client + context builder`

---

## Giai Đoạn E: Giao Tiếp (P13-15, S13-S15)

### Phase 13: Agent Messaging (S13)

**Session 13** — MessageBus (BullMQ pub/sub) + MessageRouter (intent → correct agent) + message types + tests.
- Files: src/core/messaging/message-bus.ts, src/core/messaging/message-router.ts, src/types/message.ts, tests/messaging/message-bus.test.ts
- Test: agent A sends message to agent B via bus
- CLI: `ae message send <from> <to> "content"`
- Commit: `feat(messaging): inter-agent message bus`

### Phase 14: External Triggers (S14)

**Session 14** — TriggerRegistry + WebhookHandler + ScheduleTrigger + TriggerRouter + tests.
- Files: src/core/triggers/trigger-registry.ts, src/core/triggers/webhook-handler.ts, src/core/triggers/schedule-trigger.ts, tests/triggers/trigger-registry.test.ts
- Test: webhook arrives → correct agent activated
- CLI: `ae trigger list`, `ae trigger add --type cron "0 9 * * *"`
- Commit: `feat(triggers): external trigger system`

### Phase 15: Approval Workflow (S15)

**Session 15** — ApprovalEngine + ApprovalPolicy (rules: which actions need approval) + ApprovalQueue + tests.
- Files: src/core/approval/approval-engine.ts, src/core/approval/approval-policy.ts, src/core/approval/approval-queue.ts, tests/approval/approval-engine.test.ts
- Test: sensitive task → held, internal task → auto-execute
- CLI: `ae approve list`, `ae approve accept <id>`, `ae approve reject <id>`
- Commit: `feat(approval): HITL approval engine`

---

## Giai Đoạn F: Kết Nối (P16-20, S16-S20)

### Phase 16: Core API Routes (S16)

**Session 16** — API routes cho Company CRUD + Agent CRUD + Agent deploy/undeploy + Health check + **Auth middleware** (NextAuth session check).
- Files: src/app/api/company/route.ts, src/app/api/agents/route.ts, src/app/api/health/route.ts, src/lib/api-auth.ts
- Auth: NextAuth session → chỉ owner mới access API
- Test: curl → create company + agent OK, unauthenticated → 401
- Commit: `feat(api): company + agent API routes + auth middleware`

### Phase 17: Extended API Routes (S17)

**Session 17** — API routes cho Tasks + Messages + Approvals + Audit search.
- Files: src/app/api/tasks/route.ts, src/app/api/messages/route.ts, src/app/api/approvals/route.ts, src/app/api/audit/route.ts
- Test: curl → create task + send message + approve OK
- Commit: `feat(api): task + message + approval API routes`

### Phase 18: Cost Tracking (S18)

**Session 18** — CostTracker (token usage per agent) + BudgetManager (limits + auto-pause + alerts) + tests.
- Files: src/core/cost/cost-tracker.ts, src/core/cost/budget-manager.ts, tests/cost/cost-tracker.test.ts
- Test: track usage → exceed budget → auto-pause
- CLI: `ae cost report`, `ae cost budget set <agent> <limit>`
- Commit: `feat(cost): cost tracker + budget manager`

### Phase 19: Realtime Events (S19)

**Session 19** — Socket.IO server setup + event types (agent state, task progress, messages) + client helper + tests.
- Files: src/lib/socket-server.ts, src/lib/socket-events.ts, src/types/realtime.ts, tests/realtime/socket.test.ts
- Test: dashboard receives realtime event when agent changes state
- Commit: `feat(realtime): Socket.IO event system`

### Phase 20: Telegram Bot (S20)

**Session 20** — grammY bot + 6 commands (/status, /agents, /task, /approve, /report, /cost) + inline keyboards + auto-notifications.
- Files: src/core/channels/telegram-bot.ts, src/core/channels/telegram-commands.ts, src/core/channels/telegram-keyboards.ts, tests/channels/telegram.test.ts
- Test: owner sends /task via Telegram → agent executes → result returns
- Commit: `feat(telegram): bot + commands + keyboards`

---

## Giai Đoạn G: Dashboard (P21-24, S21-S24)

### Phase 21: Design System (S21)

**Session 21** — Dark mode CSS variables + color palette + typography (Google Fonts) + base layout (sidebar + header) + theme provider.
- Files: src/app/globals.css, src/components/layout/sidebar.tsx, src/components/layout/header.tsx, src/components/theme-provider.tsx
- Test: layout renders correctly in dark mode
- Commit: `feat(ui): design system + dark mode + layout`

### Phase 22: UI Components (S22)

**Session 22** — Shared components: StatusBadge, AgentCard, OrgChart, TaskBoard. All use design system tokens.
- Files: src/components/status-badge.tsx, src/components/agent-card.tsx, src/components/org-chart.tsx, src/components/task-board.tsx
- Test: all components render with sample data
- Commit: `feat(ui): shared components`

### Phase 23: Core Pages (S23)

**Session 23** — Dashboard pages: Home (overview stats + **cost summary**), Company management, Agents grid, **Cost/Budget page**. Connect to API.
- Files: src/app/page.tsx, src/app/company/page.tsx, src/app/agents/page.tsx, src/app/cost/page.tsx
- Home: agent count, active tasks, total cost today, budget alerts
- Cost page: per-agent token usage chart, budget limits, alert history
- Test: pages load with real API data, cost page shows budget
- Commit: `feat(ui): home + company + agents + cost pages`

### Phase 24: Data Pages & Realtime (S24)

**Session 24** — Pages: Tasks kanban, Messages/audit log. Connect Socket.IO for realtime updates.
- Files: src/app/tasks/page.tsx, src/app/messages/page.tsx, src/app/audit/page.tsx, src/lib/use-socket.ts
- Test: dashboard shows live data, updates realtime
- Commit: `feat(ui): tasks + messages pages + realtime`

---

## Giai Đoạn H: Hoàn Thiện (P25-26, S25-S26)

### Phase 25: End-to-End Testing (S25)

**Session 25** — Full E2E test: create company → agents → deploy → owner command via Telegram → CEO delegate → agent execute → approval → approve → dashboard shows correct.
- Files: tests/e2e/full-flow.test.ts, tests/e2e/helpers.ts
- Test: entire flow runs end-to-end without errors
- Commit: `test(e2e): full flow integration test`

### Phase 26: Self-Learning (S26)

**Session 26** — FeedbackLoop (process corrections → extract rules) + CorrectionLog (save to VectorStore) + PromptInjector (inject rules before tasks) + tests.
- Files: src/core/feedback/feedback-loop.ts, src/core/feedback/correction-log.ts, src/core/feedback/prompt-injector.ts, tests/feedback/feedback-loop.test.ts
- Test: owner reject → rule created → next time agent applies rule
- Commit: `feat(feedback): self-learning from corrections`
