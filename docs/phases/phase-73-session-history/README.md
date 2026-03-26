# Phase 73: Session History Sync — Activity + Messages

> **Session**: S73
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🟢 Low

---

## Mục Tiêu

Activity và Messages pages đọc từ OpenClaw session history, merge với Prisma data, cung cấp view thống nhất.

## Files Cần Sửa (≤3)

### 1. `tests/api/session-history.test.ts` (NEW)
- Test: activity merges Prisma + OpenClaw sessions
- Test: messages reads from session history

### 2. `src/app/api/activity/route.ts` (MODIFY)
- Merge: Prisma activityLog + OpenClaw session metadata

### 3. `src/app/api/messages/route.ts` (MODIFY)
- When agent chat: read from OpenClaw session history
- When system message: read from Prisma

## Verification
```
□ Activity page shows OpenClaw session data
□ Messages page shows real agent conversations
□ Prisma data still displayed for non-agent items
```
