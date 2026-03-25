"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CompanyForm } from "./components/company-form";
import { DepartmentList } from "./components/department-list";
import {
  Settings,
  Building2,
  Users,
  Loader2,
  Server,
  Send,
} from "lucide-react";
import dynamic from "next/dynamic";

// Lazy load the OpenClaw settings component to avoid heavy initial load
const OpenClawSettingsPage = dynamic(
  () => import("./openclaw/page"),
  { loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div> }
);

const TelegramSettingsPage = dynamic(
  () => import("./telegram/page"),
  { loading: () => <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div> }
);

/** Department */
interface DeptItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

type Tab = "company" | "departments" | "openclaw" | "telegram";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "company", label: "Company", icon: Building2 },
  { id: "departments", label: "Departments", icon: Users },
  { id: "openclaw", label: "OpenClaw", icon: Server },
  { id: "telegram", label: "Telegram", icon: Send },
];

/**
 * Settings page — Company profile + Department management + OpenClaw config.
 */
export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as Tab) || "company";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [departments, setDepartments] = useState<DeptItem[]>([]);
  const [loading, setLoading] = useState(true);

  /** Fetch departments */
  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const json = await res.json();
      setDepartments(json.data ?? []);
    } catch {
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  /** Handle tab change */
  function handleTabChange(newTab: Tab) {
    setTab(newTab);
    // Update URL without navigation for bookmarkability
    router.replace(`/settings?tab=${newTab}`, { scroll: false });
  }

  /** Save company */
  async function handleSaveCompany(data: { name: string; description: string }) {
    console.log("[Settings] Saving company:", data);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-gray-400" />
          Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Company configuration, departments, and OpenClaw engine settings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B0F19] rounded-xl p-1 border border-[#1E2535] w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
              tab === id
                ? "bg-indigo-500/20 text-indigo-400"
                : "text-gray-500 hover:text-white"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "company" ? (
        <CompanyForm onSave={handleSaveCompany} />
      ) : tab === "departments" ? (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : (
          <DepartmentList departments={departments} onRefresh={fetchDepartments} />
        )
      ) : tab === "openclaw" ? (
        <OpenClawSettingsPage />
      ) : tab === "telegram" ? (
        <TelegramSettingsPage />
      ) : null}
    </div>
  );
}