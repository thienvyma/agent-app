# Phase 24: Data Pages and Realtime (S24)

> Tasks Kanban + Messages + Audit + Socket.IO realtime updates

---

## Muc tieu
3 data-heavy pages + real-time updates via useSocket hook.

## Files tao moi

### 1. src/app/tasks/page.tsx - Task Board
  - Full TaskBoard Kanban component
  - Create task modal (description, assign agent, priority)
  - Task detail modal: sub-tasks tree, result, error log, approval status
  - Drag-drop status changes
  - Real-time: new task appears, status updates live via Socket.IO

### 2. src/app/messages/page.tsx - Message Log
  - Chat-style message timeline
  - Filter: by agent, message type, date range
  - Agent-to-agent conversation threads
  - Search messages
  - Real-time: new messages appear instantly

### 3. src/app/audit/page.tsx - Audit Trail
  - Searchable audit log table
  - Filter: by agent, action type, date range
  - Export to CSV
  - Detail modal: full action details (JSON)

### 4. src/lib/use-socket.ts - React Socket.IO Hook
  function useSocket<T>(event: string): T | null
    - Auto-connect on mount
    - Subscribe to specified event
    - Return latest data
    - Auto-disconnect on unmount
  function useSocketEvents(): void
    - Subscribe to ALL events
    - Dispatch to React state/store
    - Update relevant pages automatically

## Kiem tra
1. Task board shows live data
2. Agent completes task -> board updates without refresh
3. New message -> appears in message log instantly
4. Audit log searchable + filterable
5. Socket.IO reconnects after disconnect

## Dependencies: Phase 19 (Socket.IO), Phase 16-17 (API), Phase 22 (components)
## Lien quan: PRD F7 Task board, Message logs, Audit trail
