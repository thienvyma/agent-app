/**
 * Realtime event type definitions for the Agentic Enterprise platform.
 *
 * 6 event categories matching Phase 19 spec:
 * Agent, Task, Message, Approval, Cost, System.
 *
 * @module types/realtime
 */

// === Event Name Constants ===

export const AGENT_EVENTS = {
  DEPLOYED: "agent:deployed",
  UNDEPLOYED: "agent:undeployed",
  STATUS: "agent:status",
  HEALTH: "agent:health",
} as const;

export const TASK_EVENTS = {
  CREATED: "task:created",
  ASSIGNED: "task:assigned",
  PROGRESS: "task:progress",
  COMPLETED: "task:completed",
  FAILED: "task:failed",
} as const;

export const MESSAGE_EVENTS = {
  NEW: "message:new",
  CHAIN: "message:chain",
} as const;

export const APPROVAL_EVENTS = {
  PENDING: "approval:pending",
  RESOLVED: "approval:resolved",
} as const;

export const COST_EVENTS = {
  UPDATED: "cost:updated",
  WARNING: "cost:warning",
  PAUSED: "cost:paused",
} as const;

export const SYSTEM_EVENTS = {
  HEALTH: "system:health",
  ERROR: "system:error",
} as const;

// === Event Data Interfaces ===

export interface AgentDeployedEvent {
  agentId: string;
  name: string;
  status: string;
}

export interface AgentStatusEvent {
  agentId: string;
  name: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
}

export interface TaskCreatedEvent {
  taskId: string;
  description: string;
  assignedTo?: string;
  priority: number;
}

export interface TaskCompletedEvent {
  taskId: string;
  result: string;
  tokenUsed: number;
  duration: number;
}

export interface TaskFailedEvent {
  taskId: string;
  error: string;
  retryCount: number;
}

export interface ApprovalPendingEvent {
  approvalId: string;
  taskId: string;
  agentName: string;
  reason: string;
}

export interface ApprovalResolvedEvent {
  approvalId: string;
  status: string;
  resolvedBy: string;
  response?: string;
}

export interface CostUpdatedEvent {
  agentId: string;
  tokensSoFar: number;
  budgetPercent: number;
}

export interface CostWarningEvent {
  agentId: string;
  name: string;
  usage: number;
  budget: number;
  percentUsed: number;
}

export interface SystemHealthEvent {
  services: Record<string, boolean>;
  timestamp: number;
}

export interface SystemErrorEvent {
  component: string;
  error: string;
  severity: "low" | "medium" | "high" | "critical";
}

/** Wrapper for all emitted events with timestamp */
export interface RealtimeEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: number;
}
