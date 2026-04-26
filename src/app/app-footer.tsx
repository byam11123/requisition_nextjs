"use client";

import { usePathname } from "next/navigation";

type AppFooterProps = {
  mode: "dashboard" | "non-dashboard";
  className?: string;
};

export default function AppFooter({
  mode,
  className = "",
}: AppFooterProps) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (mode === "dashboard" && !isDashboard) {
    return null;
  }

  if (mode === "non-dashboard" && isDashboard) {
    return null;
  }

  return (
    <footer className={className}>
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-muted)]">
        Built By Byamkesh Kaiwartya
      </p>
    </footer>
  );
}

