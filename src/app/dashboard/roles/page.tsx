"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, UserCog, X } from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import ActionIconButton from "@/components/ui/action-icon-button";
import FormSelect, {
  type FormSelectOption,
} from "@/components/ui/form-select";
import PageHeader from "@/app/dashboard/components/page-header";
import { DASHBOARD_PAGE_OPTIONS } from "@/lib/config/page-access";
import ConfirmationModal from "@/components/ui/confirmation-modal";

type RoleRow = {
  key: string;
  name: string;
  description: string;
  baseRole: string;
  pageAccess: string[];
  isSystem: boolean;
};

function RoleModal({
  open,
  role,
  onClose,
  onSaved,
}: {
  open: boolean;
  role: RoleRow | null;
  onClose: () => void;
  onSaved: (roles: RoleRow[], message: string) => void;
}) {
  const [form, setForm] = useState(() =>
    role
      ? {
          name: role.name,
          description: role.description,
          baseRole: role.baseRole,
          pageAccess: role.pageAccess,
        }
      : {
          name: "",
          description: "",
          baseRole: "PURCHASER",
          pageAccess: ["overview", "requisition", "profile", "newRequisition"],
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const baseRoleOptions: FormSelectOption<string>[] = [
    { value: "ADMIN", label: "Admin" },
    { value: "MANAGER", label: "Manager" },
    { value: "PURCHASER", label: "Purchaser" },
    { value: "ACCOUNTANT", label: "Accountant" },
  ];

  if (!open) return null;

  const togglePage = (pageKey: string) => {
    setForm((current) => ({
      ...current,
      pageAccess: current.pageAccess.includes(pageKey)
        ? current.pageAccess.filter((entry) => entry !== pageKey)
        : [...current.pageAccess, pageKey],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = role ? `/api/custom-roles/${role.key}` : "/api/custom-roles";
      const method = role ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed to save role");
      onSaved(await res.json(), role ? "Role updated." : "Role created.");
      onClose();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">{role ? "Edit Custom Role" : "Create Custom Role"}</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>
        {error ? <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
            placeholder="Role name" className="rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50" />
          <FormSelect
            value={form.baseRole}
            options={baseRoleOptions}
            onChange={(value) => setForm((current) => ({ ...current, baseRole: value }))}
          />
          <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
            rows={3} placeholder="Role description"
            className="md:col-span-2 rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50 resize-none" />
        </div>
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Default Page Access</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {DASHBOARD_PAGE_OPTIONS.map((page) => {
              const checked = form.pageAccess.includes(page.key);
              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => togglePage(page.key)}
                  className={`rounded-2xl border p-3 text-left transition-colors sm:p-4 ${checked ? "border-indigo-500/30 bg-indigo-500/10" : "border-white/5 bg-slate-950/40"}`}
                >
                  <p className="text-sm font-semibold text-slate-100">{page.label}</p>
                  <p className="mt-1 text-xs text-slate-500">{page.description}</p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
            {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<RoleRow | null>(null);
  const [deleteRoleKey, setDeleteRoleKey] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/custom-roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setRoles(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRoles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleDelete = async (key: string) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/custom-roles/${key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error || "Delete failed");
      setRoles(await res.json());
      setToast({ message: "Role deleted.", tone: "success" });
    } catch (error: unknown) {
      setToast({ message: error instanceof Error ? error.message : "Delete failed.", tone: "error" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast ? <ActionToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} /> : null}

      <PageHeader
        title="Custom Roles"
        subtitle="Create business-specific roles on top of the base capability roles."
        actions={
          <button onClick={() => { setModalRole(null); setModalOpen(true); }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
            <Plus size={16} /> New Role
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex min-h-[30vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
        ) : roles.map((role) => (
          <div key={role.key} className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
                  <UserCog size={18} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-100">{role.name}</h2>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">{role.baseRole}</p>
                <p className="mt-3 text-sm text-slate-400">{role.description || "No description yet."}</p>
              </div>
              {!role.isSystem ? (
                <div className="flex gap-2 self-start sm:self-auto">
                  <ActionIconButton onClick={() => { setModalRole(role); setModalOpen(true); }}
                    icon={Pencil} label="Edit role" tone="slate" />
                  <ActionIconButton onClick={() => setDeleteRoleKey(role.key)}
                    icon={Trash2} label="Delete role" tone="rose" />
                </div>
              ) : null}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {role.pageAccess.map((pageKey) => (
                <span key={`${role.key}-${pageKey}`} className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs text-slate-300">
                  {pageKey}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={!!deleteRoleKey}
        onClose={() => setDeleteRoleKey(null)}
        onConfirm={() => {
          if (deleteRoleKey) handleDelete(deleteRoleKey);
        }}
        title="Delete Role?"
        message="Are you sure you want to delete this custom role? This might affect users assigned to it."
        confirmLabel="Yes, Delete Role"
        tone="danger"
      />

      <RoleModal
        key={`${modalRole?.key ?? 'new'}-${modalOpen ? 'open' : 'closed'}`}
        open={modalOpen}
        role={modalRole}
        onClose={() => setModalOpen(false)}
        onSaved={(nextRoles, message) => {
          setRoles(nextRoles);
          setToast({ message, tone: "success" });
        }}
      />
    </div>
  );
}
