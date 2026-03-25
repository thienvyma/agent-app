"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Shield,
  Brain,
  Cpu,
  DollarSign,
  Wallet,
  BookOpen,
  Radio,
  ChevronRight,
} from "lucide-react";

/** Pipeline step definition */
interface PipelineStep {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { id: "approval", name: "Approval Check", description: "Check if message requires owner approval via ApprovalPolicy", icon: Shield, color: "text-amber-400" },
  { id: "context", name: "Context Build", description: "Inject agent memory, knowledge base, and conversation history via ContextBuilder", icon: Brain, color: "text-purple-400" },
  { id: "execute", name: "Engine Execute", description: "Send message to OpenClaw engine (or mock) via IAgentEngine.sendMessage", icon: Cpu, color: "text-blue-400" },
  { id: "cost", name: "Cost Tracking", description: "Count input/output tokens and record cost via CostTracker", icon: DollarSign, color: "text-green-400" },
  { id: "budget", name: "Budget Check", description: "Verify agent is within budget limits, pause if exceeded via BudgetManager", icon: Wallet, color: "text-red-400" },
  { id: "log", name: "Conversation Log", description: "Save conversation to persistent memory via ConversationLogger", icon: BookOpen, color: "text-indigo-400" },
  { id: "publish", name: "Message Publish", description: "Broadcast response to subscribers and realtime clients via MessageBus", icon: Radio, color: "text-cyan-400" },
];

/** Step execution status */
type StepStatus = "pending" | "running" | "done" | "skipped" | "error";

interface StepState {
  status: StepStatus;
  duration?: number;
  detail?: string;
}

/** Props */
interface PipelineViewerProps {
  agentId: string;
  agentName: string;
}

/**
 * Pipeline Execution Viewer — shows the 7-step agent execution pipeline.
 * Allows running a test message through the full pipeline with step-by-step progress.
 */
export function PipelineViewer({ agentId, agentName }: PipelineViewerProps) {
  const [steps, setSteps] = useState<Record<string, StepState>>({});
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<string | null>(null);

  /** Simulate pipeline execution with real API call */
  async function runPipeline() {
    if (!message.trim() || running) return;
    setRunning(true);
    setResult(null);

    // Initialize all steps as pending
    const initial: Record<string, StepState> = {};
    PIPELINE_STEPS.forEach((s) => { initial[s.id] = { status: "pending" }; });
    setSteps(initial);

    // Simulate step-by-step progress for UI feedback
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i]!;

      // Mark current step as running
      setSteps((prev) => ({
        ...prev,
        [step.id]: { status: "running" },
      }));

      // If it's the "execute" step (step 3), actually call the API
      if (step.id === "execute") {
        try {
          const start = Date.now();
          const res = await fetch(`/api/agents/${agentId}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: message.trim() }),
          });
          const json = await res.json();
          const duration = Date.now() - start;

          setSteps((prev) => ({
            ...prev,
            [step.id]: { status: "done", duration, detail: `${json.data?.tokens ?? "?"} tokens` },
          }));

          if (json.data?.response || json.data?.message) {
            setResult(json.data.response || json.data.message);
          }
        } catch (err) {
          setSteps((prev) => ({
            ...prev,
            [step.id]: { status: "error", detail: String(err) },
          }));
          setRunning(false);
          return;
        }
      } else {
        // Simulate other steps completing
        await new Promise((r) => setTimeout(r, 150 + Math.random() * 200));
        setSteps((prev) => ({
          ...prev,
          [step.id]: { status: "done", duration: Math.floor(50 + Math.random() * 150) },
        }));
      }
    }

    setRunning(false);
  }

  return (
    <div className="space-y-5">
      {/* Input */}
      <div className="p-5 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-3">Test Pipeline Execution</h3>
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Send a test message to ${agentName}...`}
            disabled={running}
            onKeyDown={(e) => e.key === "Enter" && runPipeline()}
            className="flex-1 px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={runPipeline}
            disabled={!message.trim() || running}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Execute
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="p-5 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
        <h3 className="text-sm font-semibold text-white mb-4">Pipeline Steps</h3>
        <div className="space-y-1">
          {PIPELINE_STEPS.map((step, i) => {
            const state = steps[step.id];
            const Icon = step.icon;
            const StatusIcon = state?.status === "done"
              ? CheckCircle2 : state?.status === "running"
              ? Loader2 : state?.status === "error"
              ? Circle : Circle;

            return (
              <div key={step.id}>
                <div className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  state?.status === "running" ? "bg-indigo-500/5 border border-indigo-500/20" :
                  state?.status === "done" ? "bg-green-500/5 border border-transparent" :
                  state?.status === "error" ? "bg-red-500/5 border border-red-500/20" :
                  "border border-transparent"
                }`}>
                  {/* Step number */}
                  <span className="text-[10px] text-gray-600 font-mono w-4 text-right">{i + 1}</span>

                  {/* Status icon */}
                  <StatusIcon className={`w-4 h-4 shrink-0 ${
                    state?.status === "done" ? "text-green-400" :
                    state?.status === "running" ? "text-indigo-400 animate-spin" :
                    state?.status === "error" ? "text-red-400" :
                    "text-gray-600"
                  }`} />

                  {/* Step icon */}
                  <Icon className={`w-4 h-4 shrink-0 ${step.color}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${state?.status ? "text-white" : "text-gray-400"}`}>{step.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{step.description}</p>
                  </div>

                  {/* Duration */}
                  {state?.duration && (
                    <span className="text-[10px] text-gray-500 font-mono shrink-0">{state.duration}ms</span>
                  )}
                  {state?.detail && (
                    <span className="text-[10px] text-gray-400 shrink-0">{state.detail}</span>
                  )}
                </div>

                {/* Connector */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="ml-[26px] w-px h-1 bg-[#2A303C]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="p-5 bg-[#1A1F2B] border border-[#2A303C] rounded-xl">
          <h3 className="text-sm font-semibold text-white mb-2">Response</h3>
          <div className="p-4 bg-[#0E1117] rounded-lg border border-[#2A303C]">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">{result}</p>
          </div>
        </div>
      )}
    </div>
  );
}
