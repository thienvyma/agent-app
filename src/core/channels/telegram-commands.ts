/**
 * TelegramCommands — command router and handler wiring for Telegram bot.
 *
 * Parses incoming text messages into commands + args,
 * routes to the appropriate TelegramBot handler.
 *
 * Supported commands:
 *   /status  — system overview
 *   /agents  — agent list
 *   /task    — create task
 *   /approve — list pending approvals
 *   /reject  — reject an approval
 *   /report  — daily report
 *   /cost    — cost breakdown
 *
 * @module core/channels/telegram-commands
 */

import type { TelegramBot } from "./telegram-bot";

/** Parsed command from message text */
export interface ParsedCommand {
  command: string;
  args: string;
}

/** Command handler result */
export interface CommandResult {
  text: string;
  success: boolean;
}

/**
 * Parse command and arguments from raw message text.
 *
 * @param text - Raw message text (e.g., "/task Do something")
 * @returns Parsed command and args
 */
export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) {
    return { command: trimmed.toLowerCase(), args: "" };
  }
  return {
    command: trimmed.slice(0, spaceIdx).toLowerCase(),
    args: trimmed.slice(spaceIdx + 1).trim(),
  };
}

/** All supported commands */
export const SUPPORTED_COMMANDS = [
  "/status",
  "/agents",
  "/task",
  "/approve",
  "/reject",
  "/report",
  "/cost",
] as const;

/**
 * Route a command to the appropriate bot handler.
 *
 * @param bot - TelegramBot instance
 * @param text - Raw message text
 * @returns Command result with formatted text
 */
export async function routeCommand(
  bot: TelegramBot,
  text: string
): Promise<CommandResult> {
  const { command, args } = parseCommand(text);

  switch (command) {
    case "/status":
      return bot.handleStatus();
    case "/agents":
      return bot.handleAgents();
    case "/task":
      return bot.handleTask(args);
    case "/approve":
      return bot.handleApprove();
    case "/reject":
      return bot.handleReject(args);
    case "/report":
      return bot.handleReport();
    case "/cost":
      return bot.handleCost();
    default:
      return {
        text: `❌ Lệnh không hợp lệ: "${command}"\n\nCác lệnh hỗ trợ:\n${SUPPORTED_COMMANDS.join("\n")}`,
        success: false,
      };
  }
}

/**
 * Format help text listing all commands.
 *
 * @returns Help message
 */
export function getHelpText(): string {
  return [
    "🤖 *Agentic Enterprise Bot*",
    "",
    "Các lệnh:",
    "  /status  — Tổng quan hệ thống",
    "  /agents  — Danh sách agents",
    "  /task <mô tả> — Tạo task mới",
    "  /approve — Danh sách cần duyệt",
    "  /reject <id> — Từ chối approval",
    "  /report  — Báo cáo ngày",
    "  /cost    — Chi phí",
  ].join("\n");
}
