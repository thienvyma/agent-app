/**
 * TriggerRegistry — in-memory registry for external triggers.
 *
 * Manages trigger lifecycle: register, unregister, list, fire.
 * Fires triggers by publishing messages via MessageBus.
 *
 * @module core/triggers/trigger-registry
 */

import type { MessageBus } from "@/core/messaging/message-bus";
import type { TriggerConfig, TriggerFilter, TriggerStats, TriggerType } from "@/types/trigger";
import { MessageType } from "@prisma/client";
import { randomUUID } from "crypto";

/** Valid cron expression pattern (5-part) */
const CRON_REGEX = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;

/**
 * In-memory trigger registry with MessageBus integration.
 */
export class TriggerRegistry {
  private readonly triggers = new Map<string, TriggerConfig>();

  constructor(private readonly messageBus: MessageBus) {}

  /**
   * Register a new trigger.
   *
   * @param config - Trigger configuration (without id/createdAt)
   * @returns Trigger ID
   * @throws Error if config is invalid
   */
  async register(
    config: Omit<TriggerConfig, "id" | "createdAt" | "lastFired">
  ): Promise<string> {
    // Validate messageTemplate
    if (!config.config.messageTemplate) {
      throw new Error("Trigger config requires a messageTemplate");
    }

    // Validate cron expression for cron triggers
    if (config.type === "cron") {
      if (!config.config.cronExpression || !CRON_REGEX.test(config.config.cronExpression)) {
        throw new Error(
          `Invalid cron expression: "${config.config.cronExpression ?? ""}". Expected 5-part format (e.g., "0 9 * * *")`
        );
      }
    }

    const id = `trigger-${randomUUID().substring(0, 8)}`;
    const trigger: TriggerConfig = {
      ...config,
      id,
      createdAt: new Date(),
    };

    this.triggers.set(id, trigger);
    return id;
  }

  /**
   * Unregister a trigger by ID.
   *
   * @param triggerId - Trigger to remove
   */
  async unregister(triggerId: string): Promise<void> {
    this.triggers.delete(triggerId);
  }

  /**
   * List triggers with optional filtering.
   *
   * @param filter - Optional filter by type and/or active status
   * @returns Filtered list of triggers
   */
  async list(filter?: TriggerFilter): Promise<TriggerConfig[]> {
    let triggers = Array.from(this.triggers.values());

    if (filter?.type) {
      triggers = triggers.filter((t) => t.type === filter.type);
    }

    if (filter?.active !== undefined) {
      triggers = triggers.filter((t) => t.active === filter.active);
    }

    return triggers;
  }

  /**
   * Fire a trigger: render template with payload + publish to MessageBus.
   *
   * @param triggerId - Trigger to fire
   * @param payload - Event payload for template rendering
   * @throws Error if trigger not found
   */
  async fire(
    triggerId: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    const trigger = this.triggers.get(triggerId);

    if (!trigger) {
      throw new Error(`Trigger ${triggerId} not found`);
    }

    // Render template with payload
    const content = this.renderTemplate(
      trigger.config.messageTemplate,
      payload
    );

    // Publish via MessageBus
    await this.messageBus.publish({
      fromAgentId: "system",
      toAgentId: trigger.targetAgentId,
      content,
      type: MessageType.ALERT,
      metadata: {
        triggerId,
        triggerType: trigger.type,
        triggerName: trigger.name,
      },
    });

    // Update lastFired
    trigger.lastFired = new Date();
  }

  /**
   * Get a single trigger config by ID.
   *
   * @param triggerId - Trigger ID
   * @returns TriggerConfig or undefined
   */
  get(triggerId: string): TriggerConfig | undefined {
    return this.triggers.get(triggerId);
  }

  /**
   * Get summary statistics about registered triggers.
   *
   * @returns TriggerStats
   */
  async getStats(): Promise<TriggerStats> {
    const all = Array.from(this.triggers.values());

    const byType: Record<TriggerType, number> = {
      webhook: 0,
      cron: 0,
      email: 0,
      api: 0,
    };

    let lastFired: Date | undefined;

    for (const t of all) {
      byType[t.type]++;
      if (t.lastFired && (!lastFired || t.lastFired > lastFired)) {
        lastFired = t.lastFired;
      }
    }

    return {
      total: all.length,
      active: all.filter((t) => t.active).length,
      byType,
      lastFired,
    };
  }

  /**
   * Render a message template with payload values.
   * Replaces {{key}} with payload[key].
   */
  private renderTemplate(
    template: string,
    payload: Record<string, unknown>
  ): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = payload[key];
      return value !== undefined ? String(value) : `{{${key}}}`;
    });
  }
}
