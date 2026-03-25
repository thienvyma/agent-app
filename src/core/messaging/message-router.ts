/**
 * MessageRouter — intent-based message routing.
 *
 * Routes messages to the correct agent based on:
 * - DELEGATE: findBestAgent via HierarchyEngine
 * - GROUP: broadcast to all agents in company
 * - ESCALATION: route to CEO agent
 * - REPORT: route back to sender's supervisor
 *
 * @module core/messaging/message-router
 */

import type { HierarchyEngine } from "@/core/company/hierarchy-engine";
import type { MessageBus } from "@/core/messaging/message-bus";
import { MessageType } from "@prisma/client";
import type { BusMessage } from "@/types/message";

/**
 * Routes messages to agents based on intent and hierarchy.
 */
export class MessageRouter {
  constructor(
    private readonly hierarchy: HierarchyEngine,
    private readonly messageBus: MessageBus
  ) {}

  /**
   * Route a message based on its type.
   *
   * @param fromAgentId - Sender agent ID
   * @param companyId - Company context for hierarchy lookup
   * @param content - Message content
   * @param type - Message type determines routing strategy
   * @throws Error if no suitable agent found for DELEGATE
   */
  async route(
    fromAgentId: string,
    companyId: string,
    content: string,
    type: MessageType
  ): Promise<void> {
    switch (type) {
      case MessageType.DELEGATE: {
        await this.routeDelegate(fromAgentId, companyId, content);
        break;
      }
      case MessageType.GROUP: {
        await this.routeGroup(fromAgentId, companyId, content);
        break;
      }
      case MessageType.ESCALATION: {
        await this.routeEscalation(fromAgentId, companyId, content);
        break;
      }
      case MessageType.REPORT:
      case MessageType.ALERT:
      case MessageType.CHAIN:
      default: {
        // For REPORT/ALERT/CHAIN — route to CEO as default
        await this.routeEscalation(fromAgentId, companyId, content);
        break;
      }
    }
  }

  /**
   * Route a DELEGATE message: find best agent via HierarchyEngine.
   */
  private async routeDelegate(
    fromAgentId: string,
    companyId: string,
    content: string
  ): Promise<void> {
    const agent = await this.hierarchy.findBestAgent(companyId, content);

    if (!agent) {
      throw new Error(
        `No suitable agent found for: "${content.substring(0, 50)}..."`
      );
    }

    const message: BusMessage = {
      fromAgentId,
      toAgentId: agent.id,
      content,
      type: MessageType.DELEGATE,
    };

    await this.messageBus.publish(message);
  }

  /**
   * Route a GROUP message: broadcast to all agents in company.
   */
  private async routeGroup(
    fromAgentId: string,
    companyId: string,
    content: string
  ): Promise<void> {
    // Get all agents (find by any role — empty string matches all)
    const agents = await this.hierarchy.findAgentsByRole(companyId, "");

    if (agents.length === 0) {
      return;
    }

    const message: BusMessage = {
      fromAgentId,
      toAgentId: "", // will be overridden by broadcast
      content,
      type: MessageType.GROUP,
    };

    const agentIds = agents
      .map((a: { id: string }) => a.id)
      .filter((id: string) => id !== fromAgentId); // don't broadcast to self

    await this.messageBus.broadcast(message, agentIds);
  }

  /**
   * Route an ESCALATION message: send to CEO agent.
   */
  private async routeEscalation(
    fromAgentId: string,
    companyId: string,
    content: string
  ): Promise<void> {
    const ceoAgents = await this.hierarchy.findAgentsByRole(companyId, "ceo");
    const ceo = ceoAgents[0] as { id: string } | undefined;

    if (!ceo) {
      // No CEO found — could route to owner (Phase 20)
      throw new Error("No CEO agent found for escalation");
    }

    const message: BusMessage = {
      fromAgentId,
      toAgentId: ceo.id,
      content,
      type: MessageType.ESCALATION,
    };

    await this.messageBus.publish(message);
  }

  /**
   * Route directly to a specific role.
   *
   * @param fromAgentId - Sender
   * @param companyId - Company context
   * @param content - Message content
   * @param role - Target role name
   */
  async routeToRole(
    fromAgentId: string,
    companyId: string,
    content: string,
    role: string
  ): Promise<void> {
    const agents = await this.hierarchy.findAgentsByRole(companyId, role);
    const target = agents[0] as { id: string } | undefined;

    if (!target) {
      throw new Error(`No agent with role "${role}" found`);
    }

    const message: BusMessage = {
      fromAgentId,
      toAgentId: target.id,
      content,
      type: MessageType.DELEGATE,
    };

    await this.messageBus.publish(message);
  }

  /**
   * Route to owner (placeholder for Phase 20 Telegram integration).
   *
   * @param content - Message to send to owner
   * @param agentId - Agent requesting owner attention
   */
  async routeToOwner(content: string, agentId: string): Promise<void> {
    // Phase 20: will send via Telegram
    console.log(
      `[MessageRouter] Owner notification from ${agentId}: ${content}`
    );
  }
}
