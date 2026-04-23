"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import ActionIconButton from "@/app/dashboard/components/action-icon-button";
import FormSelect, {
  type FormSelectOption,
} from "@/app/dashboard/components/form-select";
import PageHeader from "@/app/dashboard/components/page-header";

type RoleOption = {
  key: string;
  name: string;
  baseRole: string;
};

type DesignationRow = {
  key: string;
  name: string;
  description: string;
  department: string;
  defaultCustomRoleKey: string;
  isSystem: boolean;
};

function DesignationModal({
  open,
  designation,
  onClose,
  onSaved,
  roles,
}: {
  open: boolean;
  designation: DesignationRow | null;
  onClose: () => void;
  onSaved: (rows: DesignationRow[], message: string) => void;
  roles: RoleOption[];
}) {
  const [form, setForm] = useState(() =>
    designation
      ? {
          name: designation.name,
          description: designation.description,
          department: designation.department,
          defaultCustomRoleKey: designation.defaultCustomRoleKey,
        }
      : {
          name: "",
          description: "",
          department: "",
          defaultCustomRoleKey: "",
        },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const roleOptions: FormSelectOption<string>[] = [
    { value: "", label: "No auto-fill" },
    ...roles.map((role) => ({
      value: role.key,
      label: `${role.name} (${role.baseRole})`,
    })),
  ];

  if (!open) {
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const endpoint = designation ? `/api/designations/${designation.key}` : "/api/designations";
      const method = designation ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to save designation");
      }
      onSaved(await res.json(), designation ? "Designation updated." : "Designation created.");
      onClose();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const inputClassName =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-100">
            {designation ? "Edit Designation" : "Create Designation"}
          </h2>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="mb-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Designation Name
            </label>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Assistant Purchase Manager"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Default Department
            </label>
            <input
              value={form.department}
              onChange={(event) =>
                setForm((current) => ({ ...current, department: event.target.value }))
              }
              placeholder="Procurement"
              className={inputClassName}
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Default Custom Role
            </label>
            <FormSelect
              value={form.defaultCustomRoleKey}
              options={roleOptions}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  defaultCustomRoleKey: value,
                }))
              }
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              rows={4}
              placeholder="Optional notes about where this designation is used."
              className={`${inputClassName} resize-none`}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            {saving ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Save Designation"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DesignationsPage() {
  const [designations, setDesignations] = useState<DesignationRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDesignation, setModalDesignation] = useState<DesignationRow | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);

  const loadDesignations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/designations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load designations");
      }
      setDesignations(await res.json());
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to load designations.",
        tone: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/custom-roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error("Failed to load custom roles");
      }
      setRoles(await res.json());
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to load custom roles.",
        tone: "error",
      });
    }
  };

  const getRoleLabel = (roleKey: string) => {
    if (!roleKey) {
      return "No default role";
    }

    const matchedRole = roles.find((entry) => entry.key === roleKey);
    return matchedRole ? matchedRole.name : roleKey;
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDesignations();
      void loadRoles();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const handleDelete = async (key: string) => {
    if (!confirm("Delete this designation?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/designations/${key}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || "Delete failed");
      }
      setDesignations(await res.json());
      setToast({ message: "Designation deleted.", tone: "success" });
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Delete failed.",
        tone: "error",
      });
    }
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <PageHeader
        title="Designations"
        subtitle="Keep job titles clean and reusable across your organization user records."
        actions={
          <button
            onClick={() => {
              setModalDesignation(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            <Plus size={16} /> New Designation
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex min-h-[30vh] items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
        ) : designations.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-slate-900/40 px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 text-slate-400">
              <BriefcaseBusiness size={20} />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-slate-100">No designations yet</h2>
            <p className="mt-2 text-sm text-slate-400">
              Start by adding the job titles your organization actually uses.
            </p>
          </div>
        ) : (
          designations.map((designation) => (
            <div
              key={designation.key}
              className="rounded-3xl border border-white/5 bg-slate-900/50 p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
                    <BriefcaseBusiness size={18} />
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-slate-100">
                    {designation.name}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {designation.department || "No default department"}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">
                    {designation.description || "No description yet."}
                  </p>
                  <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                    {getRoleLabel(designation.defaultCustomRoleKey)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ActionIconButton
                    onClick={() => {
                      setModalDesignation(designation);
                      setModalOpen(true);
                    }}
                    icon={Pencil}
                    label="Edit designation"
                    tone="slate"
                  />
                  <ActionIconButton
                    onClick={() => handleDelete(designation.key)}
                    icon={Trash2}
                    label="Delete designation"
                    tone="rose"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <DesignationModal
        key={`${modalDesignation?.key ?? "new"}-${modalOpen ? "open" : "closed"}`}
        open={modalOpen}
        designation={modalDesignation}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSaved={(nextRows, message) => {
          setDesignations(nextRows);
          setToast({ message, tone: "success" });
        }}
      />
    </div>
  );
}
