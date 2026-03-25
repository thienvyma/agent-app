/**
 * Trigger type definitions for external event handling.
 *
 * Supports 4 trigger types:
 * - webhook: HTTP POST from external services
 * - cron: scheduled recurring tasks
 * - email: incoming email events
 * - api: direct API calls from partners
 *
 * @module types/trigger
 */

/** Supported trigger types */
export type TriggerType = "webhook" | "cron" | "email" | "api";

/** Configuration for a registered trigger */
export interface TriggerConfig {
  id: string;
  name: string;
  type: TriggerType;
  targetAgentId: string;
  config: {
    cronExpression?: string;
    webhookSecret?: string;
    emailFilter?: string;
    messageTemplate: string;
  };
  active: boolean;
  lastFired?: Date;
  createdAt: Date;
}

/** Filter for listing triggers */
export interface TriggerFilter {
  type?: TriggerType;
  active?: boolean;
}

/** Trigger stats summary */
export interface TriggerStats {
  total: number;
  active: number;
  byType: Record<TriggerType, number>;
  lastFired?: Date;
}

/** Result from webhook handling */
export interface WebhookResult {
  success: boolean;
  triggerId: string;
  message: string;
}
