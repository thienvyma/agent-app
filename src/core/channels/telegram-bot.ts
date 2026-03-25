/**
 * TelegramBot — grammY-based bot for owner communication.
 *
 * 6 commands:
 * /status  — system overview
 * /agents  — agent list with status
 * /task    — forward task to CEO agent
 * /approve — pending approvals
 * /report  — daily/weekly summary
 * /cost    — cost breakdown
 *
 * Auto-notifications via RealtimeHub subscription.
 *
 * @module core/channels/telegram-bot
 */

import type { NotificationService } from "@/core/channels/notification-service";

/** Bot dependencies (injected) */
export interface BotDependencies {
  notificationService: NotificationService;
  getStatus: () => Promise<{
    agentsTotal: number;
    agentsActive: number;
    tasksRunning: number;
    tasksPending: number;
    tokensToday: number;
    pendingApprovals: number;
  }>;
  getAgents: () => Promise<{ name: string; role: string; status: string }[]>;
  getCostReport: () => { totalTokens: number; totalCostUSD: number; perAgent: { agentId: string; totalTokens: number; estimatedCostUSD: number }[] };
  sendTask: (description: string) => Promise<string>;
  getPendingApprovals: () => Promise<{ approvalId: string; taskDescription: string; agentName: string; reason: string }[]>;
}

/** Command handler result */
interface CommandResult {
  text: string;
  success: boolean;
}

/**
 * Telegram bot command router.
 *
 * In production: wraps grammY bot instance.
 * For testing: command methods return formatted text.
 */
export class TelegramBot {
  private readonly deps: BotDependencies;
  private running = false;

  constructor(deps: BotDependencies) {
    this.deps = deps;
  }

  /**
   * Handle /status command.
   *
   * @returns Formatted system status
   */
  async handleStatus(): Promise<CommandResult> {
    try {
      const stats = await this.deps.getStatus();
      const text = this.deps.notificationService.formatStatus(stats);
      return { text, success: true };
    } catch (error) {
      return {
        text: `❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`,
        success: false,
      };
    }
  }

  /**
   * Handle /agents command.
   *
   * @returns Formatted agent list
   */
  async handleAgents(): Promise<CommandResult> {
    try {
      const agents = await this.deps.getAgents();
      const text = this.deps.notificationService.formatAgentList(agents);
      return { text, success: true };
    } catch (error) {
      return {
        text: `❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`,
        success: false,
      };
    }
  }

  /**
   * Handle /task command.
   *
   * @param description - Task description
   * @returns Confirmation message
   */
  async handleTask(description: string): Promise<CommandResult> {
    if (!description.trim()) {
      return { text: "❌ Cần mô tả task. Ví dụ: /task Lập báo giá dự án X", success: false };
    }

    try {
      const taskId = await this.deps.sendTask(description);
      return {
        text: `✅ Đã gửi cho CEO Agent.\n📋 Task ID: ${taskId}\n⏳ Đang xử lý...`,
        success: true,
      };
    } catch (error) {
      return {
        text: `❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`,
        success: false,
      };
    }
  }

  /**
   * Handle /approve command.
   *
   * @returns Pending approvals list
   */
  async handleApprove(): Promise<CommandResult> {
    try {
      const pending = await this.deps.getPendingApprovals();
      if (pending.length === 0) {
        return { text: "✅ Không có task nào cần duyệt", success: true };
      }

      const lines = pending.map((p) =>
        this.deps.notificationService.formatApprovalRequest(p)
      );

      return { text: lines.join("\n---\n"), success: true };
    } catch (error) {
      return {
        text: `❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`,
        success: false,
      };
    }
  }

  /**
   * Handle /cost command.
   *
   * @returns Formatted cost report
   */
  handleCost(): CommandResult {
    try {
      const report = this.deps.getCostReport();
      const text = this.deps.notificationService.formatCostReport(report);
      return { text, success: true };
    } catch (error) {
      return {
        text: `❌ Lỗi: ${error instanceof Error ? error.message : "Unknown"}`,
        success: false,
      };
    }
  }

  /**
   * Check if bot is running.
   *
   * @returns true if bot is started
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Start the bot (polling mode for development).
   * In production: switch to webhook mode.
   */
  async start(): Promise<void> {
    this.running = true;
  }

  /**
   * Stop the bot gracefully.
   */
  async stop(): Promise<void> {
    this.running = false;
  }
}
