# Phase 48: OpenClaw Config UI (S48)

> Trang /settings/openclaw để cấu hình + kiểm tra kết nối OpenClaw.

## Files tạo mới
1. `src/app/(dashboard)/settings/openclaw/page.tsx` — config page
2. `src/app/api/openclaw/status/route.ts` — GET health + sessions + models
3. `tests/integration/openclaw-config.test.ts`

## UI Features
- Hiển thị OPENCLAW_API_URL, connection status (🟢/🔴)
- Nút "Test Connection" → healthCheck()
- Danh sách sessions đang chạy
- Danh sách models khả dụng (GET /api/models)
