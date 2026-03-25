# Phase 41: Real-time Integration (S41)

> Wire SSE (Server-Sent Events) tu RealtimeHub → Dashboard.
> Sau phase nay, dashboard cap nhat LIVE khong can reload.

## Tinh nang
1. SSE endpoint: /api/events (da co tu S19)
2. React hook: `useRealtimeEvents()` — subscribe to SSE
3. Dashboard auto-update khi:
   - Agent status thay doi (deploy/undeploy/crash)
   - Task status thay doi (assigned/completed/failed)
   - New message tu agent
   - Cost update
   - Approval request moi
4. Toast notifications (goc phai tren)
5. Sound notification for urgent events

## Architecture
```
Backend:
  RealtimeHub.emit("agent:deployed", { agentId })
       ↓
  GET /api/events (SSE stream)
       ↓
Frontend:
  useRealtimeEvents() hook
       ↓
  dispatch → React state update → UI re-render
```

## Files tao moi
1. `src/hooks/use-realtime.ts` — SSE hook
2. `src/components/ui/toast.tsx` — Toast notification component
3. `src/components/ui/notification-bell.tsx` — Header bell icon + dropdown
4. Update moi page de dung `useRealtimeEvents()`
5. `tests/realtime/sse-integration.test.ts`
