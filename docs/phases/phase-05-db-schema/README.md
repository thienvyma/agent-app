# Phase 5: Database Schema (S5)

## Tru cot 1: Quan ly Nhan su - Database

## Muc tieu
Prisma schema 9 tables cho toan bo he thong. Migration + seed data.

## Session 5
- Files: prisma/schema.prisma, prisma/seed.ts, src/lib/prisma.ts
- 9 Tables:
  1. Company (name, config)
  2. Department (name, parentId) -> org chart hierarchy
  3. Agent (name, role, sop, model, tools, skills, status)
  4. Task (description, status, assignedTo, parentTask)
  5. Message (from, to, content, type)
  6. CorrectionLog (context, wrongOutput, correction, rule)
  7. AuditLog (agentId, action, details, timestamp)
  8. ToolPermission (agentId, toolName, granted)
  9. ApprovalRequest (taskId, status, policy, response)
- Test: prisma migrate dev + prisma db seed OK

## Lien quan PRD: F1 Company Structure, F5 Memory (CorrectionLog)
