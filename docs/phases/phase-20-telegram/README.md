# Phase 20: Telegram Bot (S20)

## Tru cot 2: Tram Giao tiep Da kenh

## Muc tieu
grammY bot + 6 commands + inline keyboards + auto-notifications.
Owner dieu hanh cong ty qua Telegram.

## Session 20
- Files: telegram-bot.ts, telegram-commands.ts, telegram-keyboards.ts, tests/
- Commands:
  /status -> tong quan he thong
  /agents -> danh sach agents + trang thai
  /task description -> giao viec cho CEO -> CEO delegate
  /approve -> xem pending approvals
  /report -> bao cao ngay/tuan
  /cost -> chi phi token
- Inline keyboards: [Duyet] [Sua] [Tu choi] cho approval
- Auto-notifications: agent hoan thanh task -> gui ket qua
- Webhook Gateway: nhan tin nhan -> parse -> chuyen lenh den dung Agent
- Test: owner gui /task -> agent execute -> ket qua return

## Lien quan PRD: F8 Telegram Bot, F4 Approval buttons, D4 HITL
