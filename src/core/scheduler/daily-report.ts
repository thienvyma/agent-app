/**
 * DailyReportGenerator — aggregates stats and formats reports.
 *
 * BUILD: OpenClaw does NOT have reporting logic.
 * Generates summary from tasks, costs, corrections, approvals.
 *
 * @module core/scheduler/daily-report
 */

/** Per-agent stats */
interface AgentDayStats {
  agentId: string;
  name: string;
  tasksCompleted: number;
  tokensUsed: number;
}

/** Report generation input */
interface ReportInput {
  tasksCompleted: number;
  tasksFailed: number;
  tasksPending: number;
  totalTokens: number;
  approvals: { pending: number; approved: number; rejected: number };
  corrections: number;
  agentStats: AgentDayStats[];
}

/** Generated daily report */
interface DailyReport {
  date: string;
  summary: string;
  tasksCompleted: number;
  tasksFailed: number;
  tasksPending: number;
  totalTokens: number;
  approvals: { pending: number; approved: number; rejected: number };
  corrections: number;
  agentStats: AgentDayStats[];
}

/**
 * Generates and formats daily/weekly reports.
 */
export class DailyReportGenerator {
  /**
   * Generate a daily report from aggregated stats.
   *
   * @param input - Stats data
   * @returns Formatted daily report
   */
  generate(input: ReportInput): DailyReport {
    const totalTasks = input.tasksCompleted + input.tasksFailed + input.tasksPending;
    const successRate = totalTasks > 0
      ? Math.round((input.tasksCompleted / totalTasks) * 100)
      : 0;

    return {
      date: new Date().toISOString().split("T")[0]!,
      summary: `${input.tasksCompleted}/${totalTasks} tasks done (${successRate}% success), ${input.totalTokens} tokens used, ${input.corrections} corrections`,
      tasksCompleted: input.tasksCompleted,
      tasksFailed: input.tasksFailed,
      tasksPending: input.tasksPending,
      totalTokens: input.totalTokens,
      approvals: input.approvals,
      corrections: input.corrections,
      agentStats: input.agentStats,
    };
  }

  /**
   * Format report for Telegram message (emoji + compact).
   *
   * @param report - Daily report
   * @returns Telegram-formatted text
   */
  formatForTelegram(report: DailyReport): string {
    const lines: string[] = [
      `📊 *Daily Report — ${report.date}*`,
      ``,
      `✅ Tasks: ${report.tasksCompleted} done | ❌ ${report.tasksFailed} failed | ⏳ ${report.tasksPending} pending`,
      `🔢 Tokens: ${report.totalTokens}`,
      `📝 Approvals: ✅${report.approvals.approved} ❌${report.approvals.rejected} ⏳${report.approvals.pending}`,
      `🧠 Corrections: ${report.corrections}`,
    ];

    if (report.agentStats.length > 0) {
      lines.push(``);
      lines.push(`👥 *Agent Performance:*`);
      for (const agent of report.agentStats) {
        lines.push(`  • ${agent.name}: ${agent.tasksCompleted} tasks, ${agent.tokensUsed} tokens`);
      }
    }

    lines.push(``);
    lines.push(`💡 ${report.summary}`);

    return lines.join("\n");
  }
}
