/**
 * WebhookHandler — validates and processes incoming webhook requests.
 *
 * Security features:
 * - HMAC-SHA256 signature validation
 * - Payload size limit (1MB)
 * - Graceful error handling
 *
 * @module core/triggers/webhook-handler
 */

import { createHmac } from "crypto";
import type { TriggerRegistry } from "@/core/triggers/trigger-registry";
import type { WebhookResult } from "@/types/trigger";

/** Max payload size in bytes (1MB) */
const MAX_PAYLOAD_SIZE = 1_048_576;

/**
 * Handles incoming webhook requests and fires associated triggers.
 */
export class WebhookHandler {
  constructor(private readonly registry: TriggerRegistry) {}

  /**
   * Process an incoming webhook request.
   *
   * @param triggerId - Trigger ID from URL path
   * @param headers - Request headers (for signature validation)
   * @param body - Raw request body string
   * @returns WebhookResult indicating success or failure
   */
  async handleWebhook(
    triggerId: string,
    headers: Record<string, string>,
    body: string
  ): Promise<WebhookResult> {
    // Check payload size
    if (body.length > MAX_PAYLOAD_SIZE) {
      return {
        success: false,
        triggerId,
        message: "Payload too large (max 1MB)",
      };
    }

    // Load trigger config
    const trigger = this.registry.get(triggerId);

    if (!trigger) {
      return {
        success: false,
        triggerId,
        message: `Trigger ${triggerId} not found`,
      };
    }

    if (!trigger.active) {
      return {
        success: false,
        triggerId,
        message: `Trigger ${triggerId} is inactive`,
      };
    }

    // Validate HMAC signature if secret is configured
    if (trigger.config.webhookSecret) {
      const signature = headers["x-webhook-signature"] ?? "";
      const expectedSignature = createHmac(
        "sha256",
        trigger.config.webhookSecret
      )
        .update(body)
        .digest("hex");

      if (signature !== expectedSignature) {
        return {
          success: false,
          triggerId,
          message: "Invalid webhook signature",
        };
      }
    }

    // Parse payload and fire trigger
    try {
      const payload = JSON.parse(body) as Record<string, unknown>;
      await this.registry.fire(triggerId, payload);

      return {
        success: true,
        triggerId,
        message: "Webhook processed successfully",
      };
    } catch (error) {
      return {
        success: false,
        triggerId,
        message: `Error processing webhook: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}
