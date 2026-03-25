# Phase 58 — Realtime SSE Dashboard

## Mục tiêu
Thêm SSE endpoint cho live events + realtime widget trên Activity page.

## Files cần tạo (≤6)

| # | File | Mô tả |
|---|---|---|
| 1 | `tests/integration/realtime-sse-ui.test.ts` | Tests viết TRƯỚC |
| 2 | `src/app/api/events/stream/route.ts` | SSE endpoint |
| 3 | `src/app/(dashboard)/activity/components/realtime-feed.tsx` | Realtime event feed widget |
| 4 | Sửa `src/app/(dashboard)/activity/page.tsx` | Thêm "Live" toggle |

## Tests cần viết
1. SSE route export GET handler
2. SSE route trả đúng headers (text/event-stream)
3. Activity page có "Live" toggle button
4. Realtime feed component render event items

## Dependencies
- `src/core/realtime/realtime-hub.ts` — ĐÃ CÓ (emit/subscribe)
- Activity page — ĐÃ CÓ (timeline + table)

## Ghi Chú Thảo Luận
- SSE route dùng ReadableStream API cho Next.js App Router
- Realtime feed tự động reconnect khi connection drops
