# Phase 14: External Triggers (S14)

## Tru cot 2: Event-Driven 24/7 Operation

## Muc tieu
TriggerRegistry + WebhookHandler + ScheduleTrigger.
He thong tu kich hoat khi co event ben ngoai.

## Session 14
- Files: trigger-registry.ts, webhook-handler.ts, schedule-trigger.ts, tests/
- TriggerRegistry: dang ky va quan ly tat ca triggers
- WebhookHandler: nhan webhook tu email, API ben ngoai -> kich hoat agent
- ScheduleTrigger: cron jobs (VD: 9h sang moi ngay -> agent gui bao cao)
- CLI: ae trigger list, ae trigger add --type cron "0 9 * * *"
- Test: webhook arrives -> dung agent duoc kich hoat

## Lien quan PRD: F6 External triggers (email, webhooks, cron)
