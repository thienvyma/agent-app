# Phase 15: Approval Workflow (S15)

## Tru cot 2: Co che Human-in-the-Loop (HITL)

## Muc tieu
ApprovalEngine + ApprovalPolicy + ApprovalQueue.
Tasks nhay cam PHAI owner duyet truoc khi execute.

## Session 15
- Files: approval-engine.ts, approval-policy.ts, approval-queue.ts, tests/
- ApprovalPolicy: rules phan loai task
  auto -> internal tasks (tu dong chay)
  approval-required -> gui khach, chi tien, quyet dinh lon
- ApprovalEngine: agent lam 99% -> gui cho owner duyet
- ApprovalQueue: hang doi cac approval requests
- CLI: ae approve list, ae approve accept id, ae approve reject id
- Test: sensitive task -> held for approval, internal -> auto-execute

## Lien quan PRD: F4 Approval Workflow, D4 HITL
