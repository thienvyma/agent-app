# 📋 SESSIONS.md — Chi Tiết Từng Session

> File này mô tả CHÍNH XÁC mỗi session cần làm gì.
> Trước khi bắt đầu session N, đọc mục Session N trong file này.

---

## Session 1: Project Scaffold

**Mục tiêu**: Dự án chạy được `npm run dev`, hiện trang trắng Next.js.

### Bước thực hiện:
1. `npx -y create-next-app@latest ./` — Next.js 15, TypeScript, App Router, Tailwind NO, ESLint YES
2. Cài dependencies:
   ```bash
   npm i prisma @prisma/client bullmq ioredis socket.io socket.io-client grammy next-auth
   npm i -D vitest @types/node
   ```
3. Setup `docker-compose.yml`:
   ```yaml
   services:
     postgres:
       image: postgres:16
       ports: ["5432:5432"]
       environment:
         POSTGRES_DB: agentic_enterprise
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: postgres
     redis:
       image: redis:7-alpine
       ports: ["6379:6379"]
   ```
4. Setup Prisma: `npx prisma init`
5. Tạo `.env`:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/agentic_enterprise"
   REDIS_URL="redis://localhost:6379"
   OPENCLAW_GATEWAY_URL="http://localhost:18789"
   OLLAMA_URL="http://192.168.1.35:8080/v1"
   TELEGRAM_BOT_TOKEN="..."
   ```
6. Tạo folder structure (directories + placeholder files):
   ```
   src/core/adapter/         → index.ts (export placeholder)
   src/core/company/         → index.ts
   src/core/orchestrator/    → index.ts
   src/core/messaging/       → index.ts
   src/core/approval/        → index.ts
   src/core/feedback/        → index.ts
   src/core/channels/        → index.ts
   src/types/                → index.ts
   src/lib/                  → db.ts (Prisma client singleton)
   tests/                    → setup.ts
   ```

### Test: `npm run dev` → Next.js dev server starts, page loads
### Commit: `chore(scaffold): Next.js 15 + Prisma + Docker + folder structure`

---

## Session 2: IAgentEngine Interface + Tests

**Mục tiêu**: Interface contract hoàn chỉnh + mock adapter + all tests pass.

### Files tạo mới:
```
src/types/agent.ts          — AgentConfig, AgentStatus, AgentResponse, etc.
src/types/engine.ts         — IAgentEngine interface
src/core/adapter/mock-adapter.ts   — MockAdapter (for testing)
tests/adapter/engine.test.ts       — Test suite cho IAgentEngine
```

### Interface cần define:
```typescript
// IAgentEngine methods:
createAgent(config: AgentConfig): Promise<string>
startAgent(agentId: string): Promise<void>
stopAgent(agentId: string): Promise<void>
destroyAgent(agentId: string): Promise<void>
sendMessage(agentId: string, message: string): Promise<AgentResponse>
sendMessageBetweenAgents(from: string, to: string, msg: string): Promise<void>
getAgentStatus(agentId: string): Promise<AgentStatus>
listActiveAgents(): Promise<AgentInfo[]>
registerTool(agentId: string, tool: ToolDefinition): Promise<void>
registerSkill(agentId: string, skill: SkillDefinition): Promise<void>
```

### Types cần define:
```typescript
AgentConfig { name, role, department, systemPrompt, model, provider, providerUrl, tools, skills, reportsTo?, schedule? }
AgentStatus { agentId, state: IDLE|RUNNING|ERROR|STOPPED, lastActivity, sessionRef? }
AgentResponse { content, toolCalls?, metadata? }
AgentInfo { agentId, name, role, state }
ToolDefinition { name, description, parameters }
SkillDefinition { name, description, instructions }
ScheduleConfig { type: 'always-on'|'cron'|'trigger', cronExpression?, triggerEvents? }
```

### Tests cần viết (mock adapter):
- ✅ createAgent returns valid agentId
- ✅ startAgent changes status to RUNNING
- ✅ stopAgent changes status to STOPPED
- ✅ sendMessage returns AgentResponse with content
- ✅ sendMessageBetweenAgents doesn't throw
- ✅ getAgentStatus returns correct state
- ✅ listActiveAgents returns only RUNNING agents
- ✅ createAgent with invalid config throws error

### Commit: `feat(adapter): IAgentEngine interface + types + mock + tests`

---

## Session 3: OpenClaw Adapter Implementation

**Mục tiêu**: Adapter giao tiếp thật với OpenClaw Gateway qua HTTP.

### Files tạo mới:
```
src/core/adapter/openclaw-adapter.ts   — OpenClawAdapter implements IAgentEngine
src/core/adapter/adapter-factory.ts    — Factory: chọn Mock vs OpenClaw
src/core/adapter/openclaw-client.ts    — HTTP client wrapper cho Gateway API
tests/adapter/openclaw.test.ts         — Integration tests (cần OpenClaw chạy)
```

### OpenClaw Gateway endpoints cần wrap:
```
POST   /api/sessions          → createAgent (tạo session)
DELETE /api/sessions/:id      → destroyAgent
POST   /api/sessions/:id/chat → sendMessage
GET    /api/sessions/:id      → getAgentStatus
GET    /api/sessions          → listActiveAgents
POST   /api/tools/invoke      → registerTool
```

### Commit: `feat(adapter): OpenClaw adapter via HTTP Gateway API`

---

## Session 4: Company Module (DB + CRUD)

**Mục tiêu**: CRUD company/departments/agents trong PostgreSQL.

### Files tạo mới:
```
prisma/schema.prisma               — Full DB schema
src/core/company/company-manager.ts — CompanyManager class
src/core/company/hierarchy-engine.ts — Hierarchy queries
src/app/api/company/route.ts        — Company CRUD API
src/app/api/departments/route.ts    — Department CRUD API
src/app/api/agents/route.ts         — Agent CRUD API
tests/company/company-manager.test.ts
```

### DB Models:
- Company (id, name, goal)
- Department (id, name, parentId → self-reference, companyId)
- Agent (id, name, role, systemPrompt, model, provider, status, deptId, reportsTo, skills, tools, schedule, engineRef)
- Task (id, title, description, status, priority, agentId, result)
- Message (id, fromId, toId, content, type, createdAt)
- CorrectionLog (id, agentId, taskId, originalOutput, correction, ruleExtracted, createdAt)

### Commit: `feat(company): DB schema + CompanyManager CRUD + API routes`

---

## Session 5: Agent Orchestrator

**Mục tiêu**: Start/stop agents lifecycle qua Adapter.

### Files tạo mới:
```
src/core/orchestrator/agent-orchestrator.ts — Lifecycle management
src/core/orchestrator/health-monitor.ts     — Health checks + auto-restart
tests/orchestrator/orchestrator.test.ts
```

### AgentOrchestrator methods:
```typescript
deployAgent(agentId: string): Promise<void>     // DB config → Adapter.createAgent → start
undeployAgent(agentId: string): Promise<void>   // stop → destroy → update DB
redeployAgent(agentId: string): Promise<void>   // undeploy → deploy
getDeployedAgents(): Promise<DeployedAgent[]>   // list running
healthCheck(): Promise<HealthReport>            // check all agents
```

### Commit: `feat(orchestrator): agent lifecycle + health monitor`

---

## Session 6: Message Bus

**Mục tiêu**: Agents gửi/nhận messages, owner nhận reports.

### Files:
```
src/core/messaging/message-bus.ts       — BullMQ-based pub/sub
src/core/messaging/message-router.ts    — Route by type (agent→agent, agent→owner)
src/core/messaging/message-types.ts     — Message type definitions
tests/messaging/message-bus.test.ts
```

### Message Types: REPORT, REQUEST, ESCALATION, CHAT, TASK_RESULT, APPROVAL_REQUEST

### Commit: `feat(messaging): inter-agent message bus with BullMQ`

---

## Session 7: Approval Engine (HITL)

**Mục tiêu**: Tasks nhạy cảm chờ owner duyệt.

### Files:
```
src/core/approval/approval-engine.ts    — Policy evaluation + queue
src/core/approval/approval-policy.ts    — Rules: what needs approval
src/core/approval/approval-queue.ts     — Pending approvals store
tests/approval/approval-engine.test.ts
```

### Policy Rules:
- Budget > threshold → approval required
- Type = "send_to_customer" → approval required
- Type = "spend_money" → approval required
- All else → auto-approve

### Commit: `feat(approval): HITL approval engine with policy rules`

---

## Session 8: Dashboard API Routes

**Mục tiêu**: All REST API endpoints working with proper responses.

### Files:
```
src/app/api/company/[id]/route.ts       — Single company ops
src/app/api/departments/[id]/route.ts
src/app/api/agents/[id]/route.ts
src/app/api/agents/[id]/deploy/route.ts — Deploy/undeploy agent
src/app/api/agents/[id]/message/route.ts — Send message to agent
src/app/api/tasks/route.ts
src/app/api/messages/route.ts
src/app/api/approvals/route.ts          — List/approve/reject
src/app/api/health/route.ts             — System health
src/lib/socket.ts                       — Socket.IO setup
```

### Commit: `feat(api): complete dashboard API + Socket.IO realtime`

---

## Session 9: Telegram Bot

**Mục tiêu**: Owner tương tác qua Telegram.

### Files:
```
src/core/channels/telegram-bot.ts       — grammY bot setup
src/core/channels/telegram-commands.ts  — Command handlers
src/core/channels/telegram-approval.ts  — Inline keyboard for approvals
```

### Commands:
- `/status` — system overview
- `/agents` — list agents + status
- `/task <agent> <description>` — assign task
- `/approve` — list pending approvals
- `/report` — force daily report
- Inline buttons: [✅ Duyệt] [✏️ Sửa] [❌ Từ chối]

### Commit: `feat(telegram): bot with commands + approval inline keyboards`

---

## Session 10: Dashboard UI

**Mục tiêu**: Web dashboard renders all data, dark mode, responsive.

### Files:
```
src/app/page.tsx                    — Dashboard home
src/app/company/page.tsx            — Company management
src/app/agents/page.tsx             — Agents grid + status
src/app/tasks/page.tsx              — Task board (kanban)
src/app/messages/page.tsx           — Message logs
src/components/org-chart.tsx        — Visual org chart
src/components/agent-card.tsx       — Agent status card
src/components/task-board.tsx       — Kanban columns
src/components/status-badge.tsx     — Status indicators
src/app/globals.css                 — Design system
```

### Commit: `feat(ui): dashboard with org chart + agent monitor + kanban`

---

## Session 11: Integration Test

**Mục tiêu**: Full flow end-to-end.

### Test scenario:
```
1. Tạo company "Nội Thất Nhanh"
2. Tạo department "Marketing"
3. Tạo CEO agent + Marketing agent
4. Deploy cả 2 agents
5. Owner gửi lệnh: "Lên kế hoạch marketing tháng 4"
6. CEO nhận → tạo task → delegate cho Marketing
7. Marketing thực hiện → gửi kết quả
8. Kết quả cần approval → ApprovalEngine queue
9. Telegram Bot gửi approval request
10. Owner approve
11. Task completed → Dashboard hiện correct status
```

### Commit: `test(integration): full flow CEO delegate + approval`

---

## Session 12: Feedback Loop

**Mục tiêu**: Agent tự học từ owner corrections.

### Files:
```
src/core/feedback/feedback-loop.ts      — Process corrections → extract rules
src/core/feedback/correction-log.ts     — CorrectionLog CRUD
src/core/feedback/prompt-injector.ts    — Inject rules vào system prompt
tests/feedback/feedback-loop.test.ts
```

### Flow:
```
Owner reject → FeedbackLoop.logCorrection(context, output, correction)
→ CorrectionLog.save(rule)
→ Trước task tiếp: PromptInjector.inject(agentId) → thêm rules vào prompt
```

### Commit: `feat(feedback): self-learning from owner corrections`
