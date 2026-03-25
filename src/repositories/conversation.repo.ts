/**
 * ConversationRepository — CRUD for Conversations + ChatMessages.
 *
 * @module repositories/conversation
 */

import { getPrisma } from "./base";

export class ConversationRepository {
  private prisma = getPrisma();

  async create(agentId: string) {
    return this.prisma.conversation.create({ data: { agentId } });
  }

  async findById(id: string) {
    return this.prisma.conversation.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: "asc" } }, agent: true },
    });
  }

  async listByAgent(agentId: string) {
    return this.prisma.conversation.findMany({
      where: { agentId },
      include: { messages: { take: 1, orderBy: { createdAt: "desc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async addMessage(conversationId: string, role: string, content: string, tokens?: number) {
    return this.prisma.chatMessage.create({
      data: { conversationId, role, content, tokens },
    });
  }

  async getMessages(conversationId: string, limit = 50) {
    return this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
  }

  async updateSummary(id: string, summary: string) {
    return this.prisma.conversation.update({ where: { id }, data: { summary } });
  }
}
