"use client";

import type { ReactNode } from "react";

const labelClassName =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

export function DetailInfoRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-6">
      <p className={labelClassName}>{label}</p>
      <div className="text-slate-100">{value}</div>
    </div>
  );
}

export function DetailInfoField({
  label,
  value,
  fallback = "-",
}: {
  label: string;
  value?: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <div>
      <p className={`mb-1 ${labelClassName}`}>{label}</p>
      <div className="text-slate-200">{value || fallback}</div>
    </div>
  );
}

