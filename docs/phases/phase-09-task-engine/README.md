# Phase 9: Task Engine (S9)

## Tru cot 4: Giao viec tu dong & Phoi hop Nhom

## Muc tieu
TaskDecomposer (tu dong chia nho task phuc tap) + ErrorRecovery
(retry + escalation + partial save).

## Session 9
- Files: task-decomposer.ts, error-recovery.ts, tests/
- TaskDecomposer: CEO nhan lenh -> phan tich -> chia nho -> delegate
  VD: "Trien khai chien dich KM" -> Marketing (content) + Finance (loi nhuan) + Design (banner)
- ErrorRecovery: retry (max 3) -> escalation (bao CEO/owner) -> partial save
- CLI: ae task assign agent desc, ae task list, ae task status id
- Test: complex task -> sub-tasks + retry on failure

## Lien quan PRD: F3 CEO Delegation + Task Decomposition, D6 Task Decomposition
