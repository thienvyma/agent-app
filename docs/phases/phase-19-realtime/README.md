# Phase 19: Realtime Events (S19)

## Muc tieu
Socket.IO server + event types + client helper.
Dashboard cap nhat real-time khi agent thay doi trang thai.

## Session 19
- Files: lib/socket-server.ts, lib/socket-events.ts, types/realtime.ts, tests/
- Events: agent:status, task:progress, task:completed, message:new, approval:pending, cost:alert
- Server: Socket.IO attach vao Next.js server
- Client helper: React hook useSocket() cho dashboard
- Test: emit agent status change -> client nhan duoc event

## Lien quan PRD: F7 Agent status monitoring real-time via Socket.IO
