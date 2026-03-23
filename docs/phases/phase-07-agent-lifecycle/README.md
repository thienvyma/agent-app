# Phase 7: Agent Lifecycle (S7)

## Tru cot 1: Quan ly Nhan su - Lifecycle + CEO Config

## Muc tieu
AgentOrchestrator (deploy/undeploy/redeploy) + HealthMonitor + CEO Agent Config
(always-on, cron poll 5 phut, delegation logic).

## Session 7
- Files: agent-orchestrator.ts, health-monitor.ts, ceo-agent-config.ts, tests/
- Orchestrator: deploy/undeploy/redeploy agents qua IAgentEngine
- HealthMonitor: periodic check + auto-restart khi agent fail
- CEO Config: always-on mode, cron check moi 5 phut, auto-delegate theo role hierarchy
- CEO poll: email, Telegram messages, pending tasks
- CLI: ae agent deploy, ae agent undeploy, ae agent status
- Test: deploy CEO, health check + auto-restart, CEO cron fires

## Lien quan PRD: F2 Agent Lifecycle, D2 Hybrid 24/7 Operation
