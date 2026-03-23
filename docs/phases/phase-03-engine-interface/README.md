# Phase 3: Engine Interface (S3)

> IAgentEngine - ranh gioi duy nhat giua wrapper va core engine
> Toan bo app CHI BIET interface, KHONG BIET OpenClaw

---

## Muc tieu
Dinh nghia IAgentEngine interface + TypeScript types + MockAdapter cho testing.

## Tai sao can interface?
- D1: KHONG embed OpenClaw source code
- Swap engine bat cu luc nao (OpenClaw -> LangChain -> custom)
- Test khong can chay OpenClaw (MockAdapter)
- NemoClaw (NVIDIA) cung dung pattern nay -> proven

## Files tao moi

### 1. src/types/agent.ts
interface AgentConfig:
  id: string
  name: string
  role: string
  sop: string         // Standard Operating Procedure
  model: string       // "qwen2.5:7b"
  tools: string[]     // ["facebook_api", "google_sheets"]
  skills: string[]    // ["content_writing"]
  isAlwaysOn: boolean
  cronSchedule?: string
  systemPrompt?: string  // injected by ContextBuilder (Phase 12)

interface AgentStatus:
  id: string
  name: string
  status: "IDLE" | "RUNNING" | "ERROR" | "DEPLOYING" | "PAUSED_BUDGET"
  lastActivity: Date
  tokenUsage: number
  errorLog?: string

interface AgentResponse:
  agentId: string
  message: string
  toolCalls?: ToolCall[]
  tokenUsed: number
  timestamp: Date

interface ToolCall:
  toolName: string
  input: Record<string, any>
  output: any
  success: boolean

### 2. src/core/adapter/i-agent-engine.ts
interface IAgentEngine:
  deploy(config: AgentConfig): Promise<AgentStatus>
  undeploy(agentId: string): Promise<void>
  redeploy(agentId: string, config?: Partial<AgentConfig>): Promise<AgentStatus>
  sendMessage(agentId: string, message: string, context?: string): Promise<AgentResponse>
  getStatus(agentId: string): Promise<AgentStatus>
  listAgents(): Promise<AgentStatus[]>
  healthCheck(): Promise<boolean>

### 3. src/core/adapter/mock-adapter.ts
class MockAdapter implements IAgentEngine:
  - agents: Map<string, AgentStatus>
  - deploy(): fake deploy, return RUNNING status after 100ms delay
  - sendMessage(): return predefined responses based on message content
  - healthCheck(): return true

### 4. tests/adapter/mock-adapter.test.ts
- deploy -> status = RUNNING
- undeploy -> status = IDLE
- sendMessage -> returns AgentResponse with tokenUsed
- listAgents -> returns all deployed
- healthCheck -> returns true
- deploy same agent twice -> error or redeploy?

## Kiem tra
1. All mock adapter tests pass
2. TypeScript types compile with strict mode
3. ae engine status -> returns mock data

## Dependencies: Phase 1 (TypeScript setup)
## Lien quan PRD: D1 IAgentEngine interface, F2 Agent Lifecycle
