# Phase 18: Cost Tracking (S18)

## Muc tieu
CostTracker (token usage per agent) + BudgetManager (limits + auto-pause + alerts).

## Session 18
- Files: cost-tracker.ts, budget-manager.ts, tests/
- CostTracker: dem token usage per agent per day/week/month
- BudgetManager: set limits per agent, auto-pause khi vuot, gui alert
- Middleware: hook vao moi IAgentEngine.sendMessage() de dem tokens
- CLI: ae cost report, ae cost budget set agent-id limit
- Test: track usage -> exceed budget -> auto-pause agent

## Lien quan PRD: F11 CostTracker + BudgetManager
