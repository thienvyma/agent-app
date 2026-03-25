# Phase 29: Agent Scheduling — Hybrid (S29)

> WRAP OpenClaw cron/spawn/message + BUILD phan OpenClaw KHONG CO.
> Moi thu chay qua OpenClawAdapter, KHONG duplicate engine.

---

## Muc tieu
1. WRAP OpenClaw cron → scheduling agent tasks
2. WRAP OpenClaw sessions_spawn → multi-agent delegation
3. BUILD AlwaysOnManager → crash detection + auto-restart
4. BUILD AutoDelegator → business logic phan cong
5. BUILD DailyReportGenerator → summary 17:00

## WRAP vs BUILD Map

| Tinh nang | OpenClaw co? | Phase 29 |
|-----------|-------------|----------|
| Cron timer | ✅ `cron` tool | **WRAP** qua OpenClawAdapter |
| Agent spawn | ✅ `sessions_spawn` | **WRAP** qua OpenClawAdapter |
| Agent messaging | ✅ `message` tool | **WRAP** qua OpenClawAdapter |
| Crash detection | ❌ | **BUILD** AlwaysOnManager |
| Auto-restart | ❌ | **BUILD** AlwaysOnManager |
| Role-based delegation | ❌ | **BUILD** AutoDelegator |
| Working hours/Night mode | ❌ | **BUILD** AlwaysOnManager |
| Daily/Weekly reports | ❌ | **BUILD** DailyReportGenerator |

## Kien truc Hybrid

```
┌─────────────────────────────────────────────────┐
│            AGENTIC ENTERPRISE (S29)              │
│                                                  │
│  ScheduleManager (WRAP)                          │
│  ├── registerJob(cron, agentId, task)            │
│  │   └── goi OpenClawAdapter                    │
│  │       └── POST /sessions/ceo/chat            │
│  │           "Set cron: 0 6 * * * → check email"│
│  │           → OpenClaw cron tool tu fire        │
│  │                                               │
│  AlwaysOnManager (BUILD)                         │
│  ├── monitor(agentId, interval)                  │
│  │   └── GET /sessions/ceo → status?            │
│  │       └── Crash? → redeploy()                │
│  │                                               │
│  AutoDelegator (BUILD)                           │
│  ├── delegateTask(description)                   │
│  │   └── Phan tich role → chon agent            │
│  │       └── goi pipeline.execute(agentId, msg) │
│  │                                               │
│  DailyReportGenerator (BUILD)                    │
│  ├── generate()                                  │
│  │   └── CostTracker + TaskManager + AuditLog   │
│  │       └── Format → gui Telegram              │
│  │                                               │
└──────────────────────┬──────────────────────────┘
                       │
            OpenClawAdapter (S4)
            HTTP calls duy nhat
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              OPENCLAW GATEWAY                    │
│                                                  │
│  Session CEO  ← cron tool fire moi 5 phut       │
│  Session MKT  ← nhan task tu CEO spawn          │
│  Session FIN  ← nhan task tu CEO spawn          │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Luong hoat dong cu the

### VD1: CEO tu dong check email luc 6AM
```
1. ScheduleManager.registerJob("0 6 * * *", "ceo", "Check email va bao cao")
2. → OpenClawAdapter.sendMessage("ceo-001", "Set up cron: ...")
3. → OpenClaw CEO session set cron tool
4. → Moi sang 6AM, cron fire TRONG OpenClaw
5. → CEO tu dong check email (dung web_fetch tool)
6. → CEO gui ket qua ve → Pipeline (S16) xu ly
7. → CostTracker ghi nhan → RealtimeHub push → Dashboard cap nhat
```

### VD2: CEO tu dong phan cong task moi
```
1. POST /api/tasks { description: "Viet content Q2" }
2. → AutoDelegator.delegateTask("Viet content Q2")
3. → Phan tich: "content" → Marketing Agent phu hop
4. → pipeline.execute("mkt-001", "Viet content Q2")
5. → OpenClawAdapter → OpenClaw MKT session lam viec
6. → Ket qua tra ve → Pipeline xu ly → Telegram thong bao
```

### VD3: Agent crash → auto-restart
```
1. AlwaysOnManager.monitor("ceo-001", 30000)  // check moi 30s
2. → GET /api/sessions/ceo-001 → status?
3. → Khong tra loi (crash!)
4. → AlwaysOnManager.handleCrash("ceo-001")
5. → OpenClawAdapter.redeploy("ceo-001")
6. → CEO session moi duoc tao
7. → RealtimeHub emit "agent:restarted"
8. → Telegram thong bao Owner: "CEO da duoc restart"
```

## Files tao moi

### 1. src/core/scheduler/schedule-manager.ts (WRAP)

```
class ScheduleManager:
  constructor(adapter: OpenClawAdapter)

  // WRAP OpenClaw cron — goi qua adapter
  registerJob(job: ScheduledJob): Promise<string>
    → adapter.sendMessage(job.agentId,
        `Set cron: ${job.cronExpression} → ${job.taskTemplate}`)

  removeJob(jobId: string): Promise<void>
  listJobs(): ScheduledJob[]
  pauseJob(jobId: string): void
  resumeJob(jobId: string): void
```

### 2. src/core/scheduler/always-on.ts (BUILD)

```
class AlwaysOnManager:
  constructor(adapter: OpenClawAdapter, realtimeHub: RealtimeHub,
              notificationService: NotificationService)

  // Monitoring loop — KHONG CO trong OpenClaw
  startMonitoring(agentId: string, intervalMs: number): void
    → setInterval: check adapter.getStatus(agentId)
    → Neu crash: handleCrash(agentId)

  handleCrash(agentId: string): Promise<void>
    → adapter.redeploy(agentId)
    → realtimeHub.emit("agent:restarted", { agentId })
    → notificationService.alert("Agent crashed, restarting...")

  setWorkingHours(agentId: string, hours: WorkingHours): void
  isWithinWorkingHours(agentId: string): boolean
  // Night mode: priority >= 8 moi duoc xu ly

  listAlwaysOn(): AlwaysOnStatus[]
```

### 3. src/core/scheduler/auto-delegator.ts (BUILD)

```
class AutoDelegator:
  constructor(pipeline: AgentPipeline, orgChart: OrgChart,
              budgetManager: BudgetManager)

  // Business logic phan cong — KHONG CO trong OpenClaw
  delegateTask(task: Task): Promise<DelegationResult>
    1. Phan tich keywords trong task.description
    2. Map keywords → department (content → Marketing, ROI → Finance)
    3. Tim agent trong department (orgChart)
    4. Check budget (budgetManager) → agent con du budget?
    5. Check status → agent dang RUNNING?
    6. Gan task va goi pipeline.execute()

  getSuggestion(description: string): string
    → Goi y agent phu hop nhat (khong tu dong gan)

  rebalance(): Promise<void>
    → Chuyen tasks tu agent qua tai sang agent ranh
```

### 4. src/core/scheduler/daily-report.ts (BUILD)

```
class DailyReportGenerator:
  constructor(costTracker, correctionLog, realtimeHub,
              notificationService)

  generate(date?: Date): DailyReport
    → Aggregate: tasks, costs, approvals, corrections
    → Format summary

  formatForTelegram(report: DailyReport): string
    → Emoji + compact format cho mobile

  sendDailyReport(): Promise<void>
    → generate() → formatForTelegram() → notificationService.alert()
    → Duoc ScheduleManager goi luc 17:00
```

## CLI moi

```
ae schedule list                    # Danh sach scheduled jobs
ae schedule add <cron> <agentId>    # Them job (WRAP OpenClaw cron)
ae schedule remove <jobId>          # Xoa job
ae always-on list                   # Agents dang duoc monitor
ae always-on enable <agentId>       # Bat monitoring
ae always-on disable <agentId>      # Tat monitoring
ae delegate <description>           # AutoDelegator goi y agent
ae report daily                     # Xem daily report
ae report weekly                    # Xem weekly report
```

## Kiem tra
1. registerJob → OpenClaw CEO nhan duoc cron setup
2. Cron fire → CEO tu dong thuc hien task
3. Agent crash → AlwaysOnManager restart trong 30s
4. Night mode → chi priority >= 8
5. AutoDelegator → "viet content" → Marketing, "tinh ROI" → Finance
6. Daily report 17:00 → Telegram nhan duoc summary

## Edge Cases
- OpenClaw Gateway restart → AlwaysOnManager phat hien, doi reconnect
- Agent bi treo (khong crash nhung khong tra loi) → timeout → restart
- 2 agents cung nhan task → delegator chon agent it viec hon
- Budget exceeded → queue task, thong bao Owner
- Working hours ket thuc → pause non-urgent, chi xu ly urgent

## Dependencies: Phase 4 (OpenClawAdapter), Phase 16 (Pipeline), Phase 20 (Telegram)
## Lien quan: PRD F3 Always-on, F5 Auto-delegation
