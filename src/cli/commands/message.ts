/**
 * CLI commands for inter-agent messaging.
 *
 * - ae message send <from> <to> "content" [--type delegate]
 * - ae message list [--agent <id>] [--limit 20]
 *
 * @module cli/commands/message
 */

import { Command } from "commander";
import { MessageType } from "@prisma/client";
import { Prisma } from "@prisma/client";

/** Create the message command group */
export const messageCommand = new Command("message")
  .description("Inter-agent messaging (send, list)");

messageCommand
  .command("send <fromId> <toId> <content>")
  .description("Send a message between agents")
  .option("--type <type>", "Message type: delegate, report, chain, group, alert, escalation", "delegate")
  .action(async (fromId: string, toId: string, content: string, options: { type: string }) => {
    try {
      const { prisma: db } = await import("@/lib/prisma");

      const typeMap: Record<string, MessageType> = {
        delegate: MessageType.DELEGATE,
        report: MessageType.REPORT,
        chain: MessageType.CHAIN,
        group: MessageType.GROUP,
        alert: MessageType.ALERT,
        escalation: MessageType.ESCALATION,
      };

      const msgType = typeMap[options.type.toLowerCase()];
      if (!msgType) {
        console.error(JSON.stringify({ error: `Invalid type: ${options.type}` }));
        process.exit(1);
      }

      // Direct DB insert (no BullMQ in CLI mode)
      const message = await db.message.create({
        data: {
          fromAgentId: fromId,
          toAgentId: toId,
          content,
          type: msgType,
          metadata: {} as Prisma.InputJsonValue,
        },
        include: {
          fromAgent: { select: { name: true, role: true } },
          toAgent: { select: { name: true, role: true } },
        },
      });

      console.log(JSON.stringify({
        id: message.id,
        from: `${message.fromAgent.name} (${message.fromAgent.role})`,
        to: `${message.toAgent.name} (${message.toAgent.role})`,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
      }, null, 2));
    } catch (error) {
      console.error("Error sending message:", error);
      process.exit(1);
    }
  });

messageCommand
  .command("list")
  .description("List messages")
  .option("--agent <id>", "Filter by agent ID")
  .option("--limit <n>", "Max messages to show", "20")
  .action(async (options: { agent?: string; limit: string }) => {
    try {
      const { prisma: db } = await import("@/lib/prisma");

      const where = options.agent
        ? {
            OR: [
              { fromAgentId: options.agent },
              { toAgentId: options.agent },
            ],
          }
        : {};

      const messages = await db.message.findMany({
        where,
        take: parseInt(options.limit, 10),
        orderBy: { createdAt: "desc" },
        include: {
          fromAgent: { select: { name: true, role: true } },
          toAgent: { select: { name: true, role: true } },
        },
      });

      console.log(JSON.stringify(
        messages.map((m) => ({
          id: m.id,
          from: `${m.fromAgent.name} (${m.fromAgent.role})`,
          to: `${m.toAgent.name} (${m.toAgent.role})`,
          content: m.content.substring(0, 100),
          type: m.type,
          createdAt: m.createdAt,
        })),
        null,
        2
      ));
    } catch (error) {
      console.error("Error listing messages:", error);
      process.exit(1);
    }
  });
