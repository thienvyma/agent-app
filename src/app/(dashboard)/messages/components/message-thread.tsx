"use client";

import { MessageSquare, ArrowRight, Clock } from "lucide-react";

/** Message from API */
interface MessageItem {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  content: string;
  type: string;
  metadata: unknown;
  createdAt: string;
  fromAgent?: { id: string; name: string; role: string } | null;
  toAgent?: { id: string; name: string; role: string } | null;
}

interface MessageThreadProps {
  messages: MessageItem[];
  selectedThread: string | null;
}

/** Color map for message types */
const TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  DELEGATE: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  REPORT: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  CHAIN: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  GROUP: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  ALERT: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  ESCALATION: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
};

/**
 * Format relative time.
 */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/**
 * Chat-like message thread view.
 *
 * Groups messages between two agents as a conversation thread.
 */
export function MessageThread({ messages, selectedThread }: MessageThreadProps) {
  // Filter messages for selected thread (agent pair)
  const threadMessages = selectedThread
    ? messages.filter((m) => {
        const key = [m.fromAgentId, m.toAgentId].sort().join("-");
        return key === selectedThread;
      })
    : messages;

  if (threadMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">No messages in this thread</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      {threadMessages.map((msg) => {
        const colors = TYPE_COLORS[msg.type] ?? TYPE_COLORS.DELEGATE!;
        return (
          <div
            key={msg.id}
            className={`p-4 rounded-xl ${colors.bg} border ${colors.border} transition-all hover:scale-[1.01]`}
          >
            {/* Header: from → to */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-white">
                {msg.fromAgent?.name ?? "Unknown"}
              </span>
              <ArrowRight className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-semibold text-white">
                {msg.toAgent?.name ?? "Unknown"}
              </span>
              <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium`}>
                {msg.type}
              </span>
            </div>

            {/* Content */}
            <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>

            {/* Footer */}
            <div className="flex items-center gap-1.5 mt-2">
              <Clock className="w-3 h-3 text-gray-600" />
              <span className="text-[10px] text-gray-500">{timeAgo(msg.createdAt)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
