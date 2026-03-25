/**
 * ScheduleManager — WRAPS OpenClaw cron tool.
 *
 * Formats cron commands to be sent to OpenClaw agent sessions.
 * Does NOT run its own timer — OpenClaw handles the scheduling.
 *
 * @module core/scheduler/schedule-manager
 */

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

/**
 * Wraps OpenClaw cron tool for scheduling agent tasks.
 * In production, calls OpenClawAdapter.sendMessage() to set up cron.
 */
export class ScheduleManager {
  private jobs: ScheduledJob[] = [];
  private nextId = 1;

  /**
   * Register a new scheduled job.
   * Formats the cron command to be sent to OpenClaw.
   *
   * @param input - Job configuration
   * @returns Job ID and OpenClaw command to execute
   */
  registerJob(input: RegisterJobInput): RegisterResult {
    const job: ScheduledJob = {
      id: `sched-${this.nextId++}`,
      name: input.name,
      cronExpression: input.cronExpression,
      agentId: input.agentId,
      taskTemplate: input.taskTemplate,
      enabled: true,
      createdAt: new Date(),
    };

    this.jobs.push(job);

    // Format command for OpenClaw cron tool
    const openclawCommand = `Use cron tool to schedule: "${input.cronExpression}" → ${input.taskTemplate}`;

    return { jobId: job.id, openclawCommand };
  }

  /**
   * Remove a scheduled job.
   */
  removeJob(jobId: string): void {
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
   */
  pauseJob(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) job.enabled = false;
  }

  /**
   * Resume a paused job.
   */
  resumeJob(jobId: string): void {
    const job = this.jobs.find((j) => j.id === jobId);
    if (job) job.enabled = true;
  }

  /**
   * Get jobs for a specific agent.
   */
  getJobsByAgent(agentId: string): ScheduledJob[] {
    return this.jobs.filter((j) => j.agentId === agentId);
  }
}
