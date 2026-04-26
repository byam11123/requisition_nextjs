"use client";

import { LogOut } from "lucide-react";

type DashboardUser = {
  role?: string | null;
  baseRole?: string | null;
  customRoleKey?: string | null;
  customRoleName?: string | null;
  fullName?: string | null;
  email?: string | null;
};

type UserNavProps = {
  user: DashboardUser;
  isSidebarOpen: boolean;
  onLogout: () => void;
};

export default function UserNav({
  user,
  isSidebarOpen,
  onLogout,
}: UserNavProps) {
  if (isSidebarOpen) {
    return (
      <>
        <div className="mb-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)]">
              <span className="text-sm font-semibold text-[var(--app-muted)]">
                {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className="truncate text-sm font-medium text-[var(--app-text)]">
                {user.fullName || user.email || 'User'}
              </p>
              <p className="truncate text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                {user.customRoleName || user.role || 'GUEST'}
              </p>
            </div>
          </div>
        </div>
        <div className="mb-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)]">
        <span className="text-sm font-semibold text-[var(--app-muted)]">
          {user.fullName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
        </span>
      </div>
      <button
        onClick={onLogout}
        title="Logout"
        className="w-full flex items-center justify-center rounded-xl px-3 py-2 text-rose-400 transition-colors hover:bg-rose-500/10"
      >
        <LogOut size={18} />
      </button>
    </div>
  );
}
