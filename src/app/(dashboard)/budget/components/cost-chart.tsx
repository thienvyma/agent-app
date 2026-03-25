"use client";

import { DollarSign } from "lucide-react";

/** Per-agent usage data for chart */
interface AgentUsageData {
  agentId: string;
  agentName: string;
  totalTokens: number;
  totalCostUsd: number;
}

/** Daily trend data point */
interface TrendPoint {
  date: string;
  tokens: number;
  costUsd: number;
}

interface CostChartProps {
  agents: AgentUsageData[];
  trend?: TrendPoint[];
  budgetUsedPercent?: number;
}

/**
 * CSS-based charts for cost dashboard.
 *
 * - Per-agent horizontal bar chart
 * - 7-day trend vertical bars
 * - Budget gauge (circular progress)
 */
export function CostChart({ agents, trend, budgetUsedPercent }: CostChartProps) {
  const maxTokens = agents.length > 0 ? Math.max(...agents.map((a) => a.totalTokens)) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Per-Agent Bar Chart */}
      <div className="lg:col-span-2 p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          Cost per Agent
        </h3>
        {agents.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-8 text-center">No cost data yet</p>
        ) : (
          <div className="space-y-3">
            {agents.map((agent) => {
              const pct = Math.round((agent.totalTokens / maxTokens) * 100);
              return (
                <div key={agent.agentId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-300 font-medium">{agent.agentName}</span>
                    <div className="flex items-center gap-3 text-gray-500">
                      <span>{agent.totalTokens.toLocaleString()} tokens</span>
                      <span className="text-emerald-400 font-mono">${agent.totalCostUsd.toFixed(4)}</span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-[#0B0F19] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget Gauge */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535] flex flex-col items-center justify-center">
        <h3 className="text-sm font-semibold text-white mb-4">Budget Used</h3>
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1E2535" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={
                (budgetUsedPercent ?? 0) >= 100 ? "#ef4444" :
                (budgetUsedPercent ?? 0) >= 80 ? "#f59e0b" : "#10b981"
              }
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${Math.min((budgetUsedPercent ?? 0) / 100 * 264, 264)} 264`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${
              (budgetUsedPercent ?? 0) >= 100 ? "text-red-400" :
              (budgetUsedPercent ?? 0) >= 80 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {budgetUsedPercent ?? 0}%
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          {(budgetUsedPercent ?? 0) >= 100 ? "⚠️ Budget exceeded!" :
           (budgetUsedPercent ?? 0) >= 80 ? "⚠️ Warning threshold" : "Within budget"}
        </p>
      </div>

      {/* 7-Day Trend */}
      {trend && trend.length > 0 && (
        <div className="lg:col-span-3 p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
          <h3 className="text-sm font-semibold text-white mb-4">7-Day Token Trend</h3>
          <div className="flex items-end gap-2 h-32">
            {trend.map((day) => {
              const maxTrend = Math.max(...trend.map((t) => t.tokens));
              const barH = maxTrend > 0 ? Math.max((day.tokens / maxTrend) * 100, 4) : 4;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-500 font-mono">{day.tokens.toLocaleString()}</span>
                  <div className="w-full rounded-t-md bg-gradient-to-t from-indigo-600/60 to-indigo-400/80 transition-all duration-500" style={{ height: `${barH}%` }} />
                  <span className="text-[10px] text-gray-600">{day.date.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
