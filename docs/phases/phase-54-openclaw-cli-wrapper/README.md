# Phase 54 — OpenClaw CLI Wrapper

## Mục tiêu
Indirect config management cho OpenClaw qua CLI commands — KHÔNG sửa file config trực tiếp.

## Files đã tạo

| # | File | Mô tả |
|---|---|---|
| 1 | `src/lib/openclaw-cli.ts` | CLI executor: 14 functions wrapping `openclaw` binary |
| 2 | `src/app/api/openclaw/config/route.ts` | Config GET/POST/DELETE via `config get/set/unset` |
| 3 | `src/app/api/openclaw/gateway/route.ts` | Gateway status/start/stop/restart |
| 4 | `src/app/api/openclaw/models/route.ts` | Models list/status/set |
| 5 | `src/app/api/openclaw/auth/route.ts` | Provider API key management |
| 6 | `src/app/api/openclaw/doctor/route.ts` | Doctor fix (auto-fix config) |

## Files bổ sung
- `src/app/api/openclaw/update/route.ts` — Version + update
- `src/app/(dashboard)/settings/openclaw/page.tsx` — Settings UI 5 sections
- `tests/integration/openclaw-cli-wrapper.test.ts` — 18 tests

## Nguyên tắc thiết kế
- Mọi thao tác qua `openclaw` CLI binary (execFile)
- KHÔNG đọc/ghi file config trực tiếp
- OpenClaw vẫn có thể update chính chủ bình thường
- Timeout 30s mặc định, 120s cho update

## Session: 54
## Status: ✅ Completed
