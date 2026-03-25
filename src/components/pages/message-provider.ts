/**
 * MessageProvider — data logic for Messages page.
 *
 * Handles message filtering, color coding by type, and conversation threading.
 *
 * @module components/pages/message-provider
 */

/** Message data */
interface MessageData {
  id: string;
  from: string;
  to: string;
  type: string;
  content: string;
  timestamp: Date;
}

/** Message filter criteria */
interface MessageFilter {
  agent?: string;
  type?: string;
  search?: string;
}

/** Color mapping for message types */
const TYPE_COLORS: Record<string, string> = {
  DELEGATE: "blue",
  REPORT: "green",
  ALERT: "red",
  CHAIN: "purple",
  INFO: "gray",
};

/**
 * Filter messages by criteria.
 * Agent filter matches both from and to fields.
 *
 * @param messages - Full message list
 * @param filters - Active filter criteria
 * @returns Filtered messages
 */
export function filterMessages(messages: MessageData[], filters: MessageFilter): MessageData[] {
  return messages.filter((msg) => {
    if (filters.agent && msg.from !== filters.agent && msg.to !== filters.agent) {
      return false;
    }
    if (filters.type && msg.type !== filters.type) {
      return false;
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!msg.content.toLowerCase().includes(search)) return false;
    }
    return true;
  });
}

/**
 * Get color for message type.
 *
 * @param type - Message type (DELEGATE, REPORT, ALERT, CHAIN)
 * @returns Color name
 */
export function getMessageColor(type: string): string {
  return TYPE_COLORS[type] ?? "gray";
}

/**
 * Group messages by conversation thread (from↔to pair).
 *
 * @param messages - Message list
 * @returns Object keyed by thread ID with message arrays
 */
export function groupByThread(messages: MessageData[]): Record<string, MessageData[]> {
  const threads: Record<string, MessageData[]> = {};

  for (const msg of messages) {
    // Create canonical thread key (alphabetically sorted pair)
    const pair = [msg.from, msg.to].sort();
    const key = `${pair[0]}↔${pair[1]}`;

    if (!threads[key]) {
      threads[key] = [];
    }
    threads[key]!.push(msg);
  }

  return threads;
}
