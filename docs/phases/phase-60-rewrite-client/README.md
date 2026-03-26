# Phase 60: Rewrite OpenClawClient

> **Session 60** | 2 files | TDD (Red → Green → Refactor)
> **Phụ thuộc**: Phase 59 (config fix + CLI verified)

---

## Bối Cảnh
`openclaw-client.ts` hiện tại (153 dòng):
- Generic HTTP client với `get()`, `post()`, `delete()` methods
- Gọi tới fake endpoints: `/api/sessions`, `/api/agents`, `/api/status`
- Retry logic + error normalization — code tốt, giữ lại
- auth: không có Bearer token support

## Mục Tiêu
Rewrite thành client chuyên dụng cho OpenClaw OpenAI-compatible API:
- `chatCompletion(request, agentId?)` → POST `/v1/chat/completions`
- `healthCheck()` → GET `/v1/models` hoặc CLI fallback
- Bearer token auth từ `OPENCLAW_GATEWAY_TOKEN`
- Giữ retry + error normalization

## Files (2)

### 1. [REWRITE] `tests/adapter/openclaw-client.test.ts`
> Tạo file mới (test riêng cho client, tách khỏi adapter test)

Tests:
- `chatCompletion()` → mock axios POST → parse OpenAI response format
- `chatCompletion()` → response có `choices[0].message.content` + `usage.total_tokens`
- `chatCompletion()` → kèm `X-Session-Key` header khi có agentId
- `healthCheck()` → mock GET `/v1/models` → return true
- `healthCheck()` → connection refused → return false
- `constructor()` → default URL `http://localhost:18789`
- `constructor()` → auth token from env
- Error normalization: ECONNREFUSED, ETIMEDOUT, 4xx, 5xx

### 2. [REWRITE] `src/core/adapter/openclaw-client.ts`
Xoá: `get()`, `post()`, `delete()` generic methods
Thêm:
```typescript
interface ChatCompletionRequest {
  model?: string;
  messages: { role: "system"|"user"|"assistant"; content: string }[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface ChatCompletionResponse {
  message: string;
  tokenUsed: number;
}

class OpenClawClient {
  constructor(baseUrl?: string, token?: string)
  async chatCompletion(req: ChatCompletionRequest, agentId?: string): Promise<ChatCompletionResponse>
  async healthCheck(): Promise<boolean>
}
```

> ⚠️ **Giữ constructor signature tương thích**: `service-container.ts` line 62 gọi
> `new OpenClawClient(openclawUrl)` — constructor phải accept `baseUrl` as first param.

## Kiểm Tra
- [ ] `npx jest tests/adapter/openclaw-client.test.ts` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `service-container.ts` compile OK (constructor compatible)
