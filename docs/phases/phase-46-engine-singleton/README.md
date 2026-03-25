# Phase 46: Engine Singleton + Pipeline API (S46)

> Tạo global engine + pipeline singleton, expose qua API route.
> KHÔNG sửa code OpenClaw — chỉ gọi HTTP API qua wrapper.

## Files tạo mới
1. `src/lib/engine-singleton.ts` — global engine + pipeline instance
2. `src/app/api/pipeline/route.ts` — POST /api/pipeline/execute
3. `tests/integration/pipeline-api.test.ts`

## Logic
- `getEngine()`: lazy init, dùng `AdapterFactory.createWithFallback()`
- `getPipeline()`: lazy init, dùng engine + ServiceContainer deps
- API route: `POST { agentId, message }` → `pipeline.execute()` → response
