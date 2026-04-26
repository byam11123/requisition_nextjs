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
  slate: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  indigo: "border-indigo-500/20 bg-indigo-500/10 text-indigo-300",
  sky: "border-sky-500/20 bg-sky-500/10 text-sky-300",
  emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  amber: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  rose: "border-rose-500/20 bg-rose-500/10 text-rose-300",
  purple: "border-purple-500/20 bg-purple-500/10 text-purple-300",
  orange: "border-orange-500/20 bg-orange-500/10 text-orange-300",
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

