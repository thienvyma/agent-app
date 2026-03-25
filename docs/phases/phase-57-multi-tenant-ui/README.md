# Phase 57 — Multi-Tenant Company Management UI

## Mục tiêu
Mở rộng Settings → Company thành multi-tenant CRUD, sử dụng `/api/company` API đã có.

## Files cần tạo (≤6)

| # | File | Mô tả |
|---|---|---|
| 1 | `tests/integration/multi-tenant-ui.test.ts` | Tests viết TRƯỚC |
| 2 | `src/app/(dashboard)/settings/companies/page.tsx` | Multi-tenant UI component (ĐÃ TẠO, cần sửa theo TDD) |
| 3 | Sửa `src/app/(dashboard)/settings/page.tsx` | Thêm "Companies" tab |

## Tests cần viết
1. `/api/company` GET trả về data
2. `/api/company` POST tạo company mới
3. Settings page có tab "Companies"
4. Companies page fetch từ `/api/company`

## Dependencies
- `/api/company/route.ts` — ĐÃ CÓ (GET/POST)
- `src/core/tenant/tenant-manager.ts` — ĐÃ CÓ
- Settings page — ĐÃ CÓ (4 tabs)

## Ghi Chú Thảo Luận
- Companies page đã tạo trước (vi phạm TDD), cần verify lại
