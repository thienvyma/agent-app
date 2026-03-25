# Phase 27: CLI Anything — Moi truong Agent (S27)

> CLI la giao dien CHINH cho ca Owner va Agent tuong tac voi he thong.
> Moi lenh CLI = 1 kha nang cua agent. Cang nhieu lenh = agent cang manh.

---

## Muc tieu
Hoan thien CLI thanh AGENT ENVIRONMENT day du:
1. Agent co the tu goi CLI de thuc hien hanh dong
2. Owner co the dieu khien TOAN BO he thong qua CLI
3. Moi module da xay (S1-S26) deu co CLI tuong ung

## FULL CLI Command Map

### Core Commands (S2-S9)

```
ae status                      # Trang thai toan he thong
ae company list                # Danh sach cong ty
ae company create <name>       # Tao cong ty moi
ae agent list                  # Danh sach agents
ae agent create <config>       # Tao agent moi
ae agent deploy <id>           # Trien khai agent
ae agent undeploy <id>         # Dung agent
ae agent status <id>           # Trang thai 1 agent
ae tool list                   # Danh sach tools
ae tool register <config>      # Dang ky tool moi
ae audit list                  # Xem audit log
ae task list                   # Danh sach tasks
ae task create <desc>          # Tao task moi
ae task assign <id> <agentId>  # Gan task cho agent
ae memory search <query>       # Tim kiem trong VectorStore
ae memory store <content>      # Luu vao VectorStore
ae message list                # Xem message log
ae message send <from> <to>    # Gui message giua agents
```

### Advanced Commands (S13-S18)

```
ae trigger list                # Danh sach triggers
ae trigger fire <id>           # Kich hoat trigger thu cong
ae approve list                # Danh sach can duyet
ae approve accept <id>         # Dong y approval
ae approve reject <id>         # Tu choi + feedback
ae cost report                 # Bao cao chi phi
ae cost budget set <id> <max>  # Dat budget cho agent
ae cost budget list            # Tat ca budgets
```

### New Commands (S27)

```
ae realtime events             # Xem events gan day tu RealtimeHub
ae realtime stats              # Thong ke hub (connections, events, uptime)
ae feedback list               # Xem correction logs (tu hoc)
ae feedback stats              # Thong ke corrections
ae feedback inject <agentId>   # Xem truoc prompt injection
ae pipeline status             # 8 buoc pipeline
ae pipeline execute <id> <msg> # Chay full pipeline
```

## Files tao moi (S27)

### 1. src/cli/commands/realtime.ts
- `getRealtimeEventsData(events)` — format events cho CLI
- `getRealtimeStats(input)` — format hub stats (uptime, connections)
- Commander: `ae realtime events --limit <n>`, `ae realtime stats`

### 2. src/cli/commands/feedback.ts
- `getFeedbackListData(entries)` — format corrections cho CLI
- `getFeedbackStats(stats)` — format stats (total, topAgent)
- `previewPromptInjection(input)` — xem truoc prompt co rules tu hoc
- Commander: `ae feedback list --agent <id>`, `ae feedback stats`, `ae feedback inject <agentId>`

### 3. src/cli/commands/pipeline.ts
- `getPipelineStatusData()` — tra ve 8 buoc pipeline
- `formatPipelineExecution(result)` — format ket qua chay pipeline
- Commander: `ae pipeline status`, `ae pipeline execute <agentId> <message>`

### 4. src/cli/index.ts (MODIFY)
- Import + register 3 command groups moi: realtime, feedback, pipeline
- Tong cong: 13 command groups, 30+ sub-commands

## Kiem tra
1. `ae realtime events` — hien thi events dung format
2. `ae realtime stats` — connections + uptime
3. `ae feedback list` — show correction entries
4. `ae feedback stats` — topAgent + total
5. `ae feedback inject a-fin` — preview prompt injection
6. `ae pipeline status` — 8 steps listed
7. `ae pipeline execute a-ceo "Plan Q3"` — dry-run output

## Agent Environment Architecture

```
+----------------------------------------------------------+
|                    AGENT ENVIRONMENT                      |
+----------------------------------------------------------+
|                                                          |
|  Owner/Agent ──> ae <command> ──> CLI Router             |
|                                      │                   |
|                    ┌─────────────────┼──────────────┐    |
|                    │                 │              │    |
|               ┌────┴────┐   ┌──────┴─────┐  ┌────┴──┐ |
|               │  Core   │   │  Advanced  │  │  New  │  |
|               │ S2-S9   │   │  S13-S18   │  │  S27  │  |
|               ├─────────┤   ├────────────┤  ├───────┤  |
|               │ status  │   │ trigger    │  │realtime│ |
|               │ company │   │ approve    │  │feedback│ |
|               │ agent   │   │ cost       │  │pipeline│ |
|               │ tool    │   │            │  │       │  |
|               │ audit   │   │            │  │       │  |
|               │ task    │   │            │  │       │  |
|               │ memory  │   │            │  │       │  |
|               │ message │   │            │  │       │  |
|               └─────────┘   └────────────┘  └───────┘  |
|                                                          |
|  Output: JSON (machine-readable) hoac Table (human)      |
+----------------------------------------------------------+
```

## Edge Cases
- CLI chay KHONG can Docker (logic-only, mock adapters)
- JSON output mac dinh (agent-friendly, parseable)
- Table output cho owner (--format table)
- Error output: JSON voi error + details
- Commander auto-generates --help cho moi command

## Tich hop voi Agent
Agent co the goi CLI qua:
1. Shell exec: `ae task create "Write report"` 
2. API: POST /api/cli { command: "task create", args: [...] }
3. Noi bo: import truc tiep tu module

## Dependencies: ALL Phases (P1-P26)
## Lien quan: PRD F11 CLI, D8 Agent Environment
