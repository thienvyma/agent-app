"use client";

import { useState } from "react";
import { Users, Plus, Trash2, Loader2, X } from "lucide-react";

/** Department item */
interface DeptItem {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

interface DepartmentListProps {
  departments: DeptItem[];
  onRefresh: () => void;
}

/**
 * Department list with hierarchy display and add/delete actions.
 */
export function DepartmentList({ departments, onRefresh }: DepartmentListProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  /** Top-level departments */
  const topLevel = departments.filter((d) => d.parentId === null);

  /** Get children of a parent */
  function getChildren(parentId: string) {
    return departments.filter((d) => d.parentId === parentId);
  }

  /** Add department */
  async function handleAdd() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
      });
      setNewName("");
      setNewDesc("");
      setShowAdd(false);
      onRefresh();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 rounded-xl bg-[#111827] border border-[#1E2535]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-400" />
          Departments
        </h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? "Cancel" : "Add"}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-4 p-4 rounded-lg bg-[#0B0F19] border border-[#1E2535] space-y-2">
          <input
            placeholder="Department name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E2535] rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <input
            placeholder="Description (optional)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full px-3 py-2 bg-[#111827] border border-[#1E2535] rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={handleAdd}
            disabled={creating || !newName.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-50 transition-all"
          >
            {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Create
          </button>
        </div>
      )}

      {/* Department tree */}
      {topLevel.length === 0 ? (
        <p className="text-sm text-gray-500 italic py-8 text-center">No departments configured</p>
      ) : (
        <div className="space-y-2">
          {topLevel.map((dept) => (
            <div key={dept.id} className="p-4 rounded-lg bg-[#0B0F19] border border-[#1E2535]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{dept.name}</p>
                  {dept.description && (
                    <p className="text-xs text-gray-500 mt-0.5">{dept.description}</p>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 bg-white/5 px-2 py-0.5 rounded">
                  {getChildren(dept.id).length} sub-dept
                </span>
              </div>
              {/* Children */}
              {getChildren(dept.id).length > 0 && (
                <div className="mt-2 ml-4 space-y-1">
                  {getChildren(dept.id).map((child) => (
                    <div key={child.id} className="p-2 rounded bg-white/[0.02] border border-[#1E2535]/50">
                      <p className="text-xs text-gray-300">{child.name}</p>
                      {child.description && (
                        <p className="text-[10px] text-gray-600">{child.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
