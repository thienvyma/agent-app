# 🏗️ ARCHITECTURE.md — Sơ Đồ Tham Chiếu

> AI đọc file này → hiểu ngay cấu trúc toàn bộ dự án.

---

## Kiến Trúc 4 Tầng

```
┌─────────────────────────────────────────────────────────┐
│ TẦNG 4: UI Layer                                        │
│   ├── Next.js Dashboard (org chart, agent monitor, logs)│
│   └── Telegram Bot (commands, reports, approvals)       │
├─────────────────────────────────────────────────────────┤
│ TẦNG 3: Company Module                                  │
│   ├── CompanyManager (departments, roles, hierarchy)    │
│   ├── AgentLifecycle (create, configure, deploy)        │
│   ├── MessageBus (agent↔agent, agent↔owner)             │
│   ├── TaskEngine (assign, track, escalate)              │
│   └── ApprovalEngine (HITL, owner approve/reject)       │
├─────────────────────────────────────────────────────────┤
│ TẦNG 2: Orchestration Core                              │
│   ├── AgentOrchestrator (scheduling, health, restart)   │
│   ├── MemoryStore (short-term, long-term, shared KB)    │
│   ├── SkillRegistry (pluggable business skills)         │
│   ├── PolicyEngine (SOP, permissions, budget)           │
│   ├── FeedbackLoop (corrections → self-learning)        │
│   └── TaskDecomposer (CEO auto-split complex tasks)     │
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
  └── Support Agent (event-driven — wakes on customer message)
```

## Data Flow

```
Owner (Telegram/Dashboard)
  → API Route (Next.js)
  → CompanyManager / AgentOrchestrator
  → IAgentEngine.sendMessage()
  → OpenClawAdapter
  → HTTP POST → OpenClaw Gateway :18789
  → OpenClaw Agent Session
  → Response back through same chain
```
