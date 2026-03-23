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

## 26 Phases (27 Sessions) + CLI

```
A. Nền Tảng
  Phase 1:  Foundation & Scaffold      (S0-S1)   ← S0 ✅
  Phase 2:  CLI Environment            (S2)      ⭐ CLI-Anything + ae framework
B. Engine
  Phase 3:  Engine Interface            (S3)
  Phase 4:  OpenClaw Adapter            (S4)
C. Nhân Sự
  Phase 5:  Database Schema             (S5)
  Phase 6:  Company Manager             (S6)
  Phase 7:  Agent Lifecycle             (S7)
  Phase 8:  Tools & Security            (S8)
  Phase 9:  Task Engine                 (S9)
D. Trí Nhớ
  Phase 10: Vector Memory               (S10)     ⭐ 3-tier
  Phase 11: Conversation Memory         (S11)
  Phase 12: Knowledge Engine            (S12)
E. Giao Tiếp
  Phase 13: Agent Messaging             (S13)
  Phase 14: External Triggers           (S14)
  Phase 15: Approval Workflow           (S15)
F. Kết Nối
  Phase 16: Core API Routes             (S16)
  Phase 17: Extended API Routes         (S17)
  Phase 18: Cost Tracking               (S18)
  Phase 19: Realtime Events             (S19)
  Phase 20: Telegram Bot                (S20)
G. Dashboard
  Phase 21: Design System               (S21)
  Phase 22: UI Components              (S22)
  Phase 23: Core Pages                  (S23)
  Phase 24: Data Pages & Realtime       (S24)
H. Hoàn Thiện
  Phase 25: End-to-End Testing         (S25)
  Phase 26: Self-Learning              (S26)
```
