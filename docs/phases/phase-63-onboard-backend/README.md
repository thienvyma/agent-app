# Phase 63: Onboard Backend

> **Session 63** | 3 files | TDD (Red → Green → Refactor)
> **Phụ thuộc**: Phase 62 (adapter fully working)

---

## Bối Cảnh
- OpenClaw chưa chạy `onboard` lần nào
- User muốn setup qua app UI, không mở terminal
- Settings page hiện có panels nhưng KHÔNG có guided wizard
- `openclaw-cli.ts` đã có: `getVersion()`, `configSet()`, `controlGateway()`, `healthCheck()`

## Mục Tiêu
Tạo backend logic cho onboard flow 6 steps:
1. Check installed → `openclaw --version`
2. Setup provider → `openclaw config set providers.*`
3. Setup model → `openclaw config set agents.defaults.model.primary`
4. Start gateway → `openclaw gateway start`
5. Verify health → `openclaw health`
6. Complete → summary

## Files (3)

### 1. [NEW] `tests/lib/openclaw-onboard.test.ts`
Tests (mock `openclaw-cli` functions):
- `checkInstalled()` → parse version string → `{ installed: true, version: "2026.3.11" }`
- `checkInstalled()` → CLI not found → `{ installed: false, version: "" }`
- `setupProvider(name, baseUrl, apiKey)` → calls `configSet` 2 times
- `setupProvider()` with empty baseUrl → throw validation error
- `setupModel(provider, model)` → calls `configSet`
- `startGateway(port)` → calls `controlGateway("start")` → returns `{ running: true }`
- `startGateway()` → already running → returns `{ running: true }` (not error)
- `verifyHealth()` → parse health output → `{ gateway: true, model: true, agent: true }`
- `verifyHealth()` → model unreachable → `{ gateway: true, model: false, agent: true }`
- `fetchProviderModels(baseUrl)` → HTTP GET → parse OpenAI `/v1/models` response → `["Qwen3.5-35B-A3B-Coder"]`

### 2. [NEW] `src/lib/openclaw-onboard.ts`
```typescript
export class OnboardExecutor {
  async checkInstalled(): Promise<{ installed: boolean; version: string }>
  async setupProvider(name: string, baseUrl: string, apiKey: string): Promise<void>
  async setupModel(provider: string, model: string): Promise<void>
  async startGateway(port?: number): Promise<{ running: boolean }>
  async verifyHealth(): Promise<{ gateway: boolean; model: boolean; agent: boolean }>
  async fetchProviderModels(baseUrl: string): Promise<string[]>
}
```
Dùng `openclaw-cli.ts` functions đã có. Không tạo CLI functions mới.

### 3. [NEW] `src/app/api/openclaw/onboard/route.ts`
```typescript
POST /api/openclaw/onboard
Body: { step: "check"|"provider"|"model"|"gateway"|"health", params: {...} }
Response: { success: boolean, data: {...}, error?: string }
```

## Kiểm Tra
- [ ] `npx jest tests/lib/openclaw-onboard.test.ts` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] API route returns correct response for each step
