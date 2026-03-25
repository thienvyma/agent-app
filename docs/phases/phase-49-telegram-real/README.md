# Phase 49: Telegram Real Startup (S49)

> Wire grammY Bot instance với TELEGRAM_BOT_TOKEN thật.

## Files tạo/sửa
1. `src/lib/telegram-startup.ts` — grammY init + command wiring
2. `src/core/channels/telegram-bot.ts` — sửa: add startReal()
3. `src/app/api/telegram/webhook/route.ts` — POST webhook handler
4. `tests/integration/telegram-startup.test.ts`

## Startup flow
- Check TELEGRAM_BOT_TOKEN → skip nếu không có
- Create grammY Bot → wire 7 commands
- Mode: polling (dev) hoặc webhook (production)
