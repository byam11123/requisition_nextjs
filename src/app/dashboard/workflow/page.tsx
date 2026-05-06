"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import { useEffect, useMemo, useState } from "react";
import { Check, GitBranch, Loader2, Save } from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import PageHeader from "@/app/dashboard/components/page-header";
import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  REQUISITION_WORKFLOW_STEP_ORDER,
  type RequisitionWorkflowConfig,
} from "@/lib/config/requisition-workflow-config";

type RoleOption = {
  key: string;
  name: string;
  baseRole: string;
};

export default function WorkflowConfigPage() {
  const [userRole] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = JSON.stringify(useAuthStore.getState().user);
    if (!storedUser) {
      return null;
    }

    try {
          return JSON.parse(storedUser).role || null;
    } catch {
      return null;
    }
  });
  const [config, setConfig] = useState<RequisitionWorkflowConfig>(
    DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  );
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [moduleDefaults, setModuleDefaults] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = useAuthStore.getState().token;
        const [configRes, rolesRes, usersRes] = await Promise.all([
          fetch("/api/workflow-config/requisition", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/custom-roles", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (configRes.ok) setConfig(await configRes.json());
        if (rolesRes.ok) setRoleOptions(await rolesRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());

        // Fetch module defaults
        const modules = ['GENERAL', 'VEHICLE_FUEL', 'DRIVER_ATTENDANCE', 'SALARY_ADVANCE', 'REPAIR_MAINTENANCE'];
        const defaultsMap: Record<string, any> = {};
        await Promise.all(modules.map(async (m) => {
          const res = await fetch(`/api/workflow-defaults?module=${m}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            if (data) defaultsMap[m] = data;
          }
        }));
        setModuleDefaults(defaultsMap);










      } catch {
        setToast({ message: "Failed to load workflow data.", tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const saveModuleDefault = async (module: string, data: any) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/workflow-defaults", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ module, ...data }),
      });
      if (res.ok) {
        const updated = await res.json();
        setModuleDefaults(prev => ({ ...prev, [module]: updated }));
        setToast({ message: `${module} defaults saved.`, tone: "success" });
      }
    } catch (err) {
      setToast({ message: "Failed to save module defaults.", tone: "error" });
    }
  };

  const orderedSteps = useMemo(
    () =>
      REQUISITION_WORKFLOW_STEP_ORDER.map((key) =>
        config.steps.find((step) => step.key === key),
      ).filter((step): step is RequisitionWorkflowConfig["steps"][number] => Boolean(step)),
    [config],
  );

  const updateStep = (
    key: string,
    updater: (step: RequisitionWorkflowConfig["steps"][number]) => RequisitionWorkflowConfig["steps"][number],
  ) => {
    setConfig((prev) => ({
      steps: prev.steps.map((step) => (step.key === key ? updater(step) : step)),
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/workflow-config/requisition", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: "Save failed" }));
        throw new Error(payload.error || "Save failed");
      }

      setConfig(await res.json());
      setToast({ message: "Requisition workflow saved.", tone: "success" });
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save requisition workflow.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={28} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <PageHeader
        title="Workflow Config"
        subtitle="Configure the requisition flow without rewriting the module. For now this is scoped to requisitions only, and the same pattern can later be extended to the other pages."
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || userRole !== "ADMIN"}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Workflow
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <GitBranch size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--app-text)]">Requisition Steps</h2>
              <p className="text-sm text-[var(--app-muted)]">
                Enable the steps you want and decide who can act on each one.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orderedSteps.map((step, index) => (
              <div
                key={step.key}
                className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-xs font-semibold text-[var(--app-text)]">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                          {step.key}
                        </p>
                        <input
                          value={step.label}
                          onChange={(event) =>
                            updateStep(step.key, (current) => ({
                              ...current,
                              label: event.target.value,
                            }))
                          }
                          disabled={userRole !== "ADMIN"}
                          className="mt-1 w-full bg-transparent text-lg font-semibold text-[var(--app-text)] outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <p className="max-w-2xl text-sm text-[var(--app-muted)]">{step.description}</p>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-sm text-[var(--app-text)]">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={(event) =>
                        updateStep(step.key, (current) => ({
                          ...current,
                          enabled: event.target.checked,
                        }))
                      }
                      disabled={userRole !== "ADMIN"}
                      className="h-4 w-4 rounded border-[var(--app-border-strong)] bg-[var(--app-panel)] text-indigo-500"
                    />
                    Enable Step
                  </label>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                    Allowed Roles
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {roleOptions.map((roleOption) => {
                      const selected = step.roles.includes(roleOption.key);
                      return (
                        <label
                          key={`${step.key}-${roleOption.key}`}
                          className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition-colors ${
                            selected
                              ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-200"
                              : "border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)]"
                          }`}
                        >
                          <span>{roleOption.name}</span>
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={userRole !== "ADMIN"}
                            onChange={(event) =>
                              updateStep(step.key, (current) => ({
                                ...current,
                                roles: event.target.checked
                                  ? [...current.roles, roleOption.key]
                                  : current.roles.filter((role) => role !== roleOption.key),
                              }))
                            }
                            className="h-4 w-4 rounded border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] text-indigo-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Live Preview</h2>
            <p className="mt-1 text-sm text-[var(--app-muted)]">
              This is the order the requisition detail page will follow.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Create
              </div>
              {orderedSteps
                .filter((step) => step.enabled)
                .map((step) => (
                  <div
                    key={`preview-${step.key}`}
                    className="flex items-center justify-between rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--app-text)]">{step.label}</p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        {step.roles
                          .map((roleKey) => roleOptions.find((entry) => entry.key === roleKey)?.name || roleKey)
                          .join(" / ")}
                      </p>
                    </div>
                    <Check size={14} className="text-[var(--app-muted)]" />
                  </div>
                ))}
            </div>
          </section>

          {/* New Section: Default Assignees */}
          <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-[var(--app-text)]">Default Assignees</h2>
              <p className="text-xs text-indigo-400 font-medium bg-indigo-500/10 px-2 py-1 rounded-lg">Workflow v2</p>
            </div>
            <div className="space-y-6">
              {[
                { key: 'GENERAL', label: 'General Requisition' },
                { key: 'VEHICLE_FUEL', label: 'Vehicle Fuel' },
                { key: 'DRIVER_ATTENDANCE', label: 'Driver Attendance' },
                { key: 'SALARY_ADVANCE', label: 'Salary Advance' },
                { key: 'REPAIR_MAINTENANCE', label: 'Repair & Maintenance' }
              ].map((m) => (
                <div key={m.key} className="space-y-3 p-4 rounded-2xl bg-[var(--app-panel)] border border-[var(--app-border)]">
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">{m.label}</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Default Approver</label>
                      <select
                        value={moduleDefaults[m.key]?.defaultApproverId || ''}
                        onChange={(e) => saveModuleDefault(m.key, { ...moduleDefaults[m.key], defaultApproverId: e.target.value })}
                        className="w-full bg-[var(--app-surface-strong)] border border-[var(--app-border)] rounded-xl px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:border-indigo-500/50"
                      >
                        <option value="">No Default</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                      </select>
                    </div>
                    {(m.key !== 'DRIVER_ATTENDANCE') && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Default Payer</label>
                        <select
                          value={moduleDefaults[m.key]?.defaultPayerId || ''}
                          onChange={(e) => saveModuleDefault(m.key, { ...moduleDefaults[m.key], defaultPayerId: e.target.value })}
                          className="w-full bg-[var(--app-surface-strong)] border border-[var(--app-border)] rounded-xl px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:border-indigo-500/50"
                        >
                          <option value="">No Default</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                        </select>
                      </div>
                    )}
                    {(m.key === 'GENERAL' || m.key === 'VEHICLE_FUEL' || m.key === 'REPAIR_MAINTENANCE') && (
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Default Dispatcher</label>
                        <select
                          value={moduleDefaults[m.key]?.defaultDispatcherId || ''}
                          onChange={(e) => saveModuleDefault(m.key, { ...moduleDefaults[m.key], defaultDispatcherId: e.target.value })}
                          className="w-full bg-[var(--app-surface-strong)] border border-[var(--app-border)] rounded-xl px-3 py-2 text-sm text-[var(--app-text)] outline-none focus:border-indigo-500/50"
                        >
                          <option value="">No Default</option>
                          {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">Notes</h2>
            <div className="mt-4 space-y-3 text-sm text-[var(--app-muted)]">
              <p>Disabled steps disappear from the requisition detail action flow.</p>
              <p>Later enabled steps wait for the earlier enabled step to finish first.</p>
              <p>Rejected, hold, or review approvals stop the forward flow until approval changes again.</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}






