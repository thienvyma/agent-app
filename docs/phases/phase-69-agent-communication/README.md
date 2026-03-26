# Phase 68: Cron Scheduling + Health Monitoring — OpenClaw Enhancement

> **Session**: S68
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🟠 High

---

## Mục Tiêu

Enhance `ScheduleManager` + `AlwaysOnManager` để sử dụng OpenClaw native cron và health monitoring thay vì standalone.

## Module 1: ScheduleManager → openclaw cron CLI

### Hiện tại (L64)
```typescript
// Chỉ generate text, KHÔNG gọi OpenClaw
const openclawCommand = `Use cron tool to schedule: "${input.cronExpression}" → ${input.taskTemplate}`;
```

### Enhance thành
```typescript
// Gọi OpenClaw cron thực sự
const result = await execOpenClaw(['cron', 'add', 
  '--name', name, '--cron', cronExpr, '--message', taskTemplate]);
```

### Cụ thể
| Method | Hiện tại | Enhance |
|--------|----------|---------|
| `registerJob()` | in-memory + text | `openclaw cron add --name --cron --message` + cache |
| `removeJob()` | array filter | `openclaw cron rm <id>` + array filter |
| `pauseJob()` | `enabled=false` | `openclaw cron disable <id>` |
| `resumeJob()` | `enabled=true` | `openclaw cron enable <id>` |
| `listJobs()` | in-memory array | `openclaw cron list --json` merge cache |
| ❌ NEW | — | `getJobHistory(id)` → `openclaw cron runs --id <id>` |
| ❌ NEW | — | `runJobNow(id)` → `openclaw cron run <id> --force` |

## Module 2: AlwaysOnManager → openclaw health/heartbeat/presence

### Hiện tại
```typescript
// Pure logic — nhận manual input, trả output
checkAgentHealth(input: AgentHealthInput): AgentHealthResult
isWithinWorkingHours(hours, now): boolean
shouldProcessTask(priority, withinHours): boolean
```

### Enhance thành
| Method | Hiện tại | Enhance |
|--------|----------|---------|
| `checkAgentHealth(input)` | Manual input | `checkAgentHealth(agentId)` → auto: `openclaw sessions --agent <id> --json` |
| ❌ NEW | — | `getSystemHealth()` → `openclaw health --json` |
| ❌ NEW | — | `enableHeartbeat()` → `openclaw system heartbeat enable` |
| ❌ NEW | — | `getPresence(agentId)` → `openclaw system presence` |
| `isWithinWorkingHours()` | ✅ Giữ nguyên | Pure logic, KHÔNG cần OpenClaw |
| `shouldProcessTask()` | ✅ Giữ nguyên | Pure logic, KHÔNG cần OpenClaw |

## Files Cần Sửa (≤5)

### 1. `tests/scheduler/scheduling.test.ts` (MODIFY)
- Thêm tests cho openclaw cron calls
- Thêm tests cho auto health check
- **Giữ** all existing tests

### 2. `src/lib/openclaw-cli.ts` (MODIFY)
- Add `cronAdd(name, schedule, agentId?, message)`
- Add `cronRemove(id)`, `cronEnable(id)`, `cronDisable(id)`
- Add `cronList()`, `cronRuns(id)`, `cronRunNow(id)`
- Add `systemHealth()`, `systemHeartbeat(action)`, `systemPresence()`

### 3. `src/core/scheduler/schedule-manager.ts` (MODIFY)
- All methods → try openclaw cron → fallback in-memory

### 4. `src/core/scheduler/always-on.ts` (MODIFY)
- `checkAgentHealth()` → auto-query `openclaw sessions --agent <id> --json`
- Add `getSystemHealth()`, `enableHeartbeat()`, `getPresence()`
- Keep pure logic methods unchanged

### 5. `src/core/scheduler/auto-delegator.ts` (VERIFY)
- Không đổi code — verify vẫn works sau changes

## Verification
```
□ openclaw cron list --json shows jobs created by app
□ openclaw cron runs --id <id> shows execution history
□ checkAgentHealth reads real session data
□ All 18 existing scheduler tests pass
□ New tests pass
```
