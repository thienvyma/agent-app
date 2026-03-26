/**
 * ScheduleManager — WRAPS OpenClaw cron tool.
 *
 * Formats cron commands and executes them via OpenClaw CLI.
 * Falls back to in-memory-only when CLI is unavailable.
 *
 * @module core/scheduler/schedule-manager
 */

/** CLI executor function type (same signature as execOpenClaw) */
type CliExecutor = (args: string[], timeoutMs: number) => Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
  json?: unknown;
}>;

/** Job registration input */
interface RegisterJobInput {
  name: string;
  cronExpression: string;
  agentId: string;
  taskTemplate: string;
}

/** Stored scheduled job */
export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  agentId: string;
  taskTemplate: string;
  enabled: boolean;
  createdAt: Date;
}

/** Registration result */
interface RegisterResult {
  jobId: string;
  openclawCommand: string;
}

/** Cron run history entry */
export interface CronRunEntry {
  id: string;
  status: string;
  timestamp: string;
}

/** Run-now result */
export interface RunNowResult {
  success: boolean;
  message: string;
}

/** ScheduleManager configuration */
interface ScheduleManagerConfig {
  /** Optional CLI executor for OpenClaw integration */
  cliExecutor?: CliExecutor;
}

/**
 * Wraps OpenClaw cron tool for scheduling agent tasks.
 * When cliExecutor is provided, calls OpenClaw CLI for real cron management.
 * Falls back to in-memory when CLI is absent or fails.
 */
export class ScheduleManager {
  private jobs: ScheduledJob[] = [];
  private nextId = 1;
  private cli?: CliExecutor;

  /**
   * @param config - Optional configuration with CLI executor
   */
  constructor(config?: ScheduleManagerConfig) {
    this.cli = config?.cliExecutor;
  }

  /**
   * Register a new scheduled job.
   * Calls OpenClaw cron add if CLI is available, then stores in cache.
   *
   * @param input - Job configuration
   * @returns Job ID and OpenClaw command to execute
   */
  async registerJob(input: RegisterJobInput): Promise<RegisterResult> {
    const job: ScheduledJob = {
      id: `sched-${this.nextId++}`,
      name: input.name,
      cronExpression: input.cronExpression,
      agentId: input.agentId,
      taskTemplate: input.taskTemplate,
      enabled: true,
      createdAt: new Date(),
    };

    // Try OpenClaw CLI
    if (this.cli) {
      try {
        await this.cli(
          ["cron", "add", "--name", input.name, "--cron", input.cronExpression, "--message", input.taskTemplate],
          30_000
        );
      } catch {
        // Fallback: CLI failed, continue with in-memory only
      }
    }

    this.jobs.push(job);

    const openclawCommand = `Use cron tool to schedule: "${input.cronExpression}" → ${input.taskTemplate}`;
    return { jobId: job.id, openclawCommand };
  }

  /**
   * Remove a scheduled job.
   * Calls OpenClaw cron rm if CLI is available.
   *
   * @param jobId - Job ID to remove
   */
  async removeJob(jobId: string): Promise<void> {
    if (this.cli) {
      try {
        await this.cli(["cron", "rm", jobId], 15_000);
      } catch {
        // Best-effort CLI removal
      }
    }

    this.jobs = this.jobs.filter((j) => j.id !== jobId);
  }

  /**
   * List all scheduled jobs.
   */
  listJobs(): ScheduledJob[] {
    return [...this.jobs];
  }

  /**
   * Pause a job (disable without removing).
   * Calls OpenClaw cron disable if CLI is available.
   *
   * @param jobId - Job ID to pause
   */
  async pauseJob(jobId: string): Promise<void> {
    if (this.cli) {
      try {
        await this.cli(["cron", "disable", jobId], 15_000);
      } catch {
        // Best-effort CLI disable
      }
    }

    const job = this.jobs.find((j) => j.id === jobId);
    if (job) job.enabled = false;
  }

  /**
   * Resume a paused job.
   * Calls OpenClaw cron enable if CLI is available.
   *
   * @param jobId - Job ID to resume
   */
  async resumeJob(jobId: string): Promise<void> {
    if (this.cli) {
      try {
        await this.cli(["cron", "enable", jobId], 15_000);
      } catch {
        // Best-effort CLI enable
      }
    }

    const job = this.jobs.find((j) => j.id === jobId);
    if (job) job.enabled = true;
  }

  /**
   * Get jobs for a specific agent.
   */
  getJobsByAgent(agentId: string): ScheduledJob[] {
    return this.jobs.filter((j) => j.agentId === agentId);
  }

  /**
   * Get cron run history for a job from OpenClaw.
   *
   * @param jobId - Job ID to get history for
   * @returns Array of cron run entries
   */
  async getJobHistory(jobId: string): Promise<CronRunEntry[]> {
    if (!this.cli) {
      return [];
    }

    try {
      const result = await this.cli(["cron", "runs", "--id", jobId, "--json"], 15_000);
      const json = result.json as { runs?: CronRunEntry[] } | undefined;
      return json?.runs ?? [];
    } catch {
      return [];
    }
  }

  /**
   * Trigger immediate execution of a cron job.
   *
   * @param jobId - Job ID to run now
   * @returns Result indicating success/failure
   */
  async runJobNow(jobId: string): Promise<RunNowResult> {
    if (!this.cli) {
      return { success: false, message: "CLI not available" };
    }

    try {
      const result = await this.cli(["cron", "run", jobId, "--force"], 30_000);
      return {
        success: result.exitCode === 0,
        message: result.stdout || "triggered",
      };
    } catch {
      return { success: false, message: "CLI execution failed" };
    }
  }
}
