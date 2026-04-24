"use client";

import type { LucideIcon } from "lucide-react";

type StatCardTone =
  | "amber"
  | "emerald"
  | "sky"
  | "purple"
  | "rose"
  | "indigo";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  tone: StatCardTone;
  helper?: string;
  active?: boolean;
  onClick?: () => void;
};

const toneClasses: Record<StatCardTone, string> = {
  amber:
    "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.08)]",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.08)]",
  purple:
    "border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_0_1px_rgba(168,85,247,0.08)]",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_0_1px_rgba(244,63,94,0.08)]",
  indigo:
    "border-indigo-500/30 bg-indigo-500/10 text-indigo-200 shadow-[0_0_0_1px_rgba(99,102,241,0.08)]",
};

export default function StatCard({
  title,
  value,
  icon: Icon,
  tone,
  helper,
  active = false,
  onClick,
}: StatCardProps) {
  const toneClass = toneClasses[tone];
  const Container = onClick ? "button" : "div";
  const baseClassName =
    "group relative overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 text-left transition-all duration-200 sm:p-5";
  const inactiveClassName =
    "hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]";
  const activeClassName = `${toneClass} shadow-lg shadow-slate-950/30`;

  return (
    <Container
      {...(onClick ? { type: "button", onClick } : {})}
      className={`${baseClassName} ${onClick ? "cursor-pointer hover:-translate-y-0.5" : ""} ${
        active ? activeClassName : inactiveClassName
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
            {title}
          </p>
          <p className="mt-3 text-2xl font-bold leading-none text-[var(--app-text)] sm:text-3xl">
            {value}
          </p>
          {helper ? (
            <p className="mt-2 max-w-[22ch] text-xs leading-5 text-[var(--app-muted)] sm:mt-3">
              {helper}
            </p>
          ) : null}
        </div>
        <div
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12 ${toneClass}`}
        >
          <Icon size={18} strokeWidth={2} className="sm:hidden" />
          <Icon size={22} strokeWidth={2} className="hidden sm:block" />
        </div>
      </div>
    </Container>
  );
}
