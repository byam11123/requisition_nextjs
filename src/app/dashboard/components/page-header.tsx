"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  align?: "center" | "end";
};

export default function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  align = "center",
}: PageHeaderProps) {
  const alignmentClass =
    align === "end"
      ? "xl:flex-row xl:items-end xl:justify-between"
      : "sm:flex-row sm:items-center sm:justify-between";

  return (
    <div className={`flex flex-col gap-4 ${alignmentClass}`}>
      <div className="space-y-2">
        {eyebrow ? <div>{eyebrow}</div> : null}
        <h1 className="text-xl font-bold text-[var(--app-text)] sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="max-w-3xl text-sm leading-6 text-[var(--app-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{actions}</div> : null}
    </div>
  );
}
