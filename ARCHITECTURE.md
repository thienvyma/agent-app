# 🏗️ ARCHITECTURE.md — Sơ Đồ Tham Chiếu

> AI đọc file này → hiểu ngay cấu trúc toàn bộ dự án.
> **App type**: Local-first web (Next.js localhost, $0 cost)

---

## Kiến Trúc 5 Tầng + CLI

```
┌─────────────────────────────────────────────────────────┐
│ CLI Layer (song song mọi phase)                         │
│   └── ae commands (agent, task, company, memory, cost)  │
│       → JSON output cho agent consumption               │
├─────────────────────────────────────────────────────────┤
│ TẦNG 5: UI Layer                                        │
│   ├── Next.js Dashboard localhost (org chart, monitor)   │
│   └── Telegram Bot (commands, reports, approvals)       │
├─────────────────────────────────────────────────────────┤
│ TẦNG 4: Company Module                                  │
│   ├── CompanyManager (departments, roles, hierarchy)    │
│   ├── AgentLifecycle (create, configure, deploy)        │
│   ├── MessageBus (agent↔agent, agent↔owner)             │
│   ├── TaskEngine (assign, decompose, track, escalate)   │
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
│ TẦNG 2: Memory & Knowledge Layer (3-Tier)               │
│   ┌─ Tier 1: OpenClaw Native (per-agent) ─────────────┐│
│   │  MEMORY.md + daily logs + Mem0 plugin              ││
│   │  → Hybrid search: BM25 + vector                   ││
│   │  → Quản lý: OpenClaw tự động                      ││
│   ├─ Tier 2: App-Level (company-wide) ────────────────┤│
│   │  pgvector (PostgreSQL extension)                   ││
│   │  ConversationLogger, DocumentIngester              ││
│   │  KnowledgeBase, ContextBuilder, CorrectionLog      ││
│   │  → Quản lý: App tự build                          ││
│   ├─ Tier 3: Session (real-time) ─────────────────────┤│
│   │  Redis — volatile, mất khi session end             ││
│   │  → Quản lý: App tự build                          ││
│   └────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────┤
│ TẦNG 1: Adapter Layer (RANH GIỚI VỚI OPENCLAW)         │
│   ├── IAgentEngine (interface contract — swap-able)     │
│   ├── OpenClawAdapter (HTTP → Gateway :18789)           │
│   └── OpenClaw (npm package — KHÔNG SỬA SOURCE)        │
└─────────────────────────────────────────────────────────┘
           ↕                    ↕
    Ollama Local          PostgreSQL + Redis
    (AI + Embedding)      (Docker Compose)
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

## Memory Flow (3-Tier)

```
Agent nhận task mới:
  ← Tier 1: OpenClaw MEMORY.md (per-agent facts, preferences)
  ← Tier 2: App pgvector → ContextBuilder.buildContext()
       → Search relevant conversations (episodic)
       → Search relevant documents (semantic)
       → Search relevant corrections (procedural)
  ← Tier 3: Redis (current session state)
  → Inject combined context vào system prompt
  → Agent executes task

After task:
  → Tier 1: OpenClaw auto-saves to MEMORY.md (agent manages)
  → Tier 2: ConversationLogger → embed → pgvector
  → Tier 2: AuditLogger → log action
  → Tier 2: CostTracker → log tokens
  → Tier 3: Redis → update session state
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
Owner (Telegram / Dashboard / CLI)
  → API Route (Next.js) or CLI command
  → CompanyManager / AgentOrchestrator
  → ContextBuilder.buildContext()        ← Memory Tier 2 injection
  → IAgentEngine.sendMessage()
  → OpenClawAdapter
  → HTTP POST → OpenClaw Gateway :18789
  → OpenClaw Agent Session
      ← OpenClaw MEMORY.md loaded       ← Memory Tier 1
  → Response back through same chain
  → ConversationLogger.log()            ← Memory Tier 2 save
  → AuditLogger.log()
  → CostTracker.logUsage()
```

## Local Infrastructure

```
Docker Compose:
  ├── PostgreSQL 16 + pgvector    (port 5432)
  └── Redis 7                     (port 6379)

Local Processes:
  ├── Next.js dev server          (port 3000)
  ├── OpenClaw Gateway            (port 18789)
  └── Ollama                      (port 11434)
```

## 19 Phases (20 Sessions) + CLI

```
A. Nền Tảng
  Phase 1:  Foundation & Scaffold      (S0-S1)   ← S0 ✅
B. Engine
  Phase 2:  Engine Interface            (S2)
  Phase 3:  OpenClaw Adapter            (S3)
C. Nhân Sự
  Phase 4:  Company Database            (S4)
  Phase 5:  Agent Lifecycle             (S5)
  Phase 6:  Tools & Security            (S6)
  Phase 7:  Task Engine                 (S7)
D. Trí Nhớ
  Phase 8:  Vector Memory               (S8)      ⭐ 3-tier
  Phase 9:  Knowledge System            (S9)
E. Giao Tiếp
  Phase 10: Agent Messaging             (S10)
  Phase 11: External Triggers           (S11)
  Phase 12: Approval Workflow           (S12)
F. Kết Nối
  Phase 13: REST API                    (S13)
  Phase 14: Cost & Realtime             (S14)
  Phase 15: Telegram Bot                (S15)
G. Dashboard
  Phase 16: UI Components              (S16)
  Phase 17: Dashboard Pages            (S17)
H. Hoàn Thiện
  Phase 18: End-to-End Testing         (S18)
  Phase 19: Self-Learning              (S19)
+ CLI: Song song mọi phase (CLI-Anything + ae commands)
```
