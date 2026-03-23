# Phase 18: Cost Tracking (S18)

> Token usage per agent + Budget management + Auto-pause khi vuot

---

## Muc tieu
CostTracker (dem tokens) + BudgetManager (limits + alerts + auto-pause).

## Tai sao quan trong?
- Ollama local = free tokens, NHUNG CEO agent always-on chay 24/7 van ton compute
- Neu dung cloud API (OpenAI, Claude) -> chi phi thuc su, PHAI control
- BudgetManager ngan agent chay vo toi (infinite loop, hallucination loops)
- Owner can biet chi phi per agent de optimize team structure

## Flow

`
Agent sendMessage()
    |
    v
CostTracker.trackUsage(agentId, tokenCount, model)
    |
    v
BudgetManager.checkBudget(agentId)
    |-- Usage < 80%  -> OK, continue
    |-- Usage 80-99% -> WARNING alert (Telegram + Socket.IO)
    +-- Usage >= 100% -> AUTO-PAUSE agent (status: PAUSED_BUDGET)
                         + Alert owner via Telegram
`

## Files tao moi

### 1. src/core/cost/cost-tracker.ts
class CostTracker:
  - constructor(db: PrismaClient, redis: Redis)
  - async trackUsage(agentId: string, tokenCount: number, model: string): void
    1. Update Task.tokenUsage in DB
    2. INCRBY cost:daily:{agentId}:{date} tokenCount in Redis (fast counter)
    3. Emit event 'cost:updated'
    4. Notify BudgetManager.onUsageUpdate()
  - async getReport(period: "day" | "week" | "month"): CostReport
    1. Aggregate from Redis (current day) + DB (historical)
    2. Calculate estimated cost: tokens * modelPricePerToken
    3. Return breakdown per agent
  - async getAgentUsage(agentId: string, period?: string): AgentUsage
  - async getTotalToday(): number
  - middleware(): wrap IAgentEngine
    Original: engine.sendMessage(id, msg)
    Wrapped: result = engine.sendMessage(id, msg)
             -> trackUsage(id, result.tokenUsed, agent.model)
             -> return result

interface CostReport:
  period: { from: Date, to: Date }
  perAgent: {
    agentId: string
    name: string
    role: string
    tokens: number
    estimatedCost: number  // USD (based on model pricing)
    budget: number | null
    percentUsed: number
  }[]
  totalTokens: number
  totalCost: number
  budgetAlerts: string[]   // agents over budget

### 2. src/core/cost/budget-manager.ts
class BudgetManager:
  - constructor(db: PrismaClient, orchestrator: AgentOrchestrator, redis: Redis)
  - async setBudget(agentId: string, maxTokensPerDay: number): void
    Save to DB + cache in Redis
  - async getBudget(agentId: string): { limit, used, percentUsed, status }
  - async onUsageUpdate(agentId: string, currentUsage: number): void
    1. Get budget limit
    2. If no limit set -> skip
    3. If usage > 80% -> emit 'cost:warning' + Telegram alert
    4. If usage > 100% -> orchestrator.pause(agentId)
       -> Update status: PAUSED_BUDGET
       -> Telegram: "Agent Marketing da vuot budget (12,000/10,000 tokens). Da tu dong pause."
    5. Log to AuditLog
  - async resetDaily(): void
    Cron: 00:00 -> DEL cost:daily:* in Redis
  - async unpause(agentId: string): void
    Owner manually unpause after reviewing budget

Model pricing table (configurable):
  qwen2.5:7b (Ollama local):    0.00 USD / 1M tokens
  llama3.1:8b (Ollama local):   0.00 USD / 1M tokens
  gpt-4o (OpenAI cloud):        5.00 USD / 1M input tokens
  claude-3.5 (Anthropic cloud): 3.00 USD / 1M input tokens

## CLI bo sung:
  ae cost report [--period day|week|month]
  ae cost agent <id> -> usage detail for specific agent
  ae cost budget set <agentId> <maxTokensPerDay>
  ae cost budget list -> all agents with budget status

## Kiem tra
1. Send 5 messages -> token count accumulated correctly
2. Set budget 100 tokens -> send 120 tokens -> agent auto-paused
3. ae cost report -> shows per-agent breakdown
4. Budget warning at 80% -> Telegram alert received
5. resetDaily -> counters reset to 0

## Edge Cases
- Agent paused by budget -> pending tasks queued, not lost
- Owner unpause -> agent resumes pending tasks
- Model pricing change -> update config, recalculate historical
- Multiple models per agent -> track per model
- Midnight timezone -> configurable reset time

## Dependencies: Phase 7 (Orchestrator for pause), Phase 8 (AuditLogger)
## Lien quan: PRD F11 CostTracker + BudgetManager
