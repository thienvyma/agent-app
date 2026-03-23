# 🏗️ ARCHITECTURE.md — Sơ Đồ Tham Chiếu

> AI đọc file này → hiểu ngay cấu trúc toàn bộ dự án.

---

## Kiến Trúc 5 Tầng

```
┌─────────────────────────────────────────────────────────┐
│ TẦNG 5: UI Layer                                        │
│   ├── Next.js Dashboard (org chart, agent monitor, logs)│
│   └── Telegram Bot (commands, reports, approvals)       │
├─────────────────────────────────────────────────────────┤
│ TẦNG 4: Company Module                                  │
│   ├── CompanyManager (departments, roles, hierarchy)    │
│   ├── AgentLifecycle (create, configure, deploy)        │
│   ├── MessageBus (agent↔agent, agent↔owner)             │
│   ├── TaskEngine (assign, track, decompose, escalate)   │
│   ├── ApprovalEngine (HITL, owner approve/reject)       │
│   └── TriggerRegistry (external webhooks, email, cron)  │
├─────────────────────────────────────────────────────────┤
│ TẦNG 3: Orchestration Core                              │
│   ├── AgentOrchestrator (scheduling, health, restart)   │
│   ├── ToolRegistry + ToolPermission (per-agent access)  │
│   ├── PolicyEngine (SOP, permissions, budget)           │
│   ├── CostTracker + BudgetManager (token/cost control)  │
│   ├── AuditLogger (action log, decision log)            │
│   ├── ErrorRecovery (retry, escalation, partial save)   │
│   ├── FeedbackLoop (corrections → self-learning)        │
│   └── TaskDecomposer (CEO auto-split complex tasks)     │
├─────────────────────────────────────────────────────────┤
│ TẦNG 2: Memory & Knowledge Layer ⭐ NEW                 │
│   ├── VectorStore (pgvector — semantic search)          │
│   ├── EmbeddingService (text → vector via Ollama)       │
│   ├── ConversationLogger (auto-log + embed interactions)│
│   ├── DocumentIngester (upload → chunk → embed → store) │
│   ├── KnowledgeBase (unified search across all memory)  │
│   └── ContextBuilder (build relevant context per task)  │
├─────────────────────────────────────────────────────────┤
│ TẦNG 1: Adapter Layer (RANH GIỚI VỚI OPENCLAW)         │
│   ├── IAgentEngine (interface contract — swap-able)     │
│   ├── OpenClawAdapter (HTTP → Gateway :18789)           │
│   └── OpenClaw (npm package — KHÔNG SỬA SOURCE)        │
└─────────────────────────────────────────────────────────┘
```

## IAgentEngine Interface (Ranh Giới)

```typescript
interface IAgentEngine {
  createAgent(config: AgentConfig): Promise<string>
  startAgent(agentId: string): Promise<void>
  stopAgent(agentId: string): Promise<void>
  destroyAgent(agentId: string): Promise<void>
  sendMessage(agentId: string, message: string): Promise<AgentResponse>
  sendMessageBetweenAgents(fromId: string, toId: string, msg: string): Promise<void>
  getAgentStatus(agentId: string): Promise<AgentStatus>
  listActiveAgents(): Promise<AgentInfo[]>
  registerTool(agentId: string, tool: ToolDefinition): Promise<void>
  registerSkill(agentId: string, skill: SkillDefinition): Promise<void>
}
```

## Memory Flow (NEW)

```
Any Interaction (agent↔agent, owner↔agent)
  → ConversationLogger.log()
  → EmbeddingService.embed(text)
  → VectorStore.store(embedding, metadata)

Owner uploads document
  → DocumentIngester.ingest()
  → Chunk (500 tokens, 100 overlap)
  → EmbeddingService.embedBatch()
  → VectorStore.storeBatch()

Agent receives new task
  → ContextBuilder.buildContext(agentId, taskDesc)
    → VectorStore.search(taskDesc) → relevant conversations
    → VectorStore.search(taskDesc, type=DOCUMENT) → relevant docs
    → VectorStore.search(taskDesc, type=CORRECTION) → relevant rules
  → Inject combined context vào system prompt
  → Agent executes task WITH full context
```

## Communication Patterns

```
1. DELEGATE (default):  Owner → CEO → assign task → Agent → report back
2. CHAIN (workflows):   Agent A output → Agent B input → Agent C input
3. GROUP (meetings):    CEO + Agent1 + Agent2 discuss together
```

## 24/7 Operation Model (Hybrid)

```
CEO Agent (always-on, cron every 5 min)
  ├── Marketing Agent (event-driven — wakes on task)
  ├── Analyst Agent (event-driven — wakes on task/daily cron)
  └── Support Agent (event-driven — wakes on customer trigger)
```

## Data Flow

```
Owner (Telegram/Dashboard)
  → API Route (Next.js)
  → CompanyManager / AgentOrchestrator
  → ContextBuilder.buildContext()          ← Memory injection
  → IAgentEngine.sendMessage()
  → OpenClawAdapter
  → HTTP POST → OpenClaw Gateway :18789
  → OpenClaw Agent Session
  → Response back through same chain
  → ConversationLogger.log()              ← Memory logging
  → AuditLogger.log()                     ← Audit logging
  → CostTracker.logUsage()                ← Cost tracking
```

## 8 Phases (15 Sessions)

```
Phase 1: Foundation & Scaffold       (S0-S1)
Phase 2: Adapter Layer               (S2-S3)
Phase 3: Company Core + Tools        (S4-S5)
Phase 4: Memory & Knowledge Base     (S6-S7)  ⭐
Phase 5: Communication & Approval    (S8-S9)
Phase 6: Interfaces (API + Telegram) (S10-S11)
Phase 7: UI & Integration Testing    (S12-S13)
Phase 8: Intelligence & Learning     (S14)
```
