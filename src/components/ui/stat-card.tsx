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
    "border-amber-500/30 bg-amber-500/10 text-amber-300 shadow-[0_0_0_1px_rgba(245,158,11,0.08)] [--card-glow:rgba(245,158,11,0.2)]",
  emerald:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_0_1px_rgba(16,185,129,0.08)] [--card-glow:rgba(16,185,129,0.2)]",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-300 shadow-[0_0_0_1px_rgba(14,165,233,0.08)] [--card-glow:rgba(14,165,233,0.2)]",
  purple:
    "border-purple-500/30 bg-purple-500/10 text-purple-300 shadow-[0_0_0_1px_rgba(168,85,247,0.08)] [--card-glow:rgba(168,85,247,0.2)]",
  rose: "border-rose-500/30 bg-rose-500/10 text-rose-300 shadow-[0_0_0_1px_rgba(244,63,94,0.08)] [--card-glow:rgba(244,63,94,0.2)]",
  indigo:
    "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)] shadow-[0_0_0_1px_var(--app-accent-soft)] [--card-glow:var(--app-glow)]",
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
    "group relative overflow-hidden rounded-3xl border border-white/10 p-5 text-left transition-all duration-300 backdrop-blur-md sm:p-6";
  const inactiveClassName =
    "bg-[var(--app-panel)] hover:bg-[var(--app-surface)] hover:border-[var(--app-accent-border)] hover:shadow-xl";
  const activeClassName = `${toneClass} bg-gradient-to-br from-[var(--app-accent-soft)] to-transparent scale-[1.02] border-[var(--app-accent-border)]`;

  return (
    <Container
      {...(onClick ? { type: "button", onClick } : {})}
      className={`${baseClassName} ${onClick ? "cursor-pointer" : ""} ${
        active ? activeClassName : inactiveClassName
      }`}
      style={{
        boxShadow: active ? `0 10px 25px -10px var(--card-glow)` : 'none'
      }}
    >
      {/* Premium Glow Effect for Active State */}
      {active && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />
      )}
      
      {/* subtle top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="flex items-center justify-between gap-4 relative z-10">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-text)]">
            {title}
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <p className="text-3xl font-bold tracking-tight text-[var(--app-text)] sm:text-4xl">
              {value}
            </p>
            {active && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
              </span>
            )}
          </div>
          {helper ? (
            <p className="mt-2 max-w-[22ch] text-xs leading-5 text-[var(--app-muted)] sm:mt-3">
              {helper}
            </p>
          ) : null}
        </div>
        <div
          className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 ${
            active 
              ? 'bg-[var(--app-accent)] text-white border-white/20 shadow-lg' 
              : 'bg-[var(--app-accent-soft)] border-[var(--app-accent-border)] text-[var(--app-accent-strong)]'
          }`}
        >
          <Icon size={24} strokeWidth={1.5} className={active ? "animate-pulse" : ""} />
        </div>
      </div>

      {/* Background Decorative Gradient */}
      <div 
        className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-30" 
        style={{ backgroundColor: 'var(--card-glow)' }}
      />
    </Container>
  );
}
