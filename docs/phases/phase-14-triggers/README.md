# Phase 14: External Triggers (S14)

> Tru cot 2: Event-Driven 24/7 - He thong tu kich hoat

---

## Muc tieu
TriggerRegistry + WebhookHandler + ScheduleTrigger.
He thong KHONG CHI doi owner nhan tin ma tu dong lam viec.

## Vi du triggers
- Email khach hang toi -> tu dong phan tich + tao task
- Cron 9h sang -> agent gui bao cao ngay
- Webhook tu Shopify -> don hang moi -> agent xu ly
- API call tu ben ngoai -> trigger specific agent

## Files tao moi

### 1. src/core/triggers/trigger-registry.ts
class TriggerRegistry:
  - constructor(db: PrismaClient, messageBus: MessageBus)
  - async register(trigger: TriggerConfig): string (triggerId)
  - async unregister(triggerId: string): void
  - async list(): TriggerConfig[]
  - async fire(triggerId: string, payload: any): void
    1. Find trigger config
    2. Route to target agent via messageBus
    3. Log to AuditLog

### 2. src/core/triggers/webhook-handler.ts
  Next.js API route: POST /api/webhooks/:triggerId
  1. Validate webhook (secret/signature)
  2. Parse payload
  3. triggerRegistry.fire(triggerId, payload)

### 3. src/core/triggers/schedule-trigger.ts
class ScheduleTrigger:
  - constructor(registry: TriggerRegistry)
  - async startAll(): void
    Load all cron triggers -> setup node-cron jobs
  - async addSchedule(cron: string, triggerId: string): void
  - async removeSchedule(triggerId: string): void

## CLI: ae trigger list, ae trigger add --type cron|webhook "config"

## Kiem tra
1. Webhook POST -> correct agent receives payload
2. Cron 9h -> agent triggered
3. Invalid webhook secret -> rejected

## Dependencies: Phase 13 (MessageBus)
## Lien quan: PRD F6 External triggers, D2 Event-Driven 24/7
