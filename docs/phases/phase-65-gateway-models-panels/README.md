# Phase 65: Gateway + Models Panel Enhancement

> **Session 65** | 3 files | TDD + Extract components
> **Phụ thuộc**: Phase 62 (adapter working), Phase 64 (settings page updated)

---

## Bối Cảnh

### Gateway Panel hiện có (Settings page lines 259-291):
- ✅ Start/Stop/Restart buttons (hoạt động qua CLI)
- ✅ Running/Stopped status badge
- ✅ Error display
- ❌ THIẾU: Logs viewer
- ❌ THIẾU: HTTP endpoint test
- ❌ THIẾU: Dashboard link
- ❌ THIẾU: Port display

### Models Panel hiện có (Settings page lines 293-331):
- ✅ Raw JSON model status display
- ✅ Set model text input
- ❌ THIẾU: Models table (name, context, auth, tags)
- ❌ THIẾU: Test model button
- ❌ THIẾU: Fetch models from provider button

## Files (3)

### 1. [NEW] `tests/components/settings-panels.test.tsx`
Gateway tests:
- Render → shows start/stop/restart buttons + status
- Logs section → display log entries (mocked)
- "Test Endpoints" button → ping results
- "Open Dashboard" → external link

Models tests:
- Table renders model rows (name, ctx, auth, tags)
- "Test Model" → sends test message → shows response/timeout
- "Fetch Models" → HTTP GET to provider → shows dropdown
- Set model input + save → calls API

### 2. [NEW] `src/components/settings/gateway-panel.tsx`
Extract từ Settings page lines 259-291 + thêm:
- **Logs viewer**: scrollable, last 50 lines
- **Endpoint test**: ping `/v1/models`, `/v1/chat/completions`
- **Dashboard link**: `http://127.0.0.1:<port>/`
- **Port display**: from gateway status

### 3. [NEW] `src/components/settings/models-panel.tsx`
Extract từ Settings page lines 293-331 + thêm:
- **Models table**: columns: Model | Input | Context | Local | Auth | Tags
- **Test model**: button → `POST /api/openclaw/agents/chat` hoặc CLI
- **Fetch from provider**: HTTP GET to `http://192.168.1.35:8080/v1/models`
- **Current model badge**: highlight active model

## Kiểm Tra
- [ ] Gateway panel: buttons + logs + endpoint test hoạt động
- [ ] Models panel: table + test + fetch hoạt động
- [ ] Settings page renders mới (extract thành công, không break)
- [ ] `npx jest` → 0 failures
- [ ] `npx tsc --noEmit` → 0 errors
