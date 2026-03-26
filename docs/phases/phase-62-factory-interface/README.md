# Phase 62: Update Factory + Interface + Container

> **Session 62** | 3 files | Modify only (no new files)
> **Phụ thuộc**: Phase 61 (adapter rewritten)

---

## Bối Cảnh

### `adapter-factory.ts` (96 dòng)
- `createWithFallback()` gọi `healthCheck()` → fail vì adapter cũ gọi `/api/status`
- Sau Phase 61, adapter mới dùng `client.healthCheck()` → cần update factory logic

### `i-agent-engine.ts` (94 dòng)
- JSDoc references: `/api/sessions`, `/api/agents`, `/api/status` — tất cả fake
- `sendMessage()` signature đã có `context?: string` ✅

### `service-container.ts` (137 dòng)
- Line 62: `new OpenClawAdapter(new OpenClawClient(openclawUrl))`
- Nếu constructor ko đổi → chỉ cần verify compile
- Nếu đổi → update constructor call

## Files (3)

### 1. [MODIFY] `src/core/adapter/adapter-factory.ts`
- `createWithFallback()`: log warn khi fallback MockAdapter (hiện silent)
- Verify `healthCheck()` hoạt động với adapter mới
- Default URL: giữ `http://localhost:18789`

### 2. [MODIFY] `src/core/adapter/i-agent-engine.ts`
- Xoá JSDoc references: `/api/sessions`, `/api/agents`, `/api/status`
- Thêm: "CLI for management, HTTP /v1/chat/completions for chat"
- Update `@see` → `docs/openclaw-integration.md` (sẽ update ở phase sau)

### 3. [MODIFY] `src/lib/service-container.ts`
- Verify `new OpenClawAdapter(new OpenClawClient(openclawUrl))` compile OK
- Update comments nếu cần

## Kiểm Tra
- [ ] `npx jest tests/adapter` → 0 failures (cả client + adapter tests)
- [ ] `npx jest` full → 0 regressions
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `service-container.ts` + `engine-singleton.ts` compile OK
