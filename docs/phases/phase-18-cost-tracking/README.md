# Phase 18: Cost Tracking (S18)

> Token usage per agent + Budget management + Auto-pause

---

## Muc tieu
CostTracker (dem tokens) + BudgetManager (limits + alerts + auto-pause).

## Tai sao quan trong?
Ollama local = free tokens, NHUNG neu sau nay dung cloud API (OpenAI, Claude)
thi cost tracking la suc song. BudgetManager ngan agent "chay vo toi".

## Files tao moi

### 1. src/core/cost/cost-tracker.ts
class CostTracker:
  - constructor(db: PrismaClient)
  - async trackUsage(agentId: string, tokenCount: number, model: string): void
    1. Update Task.tokenUsage
    2. Aggregate daily total for agent
    3. Check budget -> notify BudgetManager if over
  - async getReport(period: "day" | "week" | "month"): CostReport
    Return: { perAgent: [{name, tokens, cost}], total, periodStart, periodEnd }
  - async getAgentUsage(agentId: string): AgentUsage
  - middleware hook: wrap IAgentEngine.sendMessage() to auto-track

interface CostReport:
  perAgent: { agentId, name, tokens, estimatedCost }[]
  totalTokens: number
  totalCost: number
  period: string

### 2. src/core/cost/budget-manager.ts
class BudgetManager:
  - constructor(db: PrismaClient, orchestrator: AgentOrchestrator)
  - async setBudget(agentId: string, maxTokensPerDay: number): void
  - async checkBudget(agentId: string): BudgetStatus
  - async onUsageUpdate(agentId: string, currentUsage: number): void
    1. If usage > 80% budget -> send warning alert
    2. If usage > 100% budget -> auto-pause agent (status: PAUSED_BUDGET)
    3. Log to AuditLog
  - async resetDaily(): void
    Cron job: midnight -> reset daily counters

## CLI: ae cost report [--period day|week|month], ae cost budget set <agentId> <limit>

## Kiem tra
1. Send messages -> token count accumulated
2. Usage > budget -> agent auto-paused
3. ae cost report -> shows per-agent breakdown

## Dependencies: Phase 7 (Orchestrator for auto-pause), Phase 8 (AuditLogger)
## Lien quan: PRD F11 CostTracker + BudgetManager
