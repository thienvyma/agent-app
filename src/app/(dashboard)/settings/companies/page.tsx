"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Loader2,
  CheckCircle2,
  Trash2,
  Users,
  BarChart3,
  X,
} from "lucide-react";

/** Company from API */
interface Company {
  id: string;
  name: string;
  description: string | null;
  config: unknown;
  createdAt: string;
  departments?: { id: string; name: string }[];
}

/**
 * Multi-Tenant Company Management UI.
 * Create, view, and manage multiple companies/tenants.
 */
export default function MultiTenantPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await fetch("/api/company?limit=50");
      const json = await res.json();
      setCompanies(json.data ?? []);
      // Set first company as active if none selected
      if (!activeId && json.data?.length > 0) {
        setActiveId(json.data[0].id);
      }
    } catch (err) {
      console.error("[MultiTenant] fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function handleCreate() {
    if (!createName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim(), description: createDesc.trim() || null }),
      });
      if (res.ok) {
        setCreateName("");
        setCreateDesc("");
        setShowCreate(false);
        await fetchCompanies();
      }
    } catch (err) {
      console.error("[MultiTenant] create error:", err);
    } finally {
      setCreating(false);
    }
  }

  const activeCompany = companies.find((c) => c.id === activeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header + Create */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Companies ({companies.length})
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">Manage multiple companies/tenants</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 rounded-lg text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          New Company
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 rounded-xl bg-[#111827] border border-[#1E2535] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">Create Company</h4>
            <button onClick={() => setShowCreate(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <input
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            placeholder="Company name"
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <textarea
            value={createDesc}
            onChange={(e) => setCreateDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-4 py-2.5 bg-[#0B0F19] border border-[#1E2535] rounded-xl text-gray-200 text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={handleCreate}
            disabled={!createName.trim() || creating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-40"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Create
          </button>
        </div>
      )}

      {/* Company List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {companies.map((company) => (
          <button
            key={company.id}
            onClick={() => setActiveId(company.id)}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeId === company.id
                ? "bg-indigo-500/5 border-indigo-500/30"
                : "bg-[#111827] border-[#1E2535] hover:border-[#2A303C]"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                activeId === company.id
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-[#1E2535] text-gray-400"
              }`}>
                {company.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{company.name}</p>
                <p className="text-[10px] text-gray-500">
                  {new Date(company.createdAt).toLocaleDateString()}
                </p>
              </div>
              {activeId === company.id && (
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              )}
            </div>
            {company.description && (
              <p className="text-xs text-gray-500 truncate">{company.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {company.departments?.length ?? 0} depts
              </span>
            </div>
          </button>
        ))}
        {companies.length === 0 && (
          <div className="col-span-full p-8 text-center bg-[#111827] border border-[#1E2535] rounded-xl">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No companies yet</p>
            <p className="text-xs text-gray-600 mt-1">Click "New Company" to create one</p>
          </div>
        )}
      </div>

      {/* Active Company Details */}
      {activeCompany && (
        <div className="p-5 rounded-xl bg-[#111827] border border-[#1E2535]">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            {activeCompany.name} — Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
              <p className="text-[10px] text-gray-500 uppercase">ID</p>
              <p className="text-xs text-gray-300 font-mono mt-1 truncate">{activeCompany.id}</p>
            </div>
            <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
              <p className="text-[10px] text-gray-500 uppercase">Created</p>
              <p className="text-xs text-gray-300 mt-1">{new Date(activeCompany.createdAt).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
              <p className="text-[10px] text-gray-500 uppercase">Departments</p>
              <p className="text-xs text-gray-300 mt-1">{activeCompany.departments?.length ?? 0}</p>
            </div>
            <div className="p-3 bg-[#0B0F19] rounded-lg border border-[#1E2535]">
              <p className="text-[10px] text-gray-500 uppercase">Description</p>
              <p className="text-xs text-gray-300 mt-1 truncate">{activeCompany.description || "—"}</p>
            </div>
          </div>
          {/* Departments list */}
          {activeCompany.departments && activeCompany.departments.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Departments</p>
              <div className="flex flex-wrap gap-2">
                {activeCompany.departments.map((dept) => (
                  <span key={dept.id} className="px-3 py-1.5 bg-[#0B0F19] border border-[#1E2535] rounded-lg text-xs text-gray-300">
                    {dept.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
