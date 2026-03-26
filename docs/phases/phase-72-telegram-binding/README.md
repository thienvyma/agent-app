# Phase 72: Telegram — Fix + 1-Bot CEO Routing

> **Session**: S72
> **Depends on**: Phase 67 (per-agent sessions)
> **Priority**: 🔴 HIGH

---

## Architecture Decision: Cách A — 1 Bot + CEO Default

```
Owner nhắn Telegram DM
  → OpenClaw Gateway (routing)
  → CEO Agent (agent:ceo:main)  ← default binding
  → CEO sessions_spawn → Marketing / Developer / Finance
  → CEO tổng hợp → reply Telegram
```

### Config Target
```json
{
  "agents": {
    "list": [
      { "id": "ceo", "workspace": "~/.openclaw/workspace-ceo", "default": true },
      { "id": "developer", "workspace": "~/.openclaw/workspace-developer" },
      { "id": "finance", "workspace": "~/.openclaw/workspace-finance" },
      { "id": "marketing", "workspace": "~/.openclaw/workspace-marketing" }
    ]
  },
  "bindings": [
    { "agentId": "ceo", "match": { "channel": "telegram", "accountId": "default" } }
  ],
  "channels": {
    "telegram": {
      "enabled": true,
      "botToken": "<from BotFather>",
      "dmPolicy": "pairing",
      "streaming": "partial",
      "customCommands": [
        { "command": "status", "description": "System overview" },
        { "command": "task", "description": "Giao việc cho CEO" },
        { "command": "report", "description": "Báo cáo ngày" },
        { "command": "cost", "description": "Chi phí token" }
      ]
    }
  }
}
```

## Bugs Cần Fix

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | Dead code `telegram-startup.ts` | L71-78 comment stub | Deprecate → đọc trạng thái từ OpenClaw |
| 2 | Sai pairing args | `api/telegram/route.ts` L81, L223 | Thêm `"telegram"` argument |
| 3 | Không register agents.list | `openclaw.json` | Phase 67 tạo agents → Phase 72 bind CEO |
| 4 | Commands không kết nối | `telegram-bot.ts` | Convert → `customCommands` config |

## Files Cần Sửa (≤6)

### 1. `tests/channels/telegram-integration.test.ts` (NEW)
- Test: pairing args đúng
- Test: CEO binding created
- Test: custom commands registered

### 2. `src/app/api/telegram/route.ts` (MODIFY)
- Fix pairing CLI: `["pairing", "list", "telegram"]`, `["pairing", "approve", "telegram", code]`
- Start action: thêm CEO binding + custom commands registration
- Add `bind` action: `openclaw agents bind --agent ceo --bind telegram`

### 3. `src/lib/openclaw-cli.ts` (MODIFY)
- Add `agentBind(agentId, channel)`, `agentUnbind(agentId, channel)`, `agentBindings()`

### 4. `src/lib/telegram-startup.ts` (DEPRECATE)
- Mark deprecated, redirect to `openclaw channels status`

### 5. `src/app/(dashboard)/settings/telegram/page.tsx` (MODIFY)
- Show: hiện CEO agent đang handle Telegram DMs
- Add: agent binding display

### 6. `src/core/channels/telegram-bot.ts` (MODIFY)
- Convert 7 command handlers → input cho `customCommands` config
- CEO SKILL.md includes command handling instructions

## Verification
```
□ Save token → Start Bot → /start → pairing code appears
□ Approve pairing → send message → CEO agent responds
□ CEO can delegate via sessions_spawn
□ openclaw agents bindings → CEO bound to telegram
□ Custom commands appear in bot menu
```
