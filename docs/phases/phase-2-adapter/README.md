# Phase 2: Adapter Layer (Sessions 2–3)

> **Status**: ⬜ Not Started
> **Sessions**: S2 (Interface + Tests), S3 (OpenClaw Adapter)
> **Phụ thuộc**: Phase 1 hoàn tất

---

## Mục Tiêu

Xây dựng ranh giới giữa app và OpenClaw — `IAgentEngine` interface + adapter implementation.

## Tại Sao Phase Này Quan Trọng

- Đây là **lớp duy nhất** biết về OpenClaw
- Toàn bộ business logic phía trên chỉ nói qua interface
- Nếu OpenClaw thay đổi API → chỉ sửa file adapter, KHÔNG sửa logic
- Nếu muốn đổi engine → viết adapter mới, plug vào interface

## Session 2: IAgentEngine Interface + Tests

**Mục tiêu**: Define interface contract + mock adapter pass all tests

**Files tạo mới**:
```
src/types/agent.ts                    — AgentConfig, AgentStatus, AgentResponse
src/types/engine.ts                   — IAgentEngine interface
src/core/adapter/mock-adapter.ts      — MockAdapter (for testing)
tests/adapter/engine.test.ts          — Test suite
```

**Interface methods**:
```typescript
createAgent(config)           → agentId
startAgent(agentId)           → void
stopAgent(agentId)            → void
destroyAgent(agentId)         → void
sendMessage(agentId, msg)     → AgentResponse
sendMessageBetweenAgents(from, to, msg) → void
getAgentStatus(agentId)       → AgentStatus
listActiveAgents()            → AgentInfo[]
registerTool(agentId, tool)   → void
registerSkill(agentId, skill) → void
```

**Tests cần viết**:
- createAgent returns valid agentId
- startAgent changes status to RUNNING
- stopAgent changes status to STOPPED
- sendMessage returns content
- getAgentStatus returns correct state
- listActiveAgents returns only RUNNING
- Invalid config throws

## Session 3: OpenClaw Adapter

**Mục tiêu**: Adapter thật giao tiếp với OpenClaw Gateway qua HTTP

**Files tạo mới**:
```
src/core/adapter/openclaw-adapter.ts    — Implements IAgentEngine
src/core/adapter/openclaw-client.ts     — HTTP client cho Gateway API
src/core/adapter/adapter-factory.ts     — Factory: Mock vs OpenClaw
tests/adapter/openclaw.test.ts          — Integration tests
```

**OpenClaw endpoints cần wrap**:
```
POST   /api/sessions              → createAgent
DELETE /api/sessions/:key         → destroyAgent
POST   /api/sessions/:key/chat   → sendMessage
GET    /api/sessions/:key         → getAgentStatus
GET    /api/sessions              → listActiveAgents
```

> [!IMPORTANT]
> Cần verify API endpoints thực tế khi bắt đầu Session 3 — OpenClaw docs có thể thay đổi.

---

## Ghi Chú Thảo Luận

*(Bổ sung khi thảo luận thêm về phase này)*
