# Phase 56 — Pipeline Execution Viewer

## Mục tiêu
Thêm Pipeline tab vào Agent Detail page — hiển thị 7 bước execution pipeline.

## Files đã tạo

| # | File | Mô tả |
|---|---|---|
| 1 | `src/app/(dashboard)/agents/components/pipeline-viewer.tsx` | Pipeline execution viewer component |
| 2 | Sửa `src/app/(dashboard)/agents/[id]/page.tsx` | Thêm "Pipeline" tab (4th) |

## Pipeline 7 Steps
1. **Approval Check** — ApprovalPolicy evaluate
2. **Context Build** — ContextBuilder inject memory/knowledge
3. **Engine Execute** — IAgentEngine.sendMessage (real API call)
4. **Cost Tracking** — CostTracker count tokens
5. **Budget Check** — BudgetManager verify limits
6. **Conversation Log** — ConversationLogger save to memory
7. **Message Publish** — MessageBus broadcast to subscribers

## UI Features
- Test message input + Execute button
- Step-by-step animated progress (running/done/error status)
- Real API call at step 3 (POST `/api/agents/[id]/chat`)
- Duration display per step
- Response panel showing result

## Dependencies
- `src/core/orchestrator/agent-pipeline.ts`
- `POST /api/agents/[id]/chat`

## Session: 56
## Status: ✅ Completed
