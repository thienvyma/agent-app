"use client";

import { useState, useEffect, useCallback } from "react";
import { CompanyForm } from "./components/company-form";
import { DepartmentList } from "./components/department-list";
import {
  Settings,
  Building2,
  Users,
  Loader2,
} from "lucide-react";

/** Department */
interface DeptItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

type Tab = "company" | "departments";

/**
 * Settings page — Company profile + Department management.
 */
export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("company");
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
          Company configuration and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0B0F19] rounded-xl p-1 border border-[#1E2535] w-fit">
        <button
          onClick={() => setTab("company")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            tab === "company"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Company
        </button>
        <button
          onClick={() => setTab("departments")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 ${
            tab === "departments"
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Departments
        </button>
      </div>

      {/* Content */}
      {tab === "company" ? (
        <CompanyForm onSave={handleSaveCompany} />
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
      ) : (
        <DepartmentList departments={departments} onRefresh={fetchDepartments} />
      )}
    </div>
  );
}