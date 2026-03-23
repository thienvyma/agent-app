# Phase 15: Approval Workflow - HITL (S15)

> Tru cot 2: Co che Human-in-the-Loop (HITL)
> Agent lam 99% -> gui cho owner duyet buoc cuoi

---

## Muc tieu
ApprovalEngine + ApprovalPolicy + ApprovalQueue.

## Vi du thuc te
1. Agent Marketing viet xong email gui khach hang
2. ApprovalPolicy check: "gui khach" = approval-required
3. ApprovalEngine tao ApprovalRequest, status=PENDING
4. Gui Telegram: "Sep oi, em viet xong email nay. Duyet gui khach?" + [Duyet] [Sua] [Tu choi]
5. Owner click [Duyet] -> task continues execution
6. Owner click [Tu choi] -> CorrectionLog created -> agent hoc tu sai

## Files tao moi

### 1. src/core/approval/approval-engine.ts
class ApprovalEngine:
  - constructor(db: PrismaClient, messageBus: MessageBus)
  - async requestApproval(task: Task, reason: string): ApprovalRequest
    1. Create ApprovalRequest (status: PENDING)
    2. Emit event approval:pending (cho Telegram P20 + Socket.IO P19)
  - async approve(approvalId: string, response?: string): void
    1. Update status -> APPROVED
    2. Resume task execution
    3. Emit event approval:resolved
  - async reject(approvalId: string, feedback: string): void
    1. Update status -> REJECTED
    2. Create CorrectionLog (context, wrongOutput=task.result, correction=feedback)
    3. Notify agent of rejection
    4. Emit event approval:rejected
  - async modify(approvalId: string, modifications: string): void
    1. Update status -> MODIFIED
    2. Re-run task with modifications

### 2. src/core/approval/approval-policy.ts
class ApprovalPolicy:
  - constructor(rules: PolicyRule[])
  - async evaluate(task: Task, agent: Agent): PolicyDecision
    Check rules in order:
    1. Budget vuot nguong -> REQUIRE_APPROVAL
    2. Task gui cho khach hang -> REQUIRE_APPROVAL
    3. Task chi tien (payment) -> REQUIRE_APPROVAL
    4. Task quyet dinh lon (hire, fire, contract) -> REQUIRE_APPROVAL
    5. Internal task -> AUTO_APPROVE

interface PolicyRule:
  name: string
  condition: (task: Task, agent: Agent) => boolean
  reason: string

### 3. src/core/approval/approval-queue.ts
class ApprovalQueue:
  - constructor(db: PrismaClient)
  - async getPending(): ApprovalRequest[]
  - async getByAgent(agentId: string): ApprovalRequest[]
  - async getStats(): { pending: number, approved: number, rejected: number }

## CLI: ae approve list, ae approve accept <id> [--response "ok"], ae approve reject <id> --feedback "sua lai"

## Kiem tra
1. Task customer-facing -> approval required -> PENDING
2. Task internal -> auto-approve -> continues
3. Owner approve -> task resumes
4. Owner reject -> CorrectionLog created
5. ae approve list -> shows pending items

## Dependencies: Phase 5 (ApprovalRequest table), Phase 13 (MessageBus events)
## Lien quan: PRD F4 Approval Workflow, D4 HITL
