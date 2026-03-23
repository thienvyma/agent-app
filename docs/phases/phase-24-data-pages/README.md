# Phase 24: Data Pages and Realtime (S24)

> Tasks Kanban + Messages + Audit + Socket.IO live updates

---

## Muc tieu
3 data-heavy pages voi real-time updates via useSocket hook.
Dashboard TU DONG cap nhat khi agent thay doi trang thai.

## Files tao moi

### 1. src/app/tasks/page.tsx - Task Board

Layout:
  +--------------------------------------------------+
  | Tasks               [Create Task] [Filter]        |
  +--------------------------------------------------+
  | PENDING(3) | RUNNING(2) | APPROVAL(1) | DONE(5)  |
  | +--------+ | +--------+ | +----------+| +------+ |
  | |Task #12| | |Task #8 | | |Task #15  || |Task#1| |
  | |Content | | |ROI calc| | |Email to  || |Done  | |
  | |Mkt Mgr | | |Finance | | |Customer  || |      | |
  | |P:3     | | |P:5     | | |APPROVE?  || |      | |
  | +--------+ | +--------+ | +----------+| +------+ |
  | +--------+ | +--------+ |             |          |
  | |Task #14| | |Task #9 | |             |          |
  | +--------+ | +--------+ |             |          |
  +--------------------------------------------------+

Features:
  - Full TaskBoard Kanban component
  - Create task modal: { description, assign agent (dropdown), priority (1-10) }
  - Task detail modal (click card):
    - Description full text
    - Sub-tasks tree (if decomposed)
    - Result output
    - Error log (if failed)
    - Approval status + owner response
    - Retry button (if failed)
  - DRAG-DROP between columns -> API PUT /api/tasks/:id
  - REAL-TIME: task:created, task:progress, task:completed events -> auto-update board

### 2. src/app/messages/page.tsx - Message Log

Layout:
  +--------------------------------------------------+
  | Messages     [Agent: All v] [Type: All v] [Search]|
  +--------------------------------------------------+
  | 10:30 | CEO -> Marketing | DELEGATE                |
  | "Viet content cho chien dich KM thang 4"          |
  |                                                    |
  | 10:32 | Marketing -> CEO | REPORT                  |
  | "Da viet xong draft, gui cho sep duyet"           |
  |                                                    |
  | 10:35 | SYSTEM -> Owner | ALERT                    |
  | "Approval pending: Email to customer ABC"         |
  +--------------------------------------------------+

Features:
  - Chat-style timeline (newest on top or bottom, configurable)
  - Filter: by agent (from/to), message type, date range
  - Search: full-text search in message content
  - Agent-to-agent conversation threads (group by from+to pair)
  - REAL-TIME: message:new event -> appears instantly (no refresh)
  - Color coding: DELEGATE blue, REPORT green, ALERT red, CHAIN purple

### 3. src/app/audit/page.tsx - Audit Trail

Layout:
  +--------------------------------------------------+
  | Audit Log    [Agent: v] [Action: v] [Date: v]    |
  +--------------------------------------------------+
  | Timestamp     | Agent      | Action      | Detail |
  | 10:30:15      | CEO        | DEPLOY      | {}     |
  | 10:30:20      | CEO        | SEND_MSG    | {to:M} |
  | 10:31:00      | Marketing  | USE_TOOL    | {fb}   |
  | 10:32:00      | Marketing  | COMPLETE    | {ok}   |
  +--------------------------------------------------+
  | [< Prev] Page 1 of 10 [Next >]   [Export CSV]    |
  +--------------------------------------------------+

Features:
  - Searchable table with pagination (50 per page)
  - Filter: agent, action type, date range
  - Click row -> detail modal (full JSON details)
  - Export to CSV (GET /api/audit/export)
  - REAL-TIME: new audit entries appear at top

### 4. src/lib/use-socket.ts - React Socket.IO Hook

/**
 * Core hook: manages Socket.IO connection lifecycle
 */
function useSocket(): {
  connected: boolean
  error: string | null
  reconnecting: boolean
}

/**
 * Subscribe to a single event
 * Auto-cleanup on unmount
 */
function useSocketEvent<T>(event: string, callback?: (data: T) => void): T | null

/**
 * Pre-built hook: maintains agent status map, auto-updated
 */
function useAgentStatuses(): Map<string, AgentStatus>

/**
 * Pre-built hook: maintains task board state, auto-updated
 */
function useTaskBoard(initialTasks: Task[]): {
  tasks: Task[]
  columns: Record<TaskStatus, Task[]>
}

/**
 * Pre-built hook: pending approvals count (for header badge)
 */
function usePendingApprovals(): number

Connection management:
  - Auto-connect on app mount (layout level)
  - AuthToken from NextAuth session
  - Auto-reconnect with exponential backoff (1s, 2s, 4s, 8s, max 30s)
  - Disconnect on page unload

## Kiem tra
1. Task board: drag task from PENDING -> RUNNING -> API called
2. Agent completes task -> board auto-updates (no refresh)
3. New message -> appears instantly in message log
4. Audit log: search by agent returns filtered results
5. Socket.IO disconnect -> reconnect -> events resume
6. Multiple browser tabs -> all receive events simultaneously
7. Approval pending -> header notification badge (red dot + count)

## Edge Cases
- Large task result output -> truncate with "Show more" button
- 1000+ audit entries -> virtual scrolling or pagination
- Socket reconnect -> fetch missed events since last disconnect
- Mobile: Kanban horizontal scroll

## Dependencies: Phase 19 (Socket.IO), Phase 16-17 (API), Phase 22 (components)
## Lien quan: PRD F7 Task board, Message logs, Audit trail
