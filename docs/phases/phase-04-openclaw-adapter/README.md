# Phase 4: OpenClaw Adapter (S4)

## Muc tieu
Implement OpenClawAdapter ket noi OpenClaw qua HTTP API (port 18789).
AdapterFactory de switch mock vs real.

## Session 4
- Files: openclaw-adapter.ts, openclaw-client.ts, adapter-factory.ts, tests/
- HTTP: POST /api/agents (deploy), DELETE (undeploy), POST /chat, GET /status
- Factory: AGENT_ENGINE=openclaw|mock trong .env
- Test: ae engine test -> ping Gateway OK
- Tan dung OpenClaw MEMORY.md + Mem0 (Tier 1 memory)

## Lien quan PRD: D1 KHONG sua OpenClaw source, F2 Agent Lifecycle
