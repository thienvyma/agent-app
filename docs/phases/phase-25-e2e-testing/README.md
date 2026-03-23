# Phase 25: End-to-End Testing (S25)

## Muc tieu
Full E2E test: toan bo flow tu dau den cuoi.

## Session 25
- Files: tests/e2e/full-flow.test.ts, tests/e2e/helpers.ts
- Flow test:
  1. Create company + departments
  2. Create agents (CEO, Marketing, Finance)
  3. Deploy agents via OpenClaw adapter
  4. Owner gui /task qua Telegram
  5. CEO nhan lenh -> TaskDecomposer chia nho
  6. Delegate cho Marketing + Finance
  7. Marketing hoan thanh -> gui approval
  8. Owner approve qua Telegram inline keyboard
  9. Dashboard hien thi ket qua dung
  10. Cost tracking ghi nhan token usage
- Fix all bugs found during E2E
- Test: entire flow chay end-to-end khong loi

## Lien quan PRD: Tat ca features F1-F11
