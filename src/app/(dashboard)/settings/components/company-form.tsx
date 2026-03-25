"use client";

import { useState } from "react";
import { Building2, Save, Loader2, Bell, BellOff } from "lucide-react";

interface CompanyData {
  name: string;
  description: string;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  budgetAlerts: boolean;
  taskComplete: boolean;
}

interface CompanyFormProps {
  initialData?: Partial<CompanyData>;
  onSave: (data: CompanyData) => Promise<void>;
}

/**
 * Company profile + notification preferences form.
 */
export function CompanyForm({ initialData, onSave }: CompanyFormProps) {
  const [data, setData] = useState<CompanyData>({
    name: initialData?.name ?? "",
    description: initialData?.description ?? "",
    telegramEnabled: initialData?.telegramEnabled ?? false,
    emailEnabled: initialData?.emailEnabled ?? false,
    budgetAlerts: initialData?.budgetAlerts ?? true,
    taskComplete: initialData?.taskComplete ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /** Validate */
  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!data.name.trim()) errs.name = "Company name is required";
    if (data.name.length > 100) errs.name = "Max 100 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /** Save */
  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(data);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Company Profile */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-indigo-400" />
          Company Profile
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Company Name</label>
            <input
              value={data.name}
              onChange={(e) => setData({ ...data, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1.5">Description</label>
            <textarea
              value={data.description}
              onChange={(e) => setData({ ...data, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-amber-400" />
          Notifications
        </h3>
        <div className="space-y-3">
          {[
            { key: "telegramEnabled" as const, label: "Telegram Notifications", desc: "Send alerts via Telegram bot" },
            { key: "emailEnabled" as const, label: "Email Notifications", desc: "Send alerts via email" },
            { key: "budgetAlerts" as const, label: "Budget Alerts", desc: "Alert when budget threshold reached" },
            { key: "taskComplete" as const, label: "Task Completion", desc: "Notify when tasks complete" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F19] border border-[#1E2535]">
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
              <button
                onClick={() => setData({ ...data, [item.key]: !data[item.key] })}
                className={`w-10 h-6 rounded-full transition-all relative ${
                  data[item.key] ? "bg-indigo-500" : "bg-gray-700"
                }`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                  data[item.key] ? "left-5" : "left-1"
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-all"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Changes
      </button>
    </div>
  );
}
