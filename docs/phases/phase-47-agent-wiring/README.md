# Phase 47: Agent Deploy/Chat Wiring (S47)

> Wire agent CRUD routes → real engine.deploy() + pipeline.execute().

## Files sửa/tạo
1. `src/app/api/agents/route.ts` — POST: sau DB save → engine.deploy()
2. `src/app/api/agents/[id]/route.ts` — DELETE: engine.undeploy() + DB delete
3. `src/app/api/agents/[id]/chat/route.ts` — **NEW**: POST → pipeline.execute()
4. `tests/integration/agent-wiring.test.ts`

## Nguyên tắc
- DB save trước, engine deploy sau (rollback nếu deploy fail)
- Chat route: check agent in DB → pipeline.execute() → save conversation → return
