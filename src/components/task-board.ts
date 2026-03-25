/**
 * TaskBoard — Kanban board logic.
 *
 * Groups tasks into 5 columns by status.
 * Priority badges: high (1-3), medium (4-6), low (7-10).
 *
 * @module components/task-board
 */

/** Task board column definitions */
export const TASK_COLUMNS = [
  { id: "PENDING", label: "Pending", color: "--status-idle" },
  { id: "IN_PROGRESS", label: "In Progress", color: "--status-deploying" },
  { id: "WAITING_APPROVAL", label: "Waiting Approval", color: "--status-paused" },
  { id: "COMPLETED", label: "Completed", color: "--status-running" },
  { id: "FAILED", label: "Failed", color: "--status-error" },
] as const;

export type TaskStatus = (typeof TASK_COLUMNS)[number]["id"];

/** Task data for board */
interface TaskData {
  id: string;
  status: string;
  description: string;
  priority: number;
}

/** Priority badge configuration */
export interface PriorityBadge {
  level: "high" | "medium" | "low";
  label: string;
  cssClass: string;
}

/** Grouped tasks by status */
export type GroupedTasks = Record<string, TaskData[]>;

/**
 * Group tasks by their status into board columns.
 *
 * @param tasks - Array of tasks
 * @returns Object with status keys and task arrays
 */
export function groupByStatus(tasks: TaskData[]): GroupedTasks {
  const grouped: GroupedTasks = {};

  // Initialize all columns
  for (const col of TASK_COLUMNS) {
    grouped[col.id] = [];
  }

  // Group tasks
  for (const task of tasks) {
    if (grouped[task.status]) {
      grouped[task.status]!.push(task);
    } else {
      // Unknown status → put in PENDING
      grouped.PENDING!.push(task);
    }
  }

  return grouped;
}

/**
 * Get priority badge configuration.
 *
 * @param priority - Priority number (1-10, 1 = highest)
 * @returns Priority badge with level, label, and CSS class
 */
export function getPriorityBadge(priority: number): PriorityBadge {
  if (priority <= 3) {
    return { level: "high", label: "High", cssClass: "priority--high" };
  }
  if (priority <= 6) {
    return { level: "medium", label: "Medium", cssClass: "priority--medium" };
  }
  return { level: "low", label: "Low", cssClass: "priority--low" };
}
