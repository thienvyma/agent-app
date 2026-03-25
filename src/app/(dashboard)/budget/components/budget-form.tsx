"use client";

import { useState } from "react";
import { Settings, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface BudgetFormProps {
  currentLimit?: number;
  currentWarningPct?: number;
  onSubmit: (data: { dailyLimit: number; warningPct: number }) => Promise<void>;
}

/**
 * Budget limit setting form.
 *
 * Set daily token budget limit and warning threshold percentage.
 */
export function BudgetForm({ currentLimit, currentWarningPct, onSubmit }: BudgetFormProps) {
  const [dailyLimit, setDailyLimit] = useState(currentLimit ?? 10);
  const [warningPct, setWarningPct] = useState(currentWarningPct ?? 80);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (dailyLimit <= 0) {
      setError("Daily limit must be positive");
      return;
    }
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      await onSubmit({ dailyLimit, warningPct });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to update budget");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Settings className="w-4 h-4 text-indigo-400" />
        Budget Settings
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Daily Limit */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Daily Limit (USD)
          </label>
          <input
            type="number"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0.01"
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Warning Threshold */}
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Warning at {warningPct}%
          </label>
          <input
            type="range"
            min={50}
            max={95}
            value={warningPct}
            onChange={(e) => setWarningPct(parseInt(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-gray-600 mt-0.5">
            <span>50%</span>
            <span>95%</span>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-3 h-3" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Budget updated successfully
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
        >
          {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitting ? "Saving..." : "Update Budget"}
        </button>
      </form>
    </div>
  );
}
