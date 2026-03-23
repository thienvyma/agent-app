# Phase 4: Communication & Approval (Sessions 6–7)

> **Status**: ⬜ Not Started
> **Sessions**: S6 (Message Bus), S7 (Approval Engine)
> **Phụ thuộc**: Phase 3 hoàn tất

---

## Mục Tiêu

Agent-to-agent messaging + HITL approval workflow cho tasks nhạy cảm.

## Session 6: Message Bus

**Mục tiêu**: Agents gửi/nhận messages, owner nhận reports

**Files**:
```
src/core/messaging/message-bus.ts       — BullMQ-based pub/sub
src/core/messaging/message-router.ts    — Route by type
src/core/messaging/message-types.ts     — Definitions
tests/messaging/message-bus.test.ts
```

**Message Types**: REPORT, REQUEST, ESCALATION, CHAT, TASK_RESULT, APPROVAL_REQUEST

**Routing rules**:
- `agent→agent`: qua MessageBus queue
- `agent→owner`: qua Telegram/Dashboard push
- `owner→agent`: qua API → Orchestrator → Adapter

## Session 7: Approval Engine (HITL)

**Mục tiêu**: Tasks nhạy cảm chờ owner duyệt

**Files**:
```
src/core/approval/approval-engine.ts    — Policy eval + queue
src/core/approval/approval-policy.ts    — Policy rules
src/core/approval/approval-queue.ts     — Pending store
tests/approval/approval-engine.test.ts
```

**Policy rules (auto vs approval-required)**:
- Budget > threshold → ⚠️ approval
- Type = "send_to_customer" → ⚠️ approval
- Type = "spend_money" → ⚠️ approval
- Type = "internal_analysis" → ✅ auto
- Type = "content_draft" → ✅ auto (owner review later)

**Flow**:
```
Agent finish task → ApprovalEngine.evaluate(task)
  → auto? → execute immediately
  → approval-required? → ApprovalQueue.add(task) → notify owner (Telegram)
  → owner approve → execute
  → owner reject → FeedbackLoop.logCorrection()
```

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
