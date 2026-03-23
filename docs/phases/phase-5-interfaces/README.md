# Phase 5: Interfaces — API & Telegram (Sessions 8–9)

> **Status**: ⬜ Not Started
> **Sessions**: S8 (Dashboard API), S9 (Telegram Bot)
> **Phụ thuộc**: Phase 4 hoàn tất

---

## Mục Tiêu

REST API cho dashboard + Telegram bot cho owner tương tác.

## Session 8: Dashboard API Routes

**Mục tiêu**: Tất cả REST endpoints hoạt động

**Endpoints**:
```
# Company
GET/POST  /api/company
GET/PUT   /api/company/[id]

# Departments
GET/POST  /api/departments
GET/PUT/DELETE  /api/departments/[id]

# Agents
GET/POST  /api/agents
GET/PUT/DELETE  /api/agents/[id]
POST      /api/agents/[id]/deploy    — Deploy agent
POST      /api/agents/[id]/undeploy  — Undeploy
POST      /api/agents/[id]/message   — Send message

# Tasks
GET/POST  /api/tasks
GET/PUT   /api/tasks/[id]

# Messages
GET       /api/messages
GET       /api/messages/[agentId]

# Approvals
GET       /api/approvals             — List pending
POST      /api/approvals/[id]/approve
POST      /api/approvals/[id]/reject

# System
GET       /api/health                — System health
```

**Realtime**: Socket.IO cho agent status updates + new messages

## Session 9: Telegram Bot

**Mục tiêu**: Owner ra lệnh + nhận reports + approve tasks qua Telegram

**Commands**:
- `/status` — system overview (running agents, pending tasks)
- `/agents` — list agents + status emoji
- `/task <agent> <description>` — assign task to specific agent
- `/approve` — show pending approvals
- `/report` — force generate daily report

**Inline Keyboards**:
```
Approval request:
[✅ Duyệt] [✏️ Yêu cầu sửa] [❌ Từ chối]

Task confirmation:
[📋 Xem chi tiết] [🔄 Yêu cầu làm lại]
```

**Auto-notifications**:
- Task completed → push to owner
- Approval needed → push with buttons
- Error/escalation → push alert
- Daily summary → cron report

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
