"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, GitBranch, Loader2, Save } from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  REQUISITION_WORKFLOW_STEP_ORDER,
  type RequisitionWorkflowConfig,
} from "@/lib/requisition-workflow-config";

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

    const storedUser = localStorage.getItem("user");
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

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/workflow-config/requisition", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setConfig(await res.json());

        const rolesRes = await fetch("/api/custom-roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (rolesRes.ok) setRoleOptions(await rolesRes.json());
      } catch {
        setToast({ message: "Failed to load requisition workflow.", tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, []);

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
      const token = localStorage.getItem("token");
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

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Workflow Config</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Configure the requisition flow without rewriting the module. For now this is
            scoped to requisitions only, and the same pattern can later be extended to the
            other pages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || userRole !== "ADMIN"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Workflow
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300">
              <GitBranch size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Requisition Steps</h2>
              <p className="text-sm text-slate-500">
                Enable the steps you want and decide who can act on each one.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {orderedSteps.map((step, index) => (
              <div
                key={step.key}
                className="rounded-2xl border border-white/5 bg-slate-950/30 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-slate-900 text-xs font-semibold text-slate-300">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                          className="mt-1 w-full bg-transparent text-lg font-semibold text-slate-100 outline-none disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <p className="max-w-2xl text-sm text-slate-400">{step.description}</p>
                  </div>

                  <label className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
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
                      className="h-4 w-4 rounded border-white/20 bg-slate-950 text-indigo-500"
                    />
                    Enable Step
                  </label>
                </div>

                <div className="mt-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
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
                              : "border-white/5 bg-slate-900/40 text-slate-400"
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
                            className="h-4 w-4 rounded border-white/20 bg-slate-950 text-indigo-500"
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
          <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Live Preview</h2>
            <p className="mt-1 text-sm text-slate-500">
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
                    className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-100">{step.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {step.roles
                          .map((roleKey) => roleOptions.find((entry) => entry.key === roleKey)?.name || roleKey)
                          .join(" / ")}
                      </p>
                    </div>
                    <Check size={14} className="text-slate-500" />
                  </div>
                ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-slate-100">Notes</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-400">
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
