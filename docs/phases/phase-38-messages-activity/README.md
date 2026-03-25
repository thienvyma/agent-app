# Phase 38: Messages & Activity Page (S38)

> /messages — Message history, threads, color coding.
> /activity — Activity audit log.
> Wire: S13 (MessageBus) + S24 (MessageProvider, AuditProvider)

## Tinh nang

### /messages
1. Message list voi color coding (S24 MessageProvider)
2. Thread grouping (agent-to-agent conversations)
3. Filter by agent, date, type
4. Real-time new messages (SSE from RealtimeHub)
5. Message detail: full context + metadata

### /activity
1. Activity log table (S24 AuditProvider)
2. Pagination (20 per page)
3. Filter by event type, agent, date range
4. CSV export
5. Timeline view (vertical)

## Files tao moi
1. `src/app/(dashboard)/messages/page.tsx` — Messages
2. `src/app/(dashboard)/messages/components/message-list.tsx`
3. `src/app/(dashboard)/messages/components/message-thread.tsx`
4. `src/app/(dashboard)/activity/page.tsx` — Activity log
5. `src/app/(dashboard)/activity/components/activity-table.tsx`
6. `src/app/(dashboard)/activity/components/activity-timeline.tsx`
7. Update API routes /api/messages, /api/audit → repository
8. `tests/pages/messages-page.test.ts`
