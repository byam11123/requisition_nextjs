"use client";

import type { ReactNode } from "react";

type RegisterTableShellProps = {
  title: string;
  totalCount?: number;
  countLabel?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function RegisterTableShell({
  title,
  totalCount,
  countLabel = "total results",
  children,
  footer,
}: RegisterTableShellProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)]">
      <div className="flex flex-col gap-2 border-b border-[var(--app-border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <h2 className="text-base font-semibold text-[var(--app-text)] sm:text-lg">{title}</h2>
        {typeof totalCount === "number" ? (
          <span className="text-xs text-[var(--app-muted)]">
            {totalCount} {countLabel}
          </span>
        ) : null}
      </div>
      <div className="overflow-x-auto">{children}</div>
      {footer ? footer : null}
    </div>
  );
}
