# Phase 19: Realtime Events (S19)

> Socket.IO - Dashboard cap nhat live khi agent thay doi trang thai

---

## Muc tieu
Socket.IO server + event system + React client hook.
Dashboard updates real-time khong can refresh.

## Architecture

`
Core Modules (emit events)                 Dashboard (consume events)
  AgentOrchestrator ---> EventBus -+
  TaskEngine ----------> EventBus -+-->  Socket.IO Server  -->  useSocket() hook
  MessageBus ----------> EventBus -+         |                     |
  ApprovalEngine ------> EventBus -+         v                     v
  BudgetManager -------> EventBus -+   WebSocket connection   React state update
                                                                   |
                                                                   v
                                                              UI re-render
`

EventBus pattern: moi core module emit events -> Socket.IO broadcast to all clients.

## Files tao moi

### 1. src/lib/socket-server.ts
class SocketServer:
  private static io: Server
  - static init(httpServer: any): void
    1. Create Socket.IO server attached to Next.js HTTP server
    2. Configure CORS (localhost:3000)
    3. Authentication middleware: verify NextAuth JWT token
    4. Connection handler: log connected clients
  - static emit(event: string, data: any): void
    io.emit(event, { ...data, timestamp: Date.now() })
  - static emitToRoom(room: string, event: string, data: any): void
    io.to(room).emit(event, data)
  - static getConnectionCount(): number

Integration pattern:
  // In AgentOrchestrator.deploy():
  SocketServer.emit('agent:deployed', { agentId, name, status })

### 2. src/lib/socket-events.ts
All event definitions (TypeScript types + constants):

AGENT EVENTS:
  agent:deployed    { agentId, name, status: "RUNNING" }
  agent:undeployed  { agentId, name }
  agent:status      { agentId, name, oldStatus, newStatus, reason? }
  agent:health      { agentId, healthy: boolean, details? }

TASK EVENTS:
  task:created      { taskId, description, assignedTo?, priority }
  task:assigned     { taskId, agentId, agentName }
  task:progress     { taskId, percentComplete, currentStep? }
  task:completed    { taskId, result, tokenUsed, duration }
  task:failed       { taskId, error, retryCount }

MESSAGE EVENTS:
  message:new       { messageId, fromAgent, toAgent, content, type }
  message:chain     { chainId, currentStep, totalSteps }

APPROVAL EVENTS:
  approval:pending  { approvalId, taskId, agentName, reason }
  approval:resolved { approvalId, status, resolvedBy, response? }

COST EVENTS:
  cost:updated      { agentId, tokensSoFar, budgetPercent }
  cost:warning      { agentId, name, usage, budget, percentUsed }
  cost:paused       { agentId, name, reason: "budget_exceeded" }

SYSTEM EVENTS:
  system:health     { services: {...}, timestamp }
  system:error      { component, error, severity }

### 3. src/types/realtime.ts
TypeScript interfaces for all events above.

### 4. src/lib/use-socket.ts (React hook)
Custom React hooks:

function useSocket(): { connected: boolean, error?: string }
  - Connect to Socket.IO server on mount
  - Auto-reconnect on disconnect
  - Cleanup on unmount

function useSocketEvent<T>(event: string): T | null
  - Subscribe to specific event
  - Return latest data
  - Auto-unsubscribe on unmount

function useAgentStatus(): Map<string, AgentStatus>
  - Subscribe to agent:* events
  - Maintain local state map
  - Return always-current agent statuses

function useTaskBoard(): TaskBoardState
  - Subscribe to task:* events
  - Auto-update kanban columns
  - Return current board state

## Kiem tra
1. Deploy agent -> dashboard receives agent:deployed within 500ms
2. Task completed -> task:completed event with result
3. Approval pending -> notification badge updates
4. Budget exceeded -> cost:paused event
5. Disconnect + reconnect -> events resume
6. Multiple browser tabs -> all receive events

## Edge Cases
- Browser tab inactive -> reconnect on focus
- Stale state -> full refresh on reconnect
- High event frequency -> throttle to max 10 events/second per client
- Memory leak -> proper cleanup in useEffect

## Dependencies: Phase 1 (Next.js server), Phase 7/9/13/15/18 (event sources)
## Lien quan: PRD F7 Agent status monitoring real-time via Socket.IO
