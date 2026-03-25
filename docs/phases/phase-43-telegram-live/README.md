# Phase 43: Telegram Bot Live (S43)

> Ket noi TelegramBot voi Telegram API that.
> Owner nhan thong bao + ra lenh qua Telegram.

## Yeu cau
- TELEGRAM_BOT_TOKEN tu @BotFather
- TELEGRAM_OWNER_CHAT_ID tu @userinfobot

## Tasks
1. Bot start → listen tren Telegram
2. Owner gui lenh → bot xu ly:
   - `/status` → system status
   - `/agents` → list agents
   - `/task <description>` → create task
   - `/approve <id>` → approve task
   - `/reject <id>` → reject task
   - `/report` → daily report
3. Bot gui thong bao khi:
   - Agent crash → "[URGENT] CEO Agent crashed, restarting..."
   - Budget warning → "[WARNING] 80% budget used"
   - Approval needed → "[APPROVAL] Task #123 needs review"
   - Daily report 17:00

## Files tao moi/sua
1. `src/core/channels/telegram-bot.ts` — verify + wire real API
2. `src/core/channels/telegram-commands.ts` — command handlers
3. `tests/integration/telegram-live.test.ts`
