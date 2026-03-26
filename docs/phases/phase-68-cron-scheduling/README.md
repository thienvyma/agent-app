# Phase 69: Agent Communication — Hybrid OpenClaw + BullMQ

> **Session**: S69
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🟠 High

---

## Cross-Check: Code ĐÃ dùng engine — cần ENHANCE thêm

### Existing code phân tích sâu

**MessageBus.chain() L121** — ĐÃ gọi engine:
```typescript
const response = await engine.sendMessage(step.agentId, instruction);
// → Phase 67 tự fix routing per-agent 
// → CẦN enhance: hybrid send qua openclaw message send
```

**MessageBus.publish() L54** — BullMQ only:
```typescript
await this.queue.add("message", { ... });
// → CẦN enhance: THÊM openclaw message send song song
```

**TaskDecomposer.decompose() L68** — ĐÃ gọi engine:
```typescript
const ceoResponse = await this.engine.sendMessage(ceoAgentId, prompt);
// → Phase 67 tự fix routing per-agent
// → CẦN enhance: CEO system prompt hướng dẫn dùng sessions_spawn
```

**MessageRouter.routeToOwner() L186** — console.log stub:
```typescript
console.log(`[MessageRouter] Owner notification from ${agentId}: ${content}`);
// → CẦN enhance: openclaw message send --channel telegram
```

## Enhancement Plan

### Module 1: MessageBus → Hybrid (OpenClaw + BullMQ)
| Method | Enhance |
|--------|---------|
| `publish()` | **THÊM** `openclaw message send --agent <target> --message <content>` TRƯỚC BullMQ |
| `broadcast()` | Loop `openclaw message send` per agent |
| `chain()` | ✅ Đã dùng engine — Phase 67 fix routing |
| `getHistory()` | **Merge**: Prisma + `openclaw sessions --agent <id>` history |

### Module 2: TaskDecomposer → CEO dùng sessions_spawn
| Method | Enhance |
|--------|---------|
| `decompose()` | **Enhance CEO system prompt**: hướng dẫn dùng `sessions_spawn` để tạo sub-agent |
| `assignTask()` | **Enhance prompt**: nếu có per-agent sessions, agent nhận task trong context đúng |
| `collectResults()` | **Merge**: DB results + OpenClaw sub-agent session results |

### Module 3: MessageRouter → Real owner notification
| Method | Enhance |
|--------|---------|
| `routeToOwner()` | `openclaw message send --channel telegram --message <content>` thay console.log |
| `routeDelegate()` | ✅ Giữ — dùng messageBus.publish() enhanced ở trên |

## Files Cần Sửa (≤5)

### 1. `tests/messaging/message-bus.test.ts` (MODIFY)
- Test: publish sends via openclaw message CLI
- Test: getHistory merges Prisma + OpenClaw
- Giữ all 11 existing tests

### 2. `tests/tasks/task-decomposer.test.ts` (MODIFY)
- Test: CEO system prompt includes sessions_spawn guidance

### 3. `src/lib/openclaw-cli.ts` (MODIFY)
- Add `messageSend(agentId, message)` → `openclaw message send --agent <id>`
- Add `messageSendChannel(channel, target, message)` → `openclaw message send --channel telegram`

### 4. `src/core/messaging/message-bus.ts` (MODIFY)
- `publish()` → try `openclaw message send` → then BullMQ (hybrid)
- `getHistory()` → merge Prisma + OpenClaw sessions

### 5. `src/core/messaging/message-router.ts` (MODIFY)
- `routeToOwner()` → `openclaw message send --channel telegram`

### 6. `src/core/tasks/task-decomposer.ts` (MODIFY)
- `decompose()` → enhance CEO prompt: include sessions_spawn guidance

## Verification
```
□ publish() sends via openclaw message CLI
□ routeToOwner() sends Telegram via OpenClaw
□ CEO prompt includes sessions_spawn guidance
□ All existing tests pass
□ New tests pass
```
