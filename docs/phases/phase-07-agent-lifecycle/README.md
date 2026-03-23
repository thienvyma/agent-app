# Phase 7: Agent Lifecycle (S7)

> Tru cot 1: Quan ly Nhan su - Lifecycle Management + CEO Config
> Theo D2: CEO always-on + nhan vien event-driven (Hybrid Model)

---

## Muc tieu

Xay dung AgentOrchestrator (deploy/undeploy/redeploy), HealthMonitor (auto-restart),
va CEO Agent Config (always-on, cron poll, delegation logic).

## Tai sao phase nay quan trong?

Day la noi agent THUC SU SONG. Truoc phase nay, agent chi la data trong DB.
Sau phase nay, agent duoc deploy len OpenClaw va bat dau lam viec.

CEO Agent la "liet si" duy nhat chay 24/7 - tat ca lenh cua owner di qua CEO.

## Architecture

Owner -> Telegram/CLI -> CEO Agent (always-on, cron 5min)
                              |
                              v
                    TaskDecomposer (Phase 9)
                         |    |    |
                         v    v    v
                    Marketing Finance Design (event-driven)

## Files tao moi

### 1. src/core/orchestrator/agent-orchestrator.ts

class AgentOrchestrator:
  - constructor(engine: IAgentEngine, db: PrismaClient)
  - async deploy(agentId: string): Promise<AgentStatus>
    1. Load agent config tu DB (role, sop, model, tools)
    2. Build OpenClaw agent config tu DB fields
    3. Goi engine.deploy(config)
    4. Update DB status -> RUNNING
    5. Emit event 'agent:deployed' (cho Socket.IO P19)
  - async undeploy(agentId: string): Promise<void>
    1. Goi engine.undeploy(agentId)
    2. Update DB status -> IDLE
    3. Emit event 'agent:undeployed'
  - async redeploy(agentId: string): Promise<AgentStatus>
    1. undeploy() + deploy() atomic
  - async deployAll(): Promise<void>
    1. Load all agents where isAlwaysOn=true
    2. Deploy each (CEO first, then others)

### 2. src/core/orchestrator/health-monitor.ts

class HealthMonitor:
  - constructor(orchestrator: AgentOrchestrator, interval: number = 30000)
  - start(): void
    1. setInterval(checkAll, interval)
  - stop(): void
  - async checkAll(): Promise<HealthReport>
    1. For each deployed agent:
       a. engine.getStatus(agentId)
       b. If ERROR -> autoRestart(agentId)
       c. If timeout > 60s -> mark UNRESPONSIVE
    2. Return HealthReport { healthy, unhealthy, restarted }
  - async autoRestart(agentId: string, maxRetries: number = 3): Promise<boolean>
    1. retryCount++
    2. If retryCount > maxRetries -> escalate to owner (alert)
    3. Else -> orchestrator.redeploy(agentId)
    4. Log to AuditLog

### 3. src/core/orchestrator/ceo-agent-config.ts

CEO Agent dac biet:
  - isAlwaysOn: true
  - cronSchedule: "*/5 * * * *" (moi 5 phut)
  - SOP gom:
    1. Check pending Telegram messages -> xu ly
    2. Check email inbox (neu co email trigger)
    3. Check pending tasks -> delegate cho agents phu hop
    4. Check approval queue -> notify owner neu can
  - Delegation logic:
    1. Parse intent tu owner message
    2. Tim agent phu hop theo role matching
    3. Neu task phuc tap -> goi TaskDecomposer (Phase 9)
    4. Neu task don gian -> truc tiep assign

interface CEOConfig:
  pollIntervalMs: number     // 300000 (5 min)
  delegationRules: DelegationRule[]
  escalationPolicy: EscalationPolicy

interface DelegationRule:
  keywords: string[]         // ["marketing", "quang cao", "content"]
  targetRole: string         // "marketing"
  requireApproval: boolean   // false for internal tasks

### 4. tests/orchestrator/agent-orchestrator.test.ts
- Test deploy: mock engine -> verify engine.deploy called with correct config
- Test undeploy: verify engine.undeploy + DB status update
- Test health check: mock engine returning ERROR -> verify auto-restart
- Test CEO config: verify cron schedule + delegation rules
- Test max retries: 3 failures -> escalation alert

## Dependencies
- Phase 3: IAgentEngine interface
- Phase 4: OpenClawAdapter (hoac MockAdapter cho test)
- Phase 5: DB schema (Agent table)
- Phase 6: CompanyManager (agent data)

## Kiem tra
1. ae agent deploy <ceo-id> -> CEO agent deployed on OpenClaw
2. ae agent status <ceo-id> -> RUNNING
3. Kill OpenClaw -> HealthMonitor detects -> auto-restart
4. ae agent undeploy <ceo-id> -> IDLE
5. Unit tests: all pass

## Edge Cases
- Deploy agent khi OpenClaw khong chay -> graceful error + retry
- Deploy da ton tai -> skip or redeploy?
- Health check race condition (check during deploy)
- CEO cron overlap (previous poll chua xong)
- Multiple CEO agents (should be prevented)

## CLI (bo sung vao ae)
  ae agent deploy <id>     -> deploy agent len OpenClaw
  ae agent undeploy <id>   -> shutdown agent
  ae agent status <id>     -> show agent status + health
  ae agent restart <id>    -> redeploy

## Lien quan
- PRD: F2 Agent Lifecycle, D2 24/7 Hybrid Operation
- Decisions: D1 OpenClaw via IAgentEngine, D2 CEO always-on + event-driven
- Phase tiep theo: Phase 8 (Tools), Phase 9 (Task Engine), Phase 13 (Messaging)
