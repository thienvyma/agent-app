# Phase 52 — Engine Wiring

## Mục tiêu
Wire `engine.deploy()` vào POST `/api/agents` và fix chat response field mismatch.

## Files đã tạo/sửa

| # | File | Mô tả |
|---|---|---|
| 1 | `src/app/api/agents/route.ts` | Thêm `engine.deploy()` call sau khi Prisma tạo agent |
| 2 | `src/app/api/agents/[id]/chat/route.ts` | Fix response field: `response` → `message` |

## Kết quả
- POST `/api/agents` tạo agent trong DB rồi deploy lên engine ngay lập tức
- Chat API trả đúng field cho frontend
- `isAlwaysOn` property được truyền đầy đủ

## Dependencies
- `src/lib/engine-singleton.ts` (S46)
- `src/core/adapter/i-agent-engine.ts`

## Session: 52
## Status: ✅ Completed
