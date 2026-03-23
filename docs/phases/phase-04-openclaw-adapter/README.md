# Phase 4: OpenClaw Adapter (S4)

> Ket noi thuc te voi OpenClaw qua HTTP Gateway API (port 18789)

---

## Muc tieu
Implement OpenClawAdapter + HTTP client + AdapterFactory.

## Files tao moi

### 1. src/core/adapter/openclaw-adapter.ts
class OpenClawAdapter implements IAgentEngine:
  - constructor(client: OpenClawClient)
  - deploy(config): POST /api/agents body=config -> AgentStatus
  - undeploy(agentId): DELETE /api/agents/:id
  - sendMessage(agentId, message): POST /api/agents/:id/chat -> AgentResponse
  - getStatus(agentId): GET /api/agents/:id/status
  - listAgents(): GET /api/agents
  - healthCheck(): GET /api/health

Map OpenClaw response format -> IAgentEngine types (normalize)

### 2. src/core/adapter/openclaw-client.ts
class OpenClawClient:
  - constructor(baseUrl: string = process.env.OPENCLAW_API_URL)
  - get(path: string): Promise<any>
  - post(path: string, body: any): Promise<any>
  - delete(path: string): Promise<void>
  - Timeout: 30s
  - Retry: 3 times with exponential backoff
  - Error handling: network errors -> clear messages

### 3. src/core/adapter/adapter-factory.ts
class AdapterFactory:
  static create(engine: string): IAgentEngine
    "mock" -> new MockAdapter()
    "openclaw" -> new OpenClawAdapter(new OpenClawClient())
    default -> throw Error("Unknown engine")
  Engine set via: AGENT_ENGINE env variable

### 4. tests/adapter/openclaw-adapter.test.ts
- Unit: mock HTTP client -> verify correct API calls
- Integration: real OpenClaw running -> deploy + chat + undeploy

## OpenClaw Memory Tier 1:
OpenClaw tu dong quan ly:
- MEMORY.md per agent (long-term)
- Daily logs
- Mem0 plugin (conversation memory)
-> KHONG can build, chi can cau hinh khi deploy agent

## Kiem tra
1. ae engine test -> ping OpenClaw Gateway -> response OK
2. Deploy agent -> getStatus -> RUNNING
3. sendMessage -> nhan AgentResponse voi content
4. undeploy -> getStatus -> not found

## Dependencies: Phase 3 (IAgentEngine interface), OpenClaw running
## Lien quan: D1 KHONG sua OpenClaw, docs/openclaw-integration.md
