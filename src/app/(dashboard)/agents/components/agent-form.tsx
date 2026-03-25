"use client";

import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface AgentFormProps {
  /** If provided, pre-fills form for editing */
  initialData?: {
    id?: string;
    name?: string;
    role?: string;
    sop?: string;
    model?: string;
    tools?: string[];
    skills?: string[];
    departmentId?: string;
  };
  /** Available departments for the select dropdown */
  departments: { id: string; name: string }[];
  /** Callback on successful submit */
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  /** Callback to close the form */
  onClose: () => void;
}

/**
 * Agent create/edit form modal.
 *
 * @param props - AgentFormProps
 */
export function AgentForm({ initialData, departments, onSubmit, onClose }: AgentFormProps) {
  const isEdit = !!initialData?.id;
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * Validates form data before submission.
   */
  function validateForm(data: {
    name?: string;
    role?: string;
    departmentId?: string;
  }): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = "Name is required";
    if (!data.role?.trim()) errs.role = "Role is required";
    if (!data.departmentId) errs.departmentId = "Department is required";
    return errs;
  }

  /**
   * Handles form submission with validation.
   */
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      sop: formData.get("sop") as string,
      model: formData.get("model") as string,
      departmentId: formData.get("departmentId") as string,
      tools: (formData.get("tools") as string).split(",").map((t) => t.trim()).filter(Boolean),
      skills: (formData.get("skills") as string).split(",").map((s) => s.trim()).filter(Boolean),
    };

    const validationErrors = validateForm(data);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      await onSubmit(data);
    } catch {
      setErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#1A1F2B] border border-[#2A303C] rounded-2xl shadow-2xl z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A303C]">
          <h2 className="text-lg font-semibold text-white">{isEdit ? "Edit Agent" : "Create Agent"}</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-[#2A303C]/50 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Name</label>
            <input
              name="name"
              defaultValue={initialData?.name ?? ""}
              className={`w-full px-4 py-2.5 bg-[#0E1117] border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.name ? "border-red-500" : "border-[#2A303C]"}`}
              placeholder="e.g. Marketing Agent"
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Role</label>
            <input
              name="role"
              defaultValue={initialData?.role ?? ""}
              className={`w-full px-4 py-2.5 bg-[#0E1117] border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.role ? "border-red-500" : "border-[#2A303C]"}`}
              placeholder="e.g. marketing, finance, developer"
            />
            {errors.role && <p className="text-xs text-red-400 mt-1">{errors.role}</p>}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Department</label>
            <select
              name="departmentId"
              defaultValue={initialData?.departmentId ?? ""}
              className={`w-full px-4 py-2.5 bg-[#0E1117] border rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${errors.departmentId ? "border-red-500" : "border-[#2A303C]"}`}
            >
              <option value="">Select department...</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {errors.departmentId && <p className="text-xs text-red-400 mt-1">{errors.departmentId}</p>}
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Model</label>
            <input
              name="model"
              defaultValue={initialData?.model ?? "qwen2.5:7b"}
              className="w-full px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. qwen2.5:7b"
            />
          </div>

          {/* SOP */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">SOP</label>
            <textarea
              name="sop"
              rows={3}
              defaultValue={initialData?.sop ?? ""}
              className="w-full px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="Standard Operating Procedure for this agent..."
            />
          </div>

          {/* Tools + Skills */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Tools</label>
              <input
                name="tools"
                defaultValue={initialData?.tools?.join(", ") ?? ""}
                className="w-full px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="email, search"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Skills</label>
              <input
                name="skills"
                defaultValue={initialData?.skills?.join(", ") ?? ""}
                className="w-full px-4 py-2.5 bg-[#0E1117] border border-[#2A303C] rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="delegation, review"
              />
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <p className="text-sm text-red-400 text-center">{errors.submit}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 rounded-xl hover:bg-[#2A303C]/50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
