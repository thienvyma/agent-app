# 📋 SESSIONS.md — 19 Phases / 20 Sessions

> Mỗi session giới hạn **3-6 files** — an toàn cho vibe coding.
> Trước khi bắt đầu session N, đọc mục Session N trong file này.
> CLI commands xây song song mỗi session.

---

## Giai Đoạn A: Nền Tảng

### Phase 1: Foundation & Scaffold (S0-S1)

**Session 0** ✅ — Foundation documents (20 files, 8 commits).

**Session 1** — Khởi tạo Next.js 15 + Docker Compose (PostgreSQL 16+pgvector, Redis 7) + Prisma init + folder structure + CLI-Anything setup.
- Test: `npm run dev` OK, `docker compose up` OK
- Commit: `chore(scaffold): Next.js 15 + Prisma + Docker + folders`

---

## Giai Đoạn B: Engine

### Phase 2: Engine Interface (S2)

**Session 2** — Define IAgentEngine interface + TypeScript types (AgentConfig, AgentStatus, AgentResponse) + MockAdapter + test suite.
- Test: all mock tests pass
- Commit: `feat(adapter): IAgentEngine interface + types + mock + tests`

### Phase 3: OpenClaw Adapter (S3)

**Session 3** — OpenClawAdapter implements IAgentEngine via HTTP + openclaw-client.ts + AdapterFactory (mock vs real) + integration test.
- Test: send message to real OpenClaw Gateway
- Commit: `feat(adapter): OpenClaw adapter via HTTP Gateway API`

---

## Giai Đoạn C: Nhân Sự

### Phase 4: Company Database (S4)

**Session 4** — Prisma schema (Company, Department, Agent, Task, Message, CorrectionLog, AuditLog, ToolPermission) + CompanyManager CRUD + HierarchyEngine + tests.
- Test: create company → department → agent, query hierarchy
- CLI: `ae company create`, `ae agent create`, `ae agent list`
- Commit: `feat(company): DB schema + CompanyManager CRUD`

### Phase 5: Agent Lifecycle (S5)

**Session 5** — AgentOrchestrator (deploy/undeploy/redeploy) + HealthMonitor (periodic check + auto-restart) + tests.
- Test: deploy agent via Adapter, health check detects failure
- CLI: `ae agent deploy <id>`, `ae agent undeploy <id>`, `ae agent status`
- Commit: `feat(orchestrator): agent lifecycle + health monitor`

### Phase 6: Tools & Security (S6)

**Session 6** — ToolRegistry (register custom tools) + ToolPermission (per-agent access control) + AuditLogger (log all actions) + tests.
- Test: agent A uses tool X OK, agent B blocked from tool X
- CLI: `ae tool list`, `ae audit search`
- Commit: `feat(tools): tool registry + permissions + audit logger`

### Phase 7: Task Engine (S7)

**Session 7** — TaskDecomposer (auto-split complex tasks) + ErrorRecovery (retry + escalation + partial save) + tests.
- Test: complex task → auto-split → assign to multiple agents + retry on failure
- CLI: `ae task assign`, `ae task list`
- Commit: `feat(tasks): task decomposer + error recovery`

---

## Giai Đoạn D: Trí Nhớ

### Phase 8: Vector Memory (S8)

**Session 8** — pgvector extension setup + VectorStore CRUD + EmbeddingService (Ollama local) + memory types + tests.
- Test: embed text → store → semantic search returns relevant result
- CLI: `ae memory status`, `ae memory search "query"`
- Commit: `feat(memory): pgvector + embedding service`

### Phase 9: Knowledge System (S9)

**Session 9** — ConversationLogger (auto-log + embed) + DocumentIngester (upload → chunk → embed) + KnowledgeBase (hybrid search) + ContextBuilder (build context per task) + tests.
- Test: ContextBuilder returns meaningful context for a task
- CLI: `ae memory ingest <file>`, `ae memory list`
- Commit: `feat(memory): knowledge base + context builder`

---

## Giai Đoạn E: Giao Tiếp

### Phase 10: Agent Messaging (S10)

**Session 10** — MessageBus (BullMQ pub/sub) + MessageRouter (intent → correct agent) + message types + tests.
- Test: agent A sends message to agent B via MessageBus
- Commit: `feat(messaging): inter-agent message bus`

### Phase 11: External Triggers (S11)

**Session 11** — TriggerRegistry + WebhookHandler + ScheduleTrigger + TriggerRouter (trigger → agent) + tests.
- Test: webhook arrives → correct agent activated
- CLI: `ae trigger list`, `ae trigger add --type cron`
- Commit: `feat(triggers): external trigger system`

### Phase 12: Approval Workflow (S12)

**Session 12** — ApprovalEngine + ApprovalPolicy (rules) + ApprovalQueue + tests.
- Test: sensitive task → held for approval, internal task → auto-execute
- CLI: `ae approve list`, `ae approve accept <id>`
- Commit: `feat(approval): HITL approval engine`

---

## Giai Đoạn F: Kết Nối

### Phase 13: REST API (S13)

**Session 13** — API routes: company CRUD, agent CRUD + deploy, tasks, messages, approvals, health check.
- Test: curl/Postman → create company + agent + send task OK
- Commit: `feat(api): complete dashboard REST API`

### Phase 14: Cost & Realtime (S14)

**Session 14** — CostTracker (token usage per agent) + BudgetManager (limits + auto-pause + alerts) + Socket.IO setup (realtime events).
- Test: dashboard receives realtime event when agent changes state
- CLI: `ae cost report`, `ae cost budget set`
- Commit: `feat(cost): cost tracking + budget + Socket.IO realtime`

### Phase 15: Telegram Bot (S15)

**Session 15** — grammY bot + command handlers (/status, /agents, /task, /approve, /report, /cost) + inline keyboards (approve/reject) + auto-notifications.
- Test: owner sends /task via Telegram → agent executes → result returns
- Commit: `feat(telegram): bot + commands + approval keyboards`

---

## Giai Đoạn G: Dashboard

### Phase 16: UI Components (S16)

**Session 16** — Design system (dark mode, colors, typography) + shared components (StatusBadge, AgentCard, OrgChart, TaskBoard) + layout (sidebar + header).
- Test: all components render beautifully in dark mode with sample data
- Commit: `feat(ui): design system + shared components`

### Phase 17: Dashboard Pages (S17)

**Session 17** — Pages: home (overview), company management, agents grid, tasks kanban, messages/audit. Connect all to API + Socket.IO realtime.
- Test: dashboard shows live data, updates realtime
- Commit: `feat(ui): dashboard pages + realtime integration`

---

## Giai Đoạn H: Hoàn Thiện

### Phase 18: End-to-End Testing (S18)

**Session 18** — Full E2E test: create company → agents → deploy → owner command via Telegram → CEO delegate → agent execute → approval → approve → dashboard shows correct. Fix all bugs found.
- Test: entire flow runs end-to-end without errors
- Commit: `test(integration): full flow E2E`

### Phase 19: Self-Learning (S19)

**Session 19** — FeedbackLoop (process corrections → extract rules) + CorrectionLog (save to VectorStore) + PromptInjector (inject rules before each task) + tests.
- Test: owner reject → rule created → next time agent applies rule automatically
- Commit: `feat(feedback): self-learning from corrections`
