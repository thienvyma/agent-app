# Phase 5: Communication & Approval (Sessions 8–9)

> **Status**: ⬜ Not Started
> **Sessions**: S8 (Message Bus + Triggers), S9 (Approval Engine)
> **Phụ thuộc**: Phase 4 (Memory) hoàn tất

---

## Mục Tiêu

Agent-to-agent messaging + external triggers + HITL approval workflow.

## Session 8: Message Bus + External Triggers

**Mục tiêu**: Agent messaging + external event triggers

**Files**:
```
src/core/messaging/message-bus.ts       — BullMQ-based pub/sub
src/core/messaging/message-router.ts    — Intelligent routing (parse intent → đúng agent)
src/core/messaging/message-types.ts     — Type definitions
src/core/triggers/trigger-registry.ts   — Register trigger sources
src/core/triggers/webhook-handler.ts    — Nhận external webhooks
src/core/triggers/schedule-trigger.ts   — Cron-based triggers
src/core/triggers/trigger-router.ts     — Trigger → đúng agent
tests/messaging/message-bus.test.ts
tests/triggers/trigger-router.test.ts
```

**Message Types**: REPORT, REQUEST, ESCALATION, CHAT, TASK_RESULT, APPROVAL_REQUEST

**Intelligent Routing** (Gap 2 fix):
```
Owner message: "Lên kế hoạch marketing tháng 4"
  → MessageRouter.analyze(message)
  → Intent: marketing_planning
  → Route to: CEO (nếu task phức tạp) hoặc Marketing Agent (nếu task đơn giản)
  → Nếu không rõ → hỏi lại owner: "Sếp muốn giao cho ai?"
```

**External Triggers** (Gap 5 fix):
```
Email khách hàng đến   → EmailTrigger → route to Support Agent
Facebook Ads webhook    → WebhookHandler → route to Analyst Agent
Form website submit     → WebhookHandler → route to Sales Agent
Scheduled (cron)        → ScheduleTrigger → route to assigned agent
```

## Session 9: Approval Engine (HITL)

**Mục tiêu**: Tasks nhạy cảm chờ owner duyệt

**Files**:
```
src/core/approval/approval-engine.ts    — Policy eval + queue
src/core/approval/approval-policy.ts    — Policy rules
src/core/approval/approval-queue.ts     — Pending store
tests/approval/approval-engine.test.ts
```

**Policy rules**:
- Budget > threshold → ⚠️ approval
- Type = "send_to_customer" → ⚠️ approval
- Type = "spend_money" → ⚠️ approval
- Type = "internal_analysis" → ✅ auto
- Type = "content_draft" → ✅ auto

**Flow**:
```
Agent finish task → ApprovalEngine.evaluate(task)
  → auto? → execute + log
  → approval? → ApprovalQueue.add → notify owner (Telegram)
  → owner approve → execute + log
  → owner reject → FeedbackLoop.logCorrection()
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
