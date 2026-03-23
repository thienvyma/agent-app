# Phase 9: Task Engine (S9)

> Tru cot 4: Giao viec tu dong - Task Decomposition + Error Recovery
> Owner nhan 1 cau -> system tu chia nho + delegate + xu ly loi

---

## Muc tieu
TaskDecomposer (CEO chia nho task) + ErrorRecovery (retry + escalation + partial save).

## Flow thuc te
Owner: "Trien khai chien dich khuyen mai thang nay"
  -> CEO nhan lenh
  -> TaskDecomposer phan tich:
     Sub-task 1: Viet content KM (-> Marketing Agent)
     Sub-task 2: Tinh loi nhuan KM (-> Finance Agent)
     Sub-task 3: Thiet ke banner (-> Design Agent)
  -> Moi sub-task duoc assign va theo doi
  -> Khi tat ca xong -> tong hop bao cao -> gui owner

## Files tao moi

### 1. src/core/tasks/task-decomposer.ts
class TaskDecomposer:
  - constructor(engine: IAgentEngine, hierarchy: HierarchyEngine, db: PrismaClient)
  - async decompose(taskDescription: string, ceoAgentId: string): DecompositionPlan
    1. Gui taskDescription cho CEO agent: "Phan tich va chia nho task nay"
    2. CEO tra ve danh sach sub-tasks + suggested assignee role
    3. Map role -> Agent (via HierarchyEngine.findAgentsByRole())
    4. Create Task records in DB (voi parentTaskId linking)
    5. Return DecompositionPlan
  - async assignTask(taskId: string, agentId: string): void
    1. Update task.assignedToId
    2. Send task to agent via engine.sendMessage()
    3. Log to AuditLog
  - async collectResults(parentTaskId: string): TaskReport
    1. Get all sub-tasks
    2. Check all completed
    3. Compile results into report
    4. If any failed -> handle via ErrorRecovery

interface DecompositionPlan:
  parentTask: Task
  subTasks: { description: string, role: string, agent: Agent, priority: number }[]

### 2. src/core/tasks/error-recovery.ts
class ErrorRecovery:
  - constructor(db: PrismaClient, orchestrator: AgentOrchestrator)
  - async handleFailure(task: Task, error: Error): RecoveryAction
    1. Increment task.retryCount
    2. If retryCount <= 3:
       -> Retry: re-send task to same agent
    3. If retryCount > 3 and has alternate agent:
       -> Reassign: find another agent with same role
    4. If no alternate:
       -> Escalate: notify CEO/owner via MessageBus
    5. Always: save partial result if available
  - async partialSave(task: Task, partialResult: string): void
    Save whatever agent produced before failing
  - async escalate(task: Task, reason: string): void
    Send alert to CEO and/or owner via Telegram

enum RecoveryAction: RETRY | REASSIGN | ESCALATE | ABORT

## CLI bo sung:
  ae task assign <agentId> "description" -> create + assign task
  ae task list [--status pending|running|completed|failed]
  ae task status <taskId> -> detailed status + sub-tasks
  ae task retry <taskId> -> manually retry failed task

## Kiem tra
1. Decompose complex task -> 3+ sub-tasks created in DB
2. Sub-tasks assigned to correct agents by role
3. Agent fails -> retry -> succeeds on retry
4. 3 retries fail -> escalation alert sent
5. Partial save -> result preserved even on failure

## Dependencies: Phase 3 (IAgentEngine), Phase 6 (HierarchyEngine), Phase 7 (Orchestrator)
## Lien quan: PRD F3 CEO Delegation + Task Decomposition, D6 Task Decomposition
