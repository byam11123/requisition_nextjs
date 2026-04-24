"use client";

import { usePathname } from "next/navigation";

export default function AppContentShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <div className={isDashboard ? "min-h-screen" : "min-h-screen pb-14"}>
      {children}
    </div>
  );
}
