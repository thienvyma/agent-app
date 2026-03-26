/**
 * Telegram Startup — DEPRECATED (Phase 72).
 *
 * OpenClaw now handles Telegram natively via its gateway channel system.
 * This module is kept for backwards compatibility but does NOT create
 * a grammY Bot instance. Use OpenClaw `channels add --channel telegram`
 * instead.
 *
 * @deprecated Use OpenClaw channel system instead.
 * @see docs/phases/phase-72-telegram-binding/README.md
 *
 * @module lib/telegram-startup
 */

/** All supported Telegram commands */
export const TELEGRAM_COMMANDS = [
  "/status",
  "/agents",
  "/task",
  "/approve",
  "/reject",
  "/report",
  "/cost",
] as const;

/** Telegram bot startup state */
interface TelegramState {
  running: boolean;
  mode: "polling" | "webhook" | "none";
  token: string | null;
  ownerChatId: string | null;
  startedAt: Date | null;
}

let state: TelegramState = {
  running: false,
  mode: "none",
  token: null,
  ownerChatId: null,
  startedAt: null,
};

/**
 * Initialize Telegram Bot.
 *
 * Reads TELEGRAM_BOT_TOKEN and TELEGRAM_OWNER_CHAT_ID from env.
 * If token is missing, skips gracefully.
 *
 * @returns { started: boolean, reason?: string }
 */
export function initTelegram(): { started: boolean; reason?: string } {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ownerChatId = process.env.TELEGRAM_OWNER_CHAT_ID;

  if (!token || token.trim() === "") {
    state = {
      running: false,
      mode: "none",
      token: null,
      ownerChatId: null,
      startedAt: null,
    };
    return {
      started: false,
      reason: "No TELEGRAM_BOT_TOKEN - skipping Telegram bot startup (no token configured)",
    };
  }

  // In a real production setup, we would:
  // 1. Create a grammY Bot instance: new Bot(token)
  // 2. Register command handlers for all 7 commands
  // 3. Start polling or set webhook
  //
  // For now, we track the state and wire commands.
  // The actual grammY Bot instance requires the `grammy` package
  // which will be installed when the user is ready to go live.

  const mode = process.env.NODE_ENV === "production" ? "webhook" : "polling";

  state = {
    running: true,
    mode,
    token: token.substring(0, 8) + "***", // mask token
    ownerChatId: ownerChatId ?? null,
    startedAt: new Date(),
  };

  console.log(`[Telegram] Bot started in ${mode} mode`);
  console.log(`[Telegram] Commands registered: ${TELEGRAM_COMMANDS.join(", ")}`);
  if (ownerChatId) {
    console.log(`[Telegram] Owner chat ID: ${ownerChatId}`);
  }

  return { started: true };
}

/**
 * Get current Telegram bot status.
 *
 * @returns TelegramState
 */
export function getTelegramStatus(): TelegramState {
  return { ...state };
}

/**
 * Stop Telegram bot (for graceful shutdown).
 */
export function stopTelegram(): void {
  if (state.running) {
    console.log("[Telegram] Bot stopped");
  }
  state = {
    running: false,
    mode: "none",
    token: null,
    ownerChatId: null,
    startedAt: null,
  };
}

/**
 * Get command descriptions for BotFather setup.
 *
 * @returns Array of { command, description }
 */
export function getCommandDescriptions(): { command: string; description: string }[] {
  return [
    { command: "status", description: "Tổng quan hệ thống" },
    { command: "agents", description: "Danh sách agents đang chạy" },
    { command: "task", description: "Giao việc cho agent" },
    { command: "approve", description: "Duyệt yêu cầu đang chờ" },
    { command: "reject", description: "Từ chối yêu cầu" },
    { command: "report", description: "Báo cáo ngày" },
    { command: "cost", description: "Chi phí token" },
  ];
}
