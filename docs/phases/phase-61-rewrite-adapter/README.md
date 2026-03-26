# Phase 61: Rewrite OpenClawAdapter

> **Session 61** | 2 files | TDD (Red → Green → Refactor)
> **Phụ thuộc**: Phase 60 (OpenClawClient rewritten)

---

## Bối Cảnh
`openclaw-adapter.ts` hiện tại (237 dòng):
- Gọi `client.post("/api/sessions")` — endpoint KHÔNG tồn tại
- Gọi `client.get("/api/sessions/:key")` — endpoint KHÔNG tồn tại
- Gọi `client.post("/api/sessions/:key/chat")` — endpoint KHÔNG tồn tại
- Gọi `client.get("/api/status")` — endpoint KHÔNG tồn tại
- Internal session map: `Map<string, string>` (agentId → sessionKey) — concept tốt, giữ

## Mục Tiêu
Rewrite dùng 2 channels:
- **CLI** (`execOpenClaw`) cho management: deploy, health
- **HTTP** (`OpenClawClient.chatCompletion`) cho chat
- **Fallback CLI** (`openclaw agent --message`) nếu HTTP 404

## Files (2)

### 1. [REWRITE] `tests/adapter/openclaw-adapter.test.ts`
> Hiện có 200 dòng mock fake REST. Rewrite hoàn toàn.

Mock: `execOpenClaw` từ `@/lib/openclaw-cli`, `OpenClawClient.chatCompletion/healthCheck`

Tests (14 cases):
- `healthCheck()` → delegate to client.healthCheck() → true/false
- `deploy(config)` → store in internal map → return RUNNING status
- `deploy(config)` → duplicate → throw "already deployed"
- `undeploy(id)` → remove from map
- `undeploy("unknown")` → throw "not found"
- `redeploy(id, partial)` → undeploy + deploy with merged config
- `redeploy("unknown")` → throw "not found"
- `sendMessage(id, msg)` → build system prompt from SOP → call chatCompletion
- `sendMessage(id, msg, ctx)` → include context in system prompt
- `sendMessage("unknown", msg)` → throw "not found"
- `getStatus(id)` → return from internal map
- `getStatus("unknown")` → throw "not found"
- `listAgents()` → return all deployed
- `listAgents()` → empty when none deployed

### 2. [REWRITE] `src/core/adapter/openclaw-adapter.ts`
```typescript
class OpenClawAdapter implements IAgentEngine {
  private agents: Map<string, { config: AgentConfig; deployedAt: Date }>
  constructor(private readonly client: OpenClawClient)
  // IAgentEngine methods...
}
```

Key logic:
- `sendMessage()`: build `messages[]` array: system (SOP + context) + user (message)
- `deploy()`: register config in map (CLI call optional, agent already exists in OpenClaw)
- `healthCheck()`: delegate to `client.healthCheck()`

> ⚠️ **Constructor**: `constructor(client: OpenClawClient)` — giữ nguyên signature hiện tại.

## Kiểm Tra
- [ ] `npx jest tests/adapter/openclaw-adapter.test.ts` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
