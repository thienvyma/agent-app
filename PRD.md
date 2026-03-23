# 📋 Product Requirements Document — Agentic Enterprise

## Tầm Nhìn

**Local-first** SaaS platform cho phép **1 người chủ (solopreneur)** xây dựng và vận hành toàn bộ công ty bằng AI agents. Hệ thống hoạt động 24/7 trên PC cá nhân, chi phí $0 (ngoài API keys nếu cần), agents tự phối hợp làm việc, báo cáo và chờ duyệt tasks nhạy cảm qua Telegram.

## User Persona

- **Ai**: Solopreneur / chủ doanh nghiệp nhỏ
- **Nhu cầu**: Điều hành công ty mà không cần thuê nhân viên thật
- **Tương tác**: Qua Telegram (chính) + Web Dashboard localhost (phụ) + CLI (dev/admin)
- **Kỹ năng kỹ thuật**: Trung bình — không cần biết code
- **Hạ tầng**: PC cá nhân, Ollama local, OpenClaw local

## Core Features (MVP — Phase 1-8)

### F1: Company Structure
- Tạo công ty với org chart (departments, roles, hierarchy)
- CEO → Departments → Individual Agents
- Mỗi agent có: name, role, SOP, model, tools, skills, toolPermissions

### F2: Agent Lifecycle
- Create / Configure / Start / Stop / Restart agents
- Health monitoring + auto-restart + error recovery (retry + escalation)
- Agent status real-time (IDLE, RUNNING, ERROR)
- Tool permission system — agent nào dùng tool nào

### F3: CEO Delegation + Task Decomposition
- CEO agent (always-on) nhận lệnh từ owner
- TaskDecomposer tự phân tích + chia nhỏ thành sub-tasks
- Delegate cho agent phù hợp theo role

### F4: Approval Workflow (HITL)
- Tasks nhạy cảm → chờ owner duyệt qua Telegram
- Inline buttons: [Duyệt] [Sửa] [Từ chối]
- Policy-based: auto (internal tasks) vs approval-required (customer-facing, money)

### F5: Memory & Knowledge (3-Tier)
- **Tier 1 — OpenClaw native**: MEMORY.md + daily logs + Mem0 plugin (per-agent)
- **Tier 2 — pgvector**: Company KB, cross-agent search, document ingestion, corrections
- **Tier 3 — Redis**: Session STM, real-time state
- ConversationLogger, DocumentIngester, KnowledgeBase, ContextBuilder

### F6: Agent Communication
- Agent ↔ Agent messaging (delegate, chain, group)
- Agent → Owner reporting (daily summary, alerts)
- Owner → Agent commands (qua Telegram/Dashboard/CLI)
- External triggers (email, webhooks, cron)
- Intelligent message routing (parse intent → đúng agent)

### F7: Dashboard (localhost)
- Org chart visualization
- Agent status monitoring (real-time via Socket.IO)
- Task board (Kanban)
- Message logs + Audit trail
- Cost/budget tracking

### F8: Telegram Bot
- Commands: /status, /agents, /task, /approve, /report, /cost
- Receive daily reports
- Approval buttons
- Send commands to specific agents

### F9: CLI (song song với mọi phase)
- CLI-Anything để tạo CLI wrapper
- Custom `ae` commands cho mọi operation
- JSON output cho agent consumption
- Agent nội bộ tự gọi CLI để self-manage

### F10: Feedback Loop & Self-Learning
- CorrectionLog: owner reject → extract rule → embed vào VectorStore
- PromptInjector: inject relevant rules vào system prompt trước mỗi task
- Agent ngày càng giỏi hơn

### F11: Audit & Cost
- AuditLogger: log mọi agent action
- CostTracker: token usage per agent per day
- BudgetManager: limits + alerts + auto-pause

## Non-Goals (KHÔNG làm trong MVP)

- ❌ Multi-tenant SaaS (nhiều công ty/users) — sau Phase 9+
- ❌ Visual workflow builder — sau Phase 9+
- ❌ Zalo integration — sau Phase 9+
- ❌ Mobile app
- ❌ Sửa đổi OpenClaw source code
- ❌ Cloud deployment (MVP chạy local, nhưng kiến trúc sẵn sàng deploy)

## Tech Stack

| Component | Technology | Chi phí |
|---|---|---|
| Runtime | Node.js 22+ | $0 |
| Framework | Next.js 15 (App Router) | $0 |
| Language | TypeScript 5+ (strict mode) | $0 |
| Database | PostgreSQL + Prisma + **pgvector** | $0 (Docker) |
| Queue | BullMQ (Redis) | $0 (Docker) |
| Agent Engine | OpenClaw (npm, HTTP Gateway :18789) | $0 |
| AI Model | **Ollama local** (qwen, llama, etc.) | $0 |
| Embedding | **Ollama** (nomic-embed-text / bge-m3) | $0 |
| Memory | OpenClaw MEMORY.md + **Mem0 plugin** + pgvector | $0 |
| Realtime | Socket.IO | $0 |
| Telegram | grammY | $0 |
| CLI | **CLI-Anything** + custom `ae` commands | $0 |
| Auth | NextAuth.js | $0 |
| Deploy | Docker Compose (local) | $0 |

**Tổng chi phí**: **$0** (trừ API keys cho external services nếu cần)

## OpenClaw Integration

- **Quan hệ**: External dependency — KHÔNG embed source code
- **Giao tiếp**: HTTP API via Gateway (port 18789)
- **Update**: `npm update -g openclaw` — độc lập với app
- **Ranh giới**: `IAgentEngine` interface — swap engine bất cứ lúc nào
- **Memory**: Tận dụng OpenClaw MEMORY.md + Mem0 plugin cho per-agent memory
