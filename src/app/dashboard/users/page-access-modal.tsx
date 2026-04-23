"use client";

import { useMemo, useState } from "react";
import { CheckSquare, Loader2, ShieldCheck, Square, X } from "lucide-react";

import {
  DASHBOARD_PAGE_OPTIONS,
  DashboardPageKey,
  DashboardRole,
  ROLE_DEFAULT_PAGE_ACCESS,
} from "@/lib/page-access";

type UserRow = {
  id: string;
  fullName?: string | null;
  email?: string | null;
  role: DashboardRole;
  pageAccess?: DashboardPageKey[] | null;
};

type PageAccessModalProps = {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  onSaved: (pageAccess: DashboardPageKey[]) => void;
  onToast: (message: string, tone?: "success" | "error") => void;
};

export default function PageAccessModal({
  open,
  user,
  onClose,
  onSaved,
  onToast,
}: PageAccessModalProps) {
  const defaultPages = useMemo(
    () => (user ? ROLE_DEFAULT_PAGE_ACCESS[user.role] : []),
    [user],
  );

  const [selectedPages, setSelectedPages] = useState<DashboardPageKey[]>(
    () => user?.pageAccess ?? defaultPages,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!open || !user) {
    return null;
  }

  const togglePage = (pageKey: DashboardPageKey) => {
    setSelectedPages((current) =>
      current.includes(pageKey)
        ? current.filter((entry) => entry !== pageKey)
        : [...current, pageKey],
    );
  };

  const applyRoleDefault = () => {
    setSelectedPages(defaultPages);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const token = window.localStorage.getItem("token");
      const response = await fetch(`/api/users/${user.id}/page-access`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pages: selectedPages }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to save access");
      }

      const payload = (await response.json()) as { pageAccess: DashboardPageKey[] };
      onSaved(payload.pageAccess);
      onToast("Page access saved successfully.", "success");
      onClose();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Save failed";
      setError(message);
      onToast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-300">
              <ShieldCheck size={18} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-100">
              Page Access Control
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose which dashboard pages {user.fullName || user.email} can see.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 rounded-2xl border border-white/5 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Role Default
              </p>
              <p className="mt-1 text-sm text-slate-300">
                {user.role} starts with {defaultPages.length} default page permissions.
              </p>
            </div>
            <button
              type="button"
              onClick={applyRoleDefault}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5"
            >
              Use Role Default
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {DASHBOARD_PAGE_OPTIONS.map((page) => {
            const checked = selectedPages.includes(page.key);
            return (
              <button
                key={page.key}
                type="button"
                onClick={() => togglePage(page.key)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  checked
                    ? "border-indigo-500/30 bg-indigo-500/10"
                    : "border-white/5 bg-slate-950/40 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {page.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {page.description}
                    </p>
                  </div>
                  <div className={checked ? "text-indigo-300" : "text-slate-600"}>
                    {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {selectedPages.length} page permissions selected
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex min-w-28 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Save Access"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
