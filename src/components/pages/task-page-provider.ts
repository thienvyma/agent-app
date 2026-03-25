/**
 * TaskPageProvider — data logic for Tasks Kanban page.
 *
 * Handles task creation validation, detail formatting, and drag-drop.
 *
 * @module components/pages/task-page-provider
 */

import { getPriorityBadge, type PriorityBadge } from "@/components/task-board";

/** New task input */
interface NewTaskInput {
  description: string;
  assignTo?: string;
  priority: number;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Task data for detail view */
interface TaskData {
  id: string;
  description: string;
  status: string;
  assignedTo: string;
  priority: number;
  createdAt: Date;
  result: string | null;
  error: string | null;
  subtasks: { id: string; description: string; status: string }[];
}

/** Formatted task detail */
export interface TaskDetail {
  id: string;
  description: string;
  status: string;
  assignedTo: string;
  priorityBadge: PriorityBadge;
  createdAtText: string;
  hasResult: boolean;
  result: string | null;
  hasError: boolean;
  error: string | null;
  subtaskCount: number;
}

/** Drag-drop payload */
export interface DragDropPayload {
  taskId: string;
  newStatus: string;
  timestamp: number;
}

/**
 * Validate new task input.
 *
 * @param input - New task form data
 * @returns Validation result with errors array
 */
export function validateNewTask(input: NewTaskInput): ValidationResult {
  const errors: string[] = [];

  if (!input.description || input.description.trim().length === 0) {
    errors.push("Description is required");
  }

  if (input.priority < 1 || input.priority > 10) {
    errors.push("Priority must be between 1 and 10");
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Format task data for detail modal.
 *
 * @param task - Raw task data
 * @returns Formatted task detail
 */
export function formatTaskDetail(task: TaskData): TaskDetail {
  return {
    id: task.id,
    description: task.description,
    status: task.status,
    assignedTo: task.assignedTo,
    priorityBadge: getPriorityBadge(task.priority),
    createdAtText: task.createdAt.toISOString(),
    hasResult: task.result !== null,
    result: task.result,
    hasError: task.error !== null,
    error: task.error,
    subtaskCount: task.subtasks.length,
  };
}

/**
 * Generate drag-drop status change payload.
 *
 * @param taskId - Task to move
 * @param newStatus - Target column status
 * @returns Payload for API call
 */
export function handleDragDrop(taskId: string, newStatus: string): DragDropPayload {
  return {
    taskId,
    newStatus,
    timestamp: Date.now(),
  };
}
