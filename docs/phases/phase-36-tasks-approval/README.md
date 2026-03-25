# Phase 36: Tasks & Approval Page (S36)

> /tasks — Task board, decomposition, approval workflow.
> Wire: S9 (TaskDecomposer) + S15 (Approval) + S24 (TaskPageProvider)

## Tinh nang
1. Task board (3 columns): Pending | In Progress | Completed
2. Create task → TaskDecomposer tao sub-tasks
3. Drag-drop giua columns (S24 drag-drop logic)
4. Task detail page: /tasks/[id]
   - Sub-tasks list
   - Approval status
   - Agent assignment
   - Execution log
5. Approval queue: /approvals
   - Pending approvals list
   - Approve/Reject buttons
   - Bulk actions
6. Auto-delegate: click button → AutoDelegator goi y agent

## Files tao moi
1. `src/app/(dashboard)/tasks/page.tsx` — Task board
2. `src/app/(dashboard)/tasks/[id]/page.tsx` — Task detail
3. `src/app/(dashboard)/tasks/components/task-board.tsx`
4. `src/app/(dashboard)/tasks/components/task-card.tsx`
5. `src/app/(dashboard)/tasks/components/task-form.tsx`
6. `src/app/(dashboard)/approvals/page.tsx` — Approval queue
7. Update API routes /api/tasks → use repository
8. `tests/pages/tasks-page.test.ts`
