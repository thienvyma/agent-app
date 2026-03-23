# 📋 Product Requirements Document — Agentic Enterprise

## Tầm Nhìn

SaaS platform cho phép **1 người chủ (solopreneur)** xây dựng và vận hành toàn bộ công ty bằng AI agents. Hệ thống hoạt động 24/7, agents tự phối hợp làm việc, báo cáo và chờ duyệt tasksnhạy cảm qua Telegram.

## User Persona

- **Ai**: Solopreneur / chủ doanh nghiệp nhỏ
- **Nhu cầu**: Điều hành công ty mà không cần thuê nhân viên thật
- **Tương tác**: Qua Telegram (chính) + Web Dashboard (phụ)
- **Kỹ năng kỹ thuật**: Trung bình — không cần biết code

## Core Features (MVP — Phase 1)

### F1: Company Structure
- Tạo công ty với org chart (departments, roles, hierarchy)
- CEO → Departments → Individual Agents
- Mỗi agent có: name, role, SOP, model, tools, skills

### F2: Agent Lifecycle
- Create / Configure / Start / Stop / Restart agents
- Health monitoring + auto-restart
- Agent status real-time (IDLE, RUNNING, ERROR)

### F3: CEO Delegation
- CEO agent (always-on) nhận lệnh từ owner
- Tự phân tích + decompose thành sub-tasks
- Delegate cho agent phù hợp theo role

### F4: Approval Workflow (HITL)
- Tasks nhạy cảm → chờ owner duyệt qua Telegram
- Inline buttons: [Duyệt] [Sửa] [Từ chối]
- Policy-based: auto vs approval-required

### F5: Agent Communication
- Agent ↔ Agent messaging (delegate, chain, group)
- Agent → Owner reporting (daily summary, alerts)
- Owner → Agent commands (qua Telegram/Dashboard)

### F6: Dashboard
- Org chart visualization
- Agent status monitoring (real-time)
- Task board (Kanban)
- Message logs

### F7: Telegram Bot
- Commands: /status, /agents, /task, /approve
- Receive daily reports
- Approval buttons
- Send commands to specific agents

## Non-Goals (KHÔNG làm trong MVP)

- ❌ Multi-tenant (nhiều công ty/users) — sau Phase 3
- ❌ Workflow visual builder — sau Phase 2
- ❌ Analytics dashboard — sau Phase 2
- ❌ Zalo integration — sau Phase 2
- ❌ Mobile app
- ❌ Sửa đổi OpenClaw source code

## Tech Stack

| Component | Technology |
|---|---|
| Runtime | Node.js 22+ |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5+ (strict mode) |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ (Redis) |
| Agent Engine | OpenClaw (npm, via HTTP Adapter) |
| Realtime | Socket.IO |
| Telegram | grammY |
| Auth | NextAuth.js |
| Deploy | Docker Compose |

## OpenClaw Integration

- **Quan hệ**: External dependency — KHÔNG embed source code
- **Giao tiếp**: HTTP API via Gateway (port 18789)
- **Update**: `npm update -g openclaw` — độc lập với app
- **Ranh giới**: `IAgentEngine` interface — swap engine bất cứ lúc nào
