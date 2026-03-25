/**
 * NotificationService — abstracted notification layer for Telegram and future channels.
 *
 * Handles message formatting and delivery without depending on grammY directly.
 * This makes the notification logic fully testable.
 *
 * Production: sendFn wraps grammY bot.api.sendMessage()
 * Testing: sendFn is a mock that captures messages
 *
 * @module core/channels/notification-service
 */

/** Send function signature (injected) */
type SendFn = (chatId: string, message: string) => Promise<void>;

/** Service configuration */
interface NotificationConfig {
  sendFn: SendFn;
  ownerChatId: string;
}

/** System status data */
interface SystemStatus {
  agentsTotal: number;
  agentsActive: number;
  tasksRunning: number;
  tasksPending: number;
  tokensToday: number;
  pendingApprovals: number;
}

/** Agent info for list formatting */
interface AgentInfo {
  name: string;
  role: string;
  status: string;
}

/** Cost report data */
interface CostReportData {
  totalTokens: number;
  totalCostUSD: number;
  perAgent: { agentId: string; totalTokens: number; estimatedCostUSD: number }[];
}

/** Approval request data */
interface ApprovalData {
  approvalId: string;
  taskDescription: string;
  agentName: string;
  reason: string;
}

/** Budget alert data */
interface BudgetAlertData {
  agentId: string;
  agentName: string;
  usage: number;
  budget: number;
  percentUsed: number;
  status: string;
}

/** Daily report data */
interface DailyReportData {
  date: string;
  tasksCompleted: number;
  tasksFailed: number;
  totalTokens: number;
  totalCostUSD: number;
  topAgent: string;
}

/**
 * Notification service for owner communication.
 * Formats and sends messages via injected send function.
 */
export class NotificationService {
  private readonly sendFn: SendFn;
  private readonly ownerChatId: string;

  constructor(config: NotificationConfig) {
    this.sendFn = config.sendFn;
    this.ownerChatId = config.ownerChatId;
  }

  /**
   * Send a notification message to the owner.
   *
   * @param message - Message text
   */
  async sendNotification(message: string): Promise<void> {
    await this.sendFn(this.ownerChatId, message);
  }

  /**
   * Format system status overview.
   *
   * @param stats - System statistics
   * @returns Formatted status message
   */
  formatStatus(stats: SystemStatus): string {
    return [
      "🏢 *Hệ thống Agentic Enterprise*",
      "",
      `👥 Agents: ${stats.agentsTotal} (${stats.agentsActive} active, ${stats.agentsTotal - stats.agentsActive} idle)`,
      `📋 Tasks: ${stats.tasksRunning + stats.tasksPending} (${stats.tasksRunning} running, ${stats.tasksPending} pending)`,
      `💰 Cost hôm nay: ${stats.tokensToday.toLocaleString()} tokens`,
      `⏳ Pending approvals: ${stats.pendingApprovals}`,
    ].join("\n");
  }

  /**
   * Format agent list with status emojis.
   *
   * @param agents - Array of agent info
   * @returns Formatted agent list
   */
  formatAgentList(agents: AgentInfo[]): string {
    const statusEmoji: Record<string, string> = {
      RUNNING: "🟢",
      IDLE: "⚪",
      ERROR: "🔴",
      DEPLOYING: "🟡",
      PAUSED_BUDGET: "🟠",
    };

    const lines = agents.map((a) => {
      const emoji = statusEmoji[a.status] ?? "⚫";
      return `${emoji} ${a.name} (${a.role}) — ${a.status}`;
    });

    return ["👥 *Danh sách Agents*", "", ...lines].join("\n");
  }

  /**
   * Format cost report breakdown.
   *
   * @param report - Cost report data
   * @returns Formatted cost message
   */
  formatCostReport(report: CostReportData): string {
    const lines = report.perAgent.map(
      (a) => `  • ${a.agentId}: ${a.totalTokens.toLocaleString()} tokens ($${a.estimatedCostUSD.toFixed(3)})`
    );

    return [
      "💰 *Cost Report*",
      "",
      `Total: ${report.totalTokens.toLocaleString()} tokens ($${report.totalCostUSD.toFixed(3)})`,
      "",
      "Per agent:",
      ...lines,
    ].join("\n");
  }

  /**
   * Format approval request message.
   *
   * @param data - Approval data
   * @returns Formatted approval message
   */
  formatApprovalRequest(data: ApprovalData): string {
    return [
      "⏳ *Cần phê duyệt*",
      "",
      `📋 Task: ${data.taskDescription}`,
      `🤖 Agent: ${data.agentName}`,
      `📝 Lý do: ${data.reason}`,
      `🔑 ID: ${data.approvalId}`,
      "",
      "Chọn hành động: [Duyệt] [Sửa] [Từ chối]",
    ].join("\n");
  }

  /**
   * Send approval request to owner.
   *
   * @param data - Approval data
   */
  async sendApprovalRequest(data: ApprovalData): Promise<void> {
    const message = this.formatApprovalRequest(data);
    await this.sendFn(this.ownerChatId, message);
  }

  /**
   * Send budget alert to owner.
   *
   * @param data - Budget alert data
   */
  async sendBudgetAlert(data: BudgetAlertData): Promise<void> {
    const icon = data.status === "exceeded" ? "🚨" : "⚠️";
    const statusText = data.status === "exceeded" ? "VƯỢT NGÂN SÁCH" : "Cảnh báo ngân sách";

    const message = [
      `${icon} *${statusText}*`,
      "",
      `🤖 Agent: ${data.agentName}`,
      `📊 Sử dụng: ${data.usage.toLocaleString()} / ${data.budget.toLocaleString()} tokens`,
      `📈 Tỷ lệ: ${data.percentUsed}%`,
    ].join("\n");

    await this.sendFn(this.ownerChatId, message);
  }

  /**
   * Send daily report to owner.
   *
   * @param data - Daily report data
   */
  async sendDailyReport(data: DailyReportData): Promise<void> {
    const message = [
      `📊 *Báo cáo ngày ${data.date}*`,
      "",
      `✅ Tasks hoàn thành: ${data.tasksCompleted}`,
      `❌ Tasks thất bại: ${data.tasksFailed}`,
      `💰 Tổng tokens: ${data.totalTokens.toLocaleString()}`,
      `💵 Chi phí: $${data.totalCostUSD.toFixed(3)}`,
      `🏆 Agent nổi bật: ${data.topAgent}`,
    ].join("\n");

    await this.sendFn(this.ownerChatId, message);
  }
}
