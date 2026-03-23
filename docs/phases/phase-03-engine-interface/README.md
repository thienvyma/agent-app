# Phase 3: Engine Interface (S3)

## Muc tieu
Dinh nghia IAgentEngine interface - ranh gioi giua wrapper va core engine.
Tao MockAdapter cho testing. KHONG cham OpenClaw.

## Session 3
- Files: src/types/agent.ts, src/core/adapter/i-agent-engine.ts, src/core/adapter/mock-adapter.ts, tests/
- Interface: deploy(), undeploy(), sendMessage(), getStatus(), listAgents()
- Types: AgentConfig, AgentStatus, AgentResponse
- Test: MockAdapter implements day du, all tests pass

## Lien quan PRD: D1 Engine interface pattern
