# Phase 44: Full Pipeline Wiring (S44)

> Wire TOAN BO pipeline 8 buoc voi services THAT.
> Sau phase nay: gui message → pipeline chay → ket qua tra ve.

## Pipeline 8 buoc (S16) — wire that

```
1. ApprovalPolicy    → check DB (Prisma)
2. ContextBuilder    → query VectorStore (LightRAG) + CorrectionLog (Prisma)
3. PromptInjector    → inject rules tu DB
4. OpenClawAdapter   → gui message → OpenClaw Gateway → Ollama
5. CostTracker       → ghi tokens vao DB
6. BudgetManager     → check budget tu DB
7. ConversationLogger→ luu conversation vao DB
8. RealtimeHub       → push SSE → Dashboard update
```

## Integration tests
1. GUI: Form tren /agents/[id] → gui message → nhan response → hien thi
2. CLI: `ae pipeline execute ceo "Lap ke hoach"` → pipeline chay → ket qua
3. Telegram: Owner gui message → pipeline → response qua Telegram
4. All 3 inputs → CUNG 1 pipeline → ket qua nhat quan

## Files tao moi/sua
1. `src/core/orchestrator/agent-pipeline.ts` — wire real services
2. `src/lib/service-container.ts` — DI container (inject real or mock)
3. `tests/integration/full-pipeline.test.ts`
