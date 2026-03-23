# Phase 14: External Triggers (S14)

> Tru cot 2: Event-Driven 24/7 - He thong tu kich hoat
> Khong chi doi owner nhan tin - tu dong lam viec khi co event

---

## Muc tieu
TriggerRegistry + WebhookHandler + ScheduleTrigger.

## Vi du triggers thuc te

1. EMAIL TRIGGER: Email moi tu khach hang toi inbox
   -> He thong parse email -> tao task cho Agent CSKH
   -> Agent tra loi tu dong (hoac draft + gui owner duyet)

2. CRON TRIGGER: Moi ngay 9h sang
   -> Agent Finance tu dong pull so lieu ban hang
   -> Tao bao cao -> gui qua Telegram cho owner

3. WEBHOOK TRIGGER: Don hang moi tu Shopify webhook
   -> He thong parse don hang data
   -> Agent Sales xu ly logistic + update inventory

4. API TRIGGER: Call tu ben ngoai (partner API)
   -> Trigger specific agent voi payload

## Architecture

`
External Event (email/webhook/cron)
        |
        v
  TriggerRegistry (lookup trigger config)
        |
        v
  TriggerRouter (map trigger -> target agent)
        |
        v
  MessageBus.publish (giao viec cho agent)
`

## Files tao moi

### 1. src/core/triggers/trigger-registry.ts
class TriggerRegistry:
  - constructor(db: PrismaClient, messageBus: MessageBus)
  - async register(trigger: TriggerConfig): string (triggerId)
    1. Validate config (type, target agent, schedule/webhook URL)
    2. Save to DB
    3. If type=cron -> activateSchedule()
    4. Return triggerId
  - async unregister(triggerId: string): void
    1. If cron -> deactivateSchedule()
    2. Remove from DB
  - async list(filter?: { type?, active? }): TriggerConfig[]
  - async fire(triggerId: string, payload: any): void
    1. Load trigger config
    2. Build message from payload + trigger template
    3. messageBus.publish() to target agent
    4. Log to AuditLog
  - async getStats(): { total, byType, lastFired }

interface TriggerConfig:
  id: string
  name: string
  type: "webhook" | "cron" | "email" | "api"
  targetAgentId: string
  config: {
    cronExpression?: string    // "0 9 * * *"
    webhookSecret?: string     // for validation
    emailFilter?: string       // "from:customer@..."
    messageTemplate: string    // "New order: {{payload.orderId}}"
  }
  active: boolean
  lastFired?: Date

### 2. src/core/triggers/webhook-handler.ts
Next.js API route: POST /api/webhooks/:triggerId
  1. Load trigger config by triggerId
  2. Validate webhook (secret in header vs config)
  3. Parse request body as payload
  4. triggerRegistry.fire(triggerId, payload)
  5. Return 200 OK (or 401 if invalid signature)

Security:
  - HMAC signature validation (secret-based)
  - IP whitelist (optional)
  - Rate limiting: 10 calls/minute per trigger
  - Payload size limit: 1MB

### 3. src/core/triggers/schedule-trigger.ts
class ScheduleTrigger:
  - constructor(registry: TriggerRegistry)
  - async startAll(): void
    1. Load all active cron triggers from registry
    2. For each: setup node-cron job -> fire trigger on schedule
  - async addSchedule(triggerId: string, cronExpression: string): void
    Validate cron expression + add to scheduler
  - async removeSchedule(triggerId: string): void
  - async listActive(): { triggerId, cron, nextRun }[]

Cron examples:
  "0 9 * * *"      -> 9h sang moi ngay
  "0 9 * * 1"      -> 9h sang moi thu 2 (weekly report)
  "*/30 * * * *"    -> moi 30 phut (health check)
  "0 18 * * 5"      -> 6h chieu thu 6 (weekly summary)

## CLI bo sung:
  ae trigger list -> table of all triggers (name, type, target, last fired)
  ae trigger add --type cron --name "Daily Report" --agent finance-id --cron "0 9 * * *"
  ae trigger add --type webhook --name "Shopify Orders" --agent sales-id --secret "abc123"
  ae trigger remove <triggerId>
  ae trigger fire <triggerId> --payload '{"test": true}'  (manual test)

## Kiem tra
1. Register cron trigger -> fires at scheduled time
2. POST webhook -> correct agent receives payload
3. Invalid webhook secret -> 401 rejected
4. ae trigger list -> shows all registered triggers
5. Manual fire: ae trigger fire -> agent receives message

## Edge Cases
- Cron job overlap (previous run chua xong) -> queue, khong skip
- Webhook flood (DDoS) -> rate limiting
- Invalid cron expression -> clear error at registration
- Target agent not deployed -> queue message, fire khi agent online
- Server restart -> reload all cron schedules

## Dependencies: Phase 13 (MessageBus for routing)
## Lien quan: PRD F6 External triggers, D2 Event-Driven 24/7
