# Phase 19: Realtime Events (S19)

> Socket.IO - Dashboard cap nhat real-time

---

## Muc tieu
Socket.IO server + event system + React client hook.

## Files tao moi

### 1. src/lib/socket-server.ts
class SocketServer:
  - constructor(httpServer: Server)
  - init(): void
    Attach Socket.IO to Next.js server
    Setup authentication (NextAuth token)
    Setup event handlers
  - emit(event: string, data: any): void
    Broadcast to all connected clients
  - emitToRoom(room: string, event: string, data: any): void

### 2. src/lib/socket-events.ts
Event definitions:
  agent:deployed    { agentId, name, status }
  agent:undeployed  { agentId }
  agent:status      { agentId, oldStatus, newStatus }
  task:created      { taskId, description, assignedTo }
  task:progress     { taskId, percentComplete }
  task:completed    { taskId, result }
  task:failed       { taskId, error }
  message:new       { messageId, from, to, content }
  approval:pending  { approvalId, taskId, reason }
  approval:resolved { approvalId, status }
  cost:alert        { agentId, usage, budget, percentUsed }

EventEmitter integration:
  AgentOrchestrator -> emit agent events
  TaskEngine -> emit task events
  MessageBus -> emit message events
  ApprovalEngine -> emit approval events
  BudgetManager -> emit cost alerts

### 3. src/types/realtime.ts
  Type definitions for all events

### 4. src/lib/use-socket.ts (React hook for Phase 23-24)
function useSocket(event: string, handler: (data) => void): void
  - Connect to Socket.IO server on mount
  - Subscribe to event
  - Cleanup on unmount

## Kiem tra
1. Agent deployed -> client receives agent:deployed event
2. Task completed -> client receives task:completed
3. Approval pending -> client receives approval:pending

## Dependencies: Phase 1 (Next.js server), Phase 7/9/13/15 (event sources)
## Lien quan: PRD F7 Agent status monitoring real-time via Socket.IO
