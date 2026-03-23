# Phase 20: Telegram Bot (S20)

> Tru cot 2: Tram Giao tiep Da kenh - Telegram la kenh giao tiep CHINH
> Owner dieu hanh TOAN BO cong ty qua Telegram.

---

## Muc tieu

grammY bot + 6 commands + inline keyboards cho approval + auto-notifications.
Day la cau noi giua owner va he thong AI.

## Tai sao Telegram la kenh chinh?

Theo PRD User Persona: "Tuong tac qua Telegram (chinh) + Web Dashboard (phu) + CLI (dev)"
- Owner khong can ngoi truoc may -> dieu hanh qua dien thoai
- Inline keyboards = 1-tap approval (khong can go lenh)
- Auto-notifications = bao cao tu dong, khong can hoi

## Architecture

Owner Phone (Telegram)
    |
    v
grammY Bot (webhook/polling)
    |
    v
Command Router
    |--- /status  --> SystemOverview
    |--- /agents  --> AgentOrchestrator.listAgents()
    |--- /task    --> CEO Agent -> TaskDecomposer
    |--- /approve --> ApprovalQueue (inline keyboards)
    |--- /report  --> Generate daily/weekly report
    |--- /cost    --> CostTracker.getReport()

Auto-Notifications:
    Agent hoan thanh task --> Bot.sendNotification(owner)
    Agent gap loi --> Bot.sendAlert(owner)
    Approval can duyet --> Bot.sendApprovalRequest(owner) + inline keyboard
    Budget vuot nguong --> Bot.sendBudgetAlert(owner)

## Files tao moi

### 1. src/core/channels/telegram-bot.ts

class TelegramBot:
  - constructor(token: string, dependencies: BotDependencies)
  - async start(): void
    1. Register all commands
    2. Start polling (dev) or webhook (prod)
  - async stop(): void
  - async sendNotification(chatId: string, message: string): void
  - async sendApprovalRequest(chatId: string, task: Task): void
    1. Format task details
    2. Attach inline keyboard [Duyet] [Sua] [Tu choi]
    3. Save telegramMsgId to ApprovalRequest
  - async sendDailyReport(chatId: string): void
    1. Collect stats: tasks completed, agents active, cost spent
    2. Format as readable message
    3. Send

interface BotDependencies:
  orchestrator: AgentOrchestrator
  taskEngine: TaskEngine  (Phase 9)
  approvalQueue: ApprovalQueue (Phase 15)
  costTracker: CostTracker (Phase 18)
  messageBus: MessageBus (Phase 13)

### 2. src/core/channels/telegram-commands.ts

Command handlers:

/status:
  1. Get system overview (agents count, active tasks, pending approvals)
  2. Format:
     "He thong Agentic Enterprise
      Agents: 5 (3 active, 2 idle)
      Tasks: 12 (5 running, 3 pending approval)
      Cost hom nay: 1,234 tokens
      Alerts: 0"

/agents:
  1. orchestrator.listAgents()
  2. Format each agent: name, role, status emoji
     "CEO - Running
      Marketing - Idle
      Finance - Running"

/task <description>:
  1. Forward to CEO agent
  2. CEO -> TaskDecomposer -> delegate
  3. Reply: "Da gui cho CEO. Dang xu ly..."
  4. When done -> auto-notify result

/approve:
  1. approvalQueue.getPending()
  2. Format each pending item with inline keyboard
  3. If empty: "Khong co task nao can duyet"

/report [daily|weekly]:
  1. Generate report: completed tasks, pending, errors, cost
  2. Format readable summary

/cost:
  1. costTracker.getReport()
  2. Format: per-agent usage, total, budget remaining

### 3. src/core/channels/telegram-keyboards.ts

Inline keyboards cho approval:

function createApprovalKeyboard(approvalId: string):
  InlineKeyboard()
    .text("Duyet gui", "approve:" + approvalId)
    .text("Sua lai", "modify:" + approvalId)
    .text("Tu choi", "reject:" + approvalId)

Callback query handler:
  bot.on("callback_query", async (ctx) => {
    const [action, approvalId] = ctx.callbackQuery.data.split(":")
    switch(action):
      "approve" -> approvalEngine.approve(approvalId)
                -> ctx.editMessageText("Da duyet!")
      "modify"  -> ctx.reply("Nhap sua doi:")
                -> wait for next message -> approvalEngine.modify(approvalId, text)
      "reject"  -> approvalEngine.reject(approvalId)
                -> ctx.editMessageText("Da tu choi.")
  })

### 4. tests/channels/telegram.test.ts
- Test /status command: mock dependencies -> verify response format
- Test /task command: verify CEO agent receives message
- Test approval keyboard: click "approve" -> ApprovalEngine.approve() called
- Test auto-notification: agent complete task -> bot sends message
- Test /cost: verify CostTracker.getReport() called + formatted

## Dependencies
- Phase 7: AgentOrchestrator
- Phase 9: TaskEngine (TaskDecomposer)
- Phase 13: MessageBus
- Phase 15: ApprovalEngine + ApprovalQueue
- Phase 18: CostTracker
- Telegram Bot Token (env: TELEGRAM_BOT_TOKEN)
- Telegram Owner Chat ID (env: TELEGRAM_OWNER_CHAT_ID)

## Kiem tra
1. /status -> nhan response co stats
2. /task "Lap bao gia du an X" -> CEO nhan va xu ly
3. Agent gui approval request -> owner nhan inline keyboard
4. Click [Duyet] -> task duoc approve + notification
5. Cuoi ngay -> tu dong gui bao cao

## Edge Cases
- Owner gui nhieu /task lien tiep -> queue khong bi mat
- Telegram API rate limit (30 msg/second) -> throttle
- Bot crash -> graceful restart + resume pending
- Long message -> split into multiple (Telegram limit 4096 chars)
- Approval da resolve -> click button -> "Da xu ly truoc do"

## Env Variables
  TELEGRAM_BOT_TOKEN=bot123456:ABC...
  TELEGRAM_OWNER_CHAT_ID=123456789

## Lien quan
- PRD: F8 Telegram Bot, F4 Approval Workflow, F6 Communication
- Decisions: D4 HITL Approval
- Phase truoc: P7, P9, P13, P15, P18
- Phase sau: P25 (E2E testing)
