# Phase 13: Agent Messaging (S13)

## Tru cot 4: Giao viec tu dong - Internal Communication

## Muc tieu
MessageBus (BullMQ pub/sub) + MessageRouter (intent -> dung agent).
Agent tu noi chuyen voi nhau.

## Session 13
- Files: message-bus.ts, message-router.ts, types/message.ts, tests/
- MessageBus: BullMQ queues cho agent-to-agent messaging
- MessageRouter: parse intent -> route den dung agent theo role
  VD: "Can tinh chi phi" -> route den Finance Agent
- Message types: delegate, chain, group, report, alert
- CLI: ae message send from-id to-id content
- Test: agent A gui message cho agent B qua MessageBus

## Lien quan PRD: F6 Agent Communication (delegate, chain, group)
