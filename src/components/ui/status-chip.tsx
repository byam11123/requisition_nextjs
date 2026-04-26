"use client";

import type { ReactNode } from "react";

export type StatusChipTone =
  | "slate"
  | "indigo"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "purple"
  | "orange";

type StatusChipProps = {
  children: ReactNode;
  tone?: StatusChipTone;
  size?: "xs" | "sm";
  className?: string;
};

const toneClasses: Record<StatusChipTone, string> = {
  slate: "border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)]",
  indigo: "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)]",
  sky: "border-sky-500/20 bg-sky-500/10 text-sky-500 dark:text-sky-400 font-bold",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
  amber: "border-amber-500/20 bg-amber-500/15 text-amber-600 dark:text-amber-500 font-bold",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold",
  purple: "border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold",
  orange: "border-orange-500/20 bg-orange-500/10 text-orange-600 dark:text-orange-500 font-bold",
};

const sizeClasses = {
  xs: "px-2 py-0.5 text-[10px] tracking-[0.18em]",
  sm: "px-3 py-1 text-xs tracking-[0.2em]",
};

export default function StatusChip({
  children,
  tone = "slate",
  size = "xs",
  className = "",
}: StatusChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold uppercase ${sizeClasses[size]} ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

