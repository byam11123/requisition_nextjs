"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Boxes,
  CalendarCheck2,
  Clock3,
  DatabaseZap,
  Fuel,
  GripVertical,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Search,
  Users,
  Wrench,
} from "lucide-react";

import ActionToast from "@/app/dashboard/action-toast";
import PageHeader from "@/app/dashboard/components/page-header";
import StatCard from "@/components/ui/stat-card";
import { canAccessDashboardPath } from "@/lib/config/page-access";

type StoredUser = {
  role?: string;
  fullName?: string;
  pageAccess?: string[] | null;
  rolePageAccess?: string[] | null;
};

type SummaryCardData = {
  totalRecords: number;
  pendingApprovals: number;
  activeUsers: number;
  reminders: number;
};

type ModuleStat = {
  key: "requisitions" | "repair" | "attendance" | "salaryAdvance" | "vehicleFuel" | "store";
  label: string;
  href: string;
  tone: "indigo" | "emerald" | "amber" | "purple" | "sky" | "rose";
  total: number;
  pending: number;
  completed: number;
  attention: number;
};

type TrendPoint = {
  label: string;
  requisitions: number;
  repair: number;
  attendance: number;
  salaryAdvance: number;
  vehicleFuel: number;
  store: number;
};

type SiteBreakdown = {
  label: string;
  value: number;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "indigo" | "emerald" | "amber" | "sky" | "purple" | "rose";
};

type RecentActivity = {
  id: string;
  module: string;
  title: string;
  description: string;
  timestamp: string;
  href: string;
  tone: "indigo" | "emerald" | "amber" | "sky" | "purple" | "rose";
};

type SearchResult = {
  id: string;
  module: string;
  title: string;
  subtitle: string;
  href: string;
  tone: "indigo" | "emerald" | "amber" | "sky" | "purple";
};

type DashboardSummaryResponse = {
  organizationName: string;
  role: string;
  summaryCards: SummaryCardData;
  moduleStats: ModuleStat[];
  trends: TrendPoint[];
  siteBreakdown: SiteBreakdown[];
  notifications: NotificationItem[];
  recentActivity: RecentActivity[];
  searchResults: SearchResult[];
};

type BoardCardId =
  | "trends"
  | "notifications"
  | "recentActivity"
  | "modulePulse"
  | "quickLinks";

type BoardColumnId = "left" | "right";

type BoardLayout = {
  left: BoardCardId[];
  right: BoardCardId[];
};

const BOARD_LAYOUT_STORAGE_KEY = "dashboard-overview-layout-v1";
const DEFAULT_BOARD_LAYOUT: BoardLayout = {
  left: ["trends", "notifications", "modulePulse"],
  right: ["recentActivity", "quickLinks"],
};

function getStoredUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem("user");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function isBoardCardId(value: string): value is BoardCardId {
  return [
    "trends",
    "notifications",
    "recentActivity",
    "modulePulse",
    "quickLinks",
  ].includes(value);
}

function isBoardLayout(value: unknown): value is BoardLayout {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<BoardLayout>;
  const allIds = [...(candidate.left || []), ...(candidate.right || [])];

  return (
    Array.isArray(candidate.left) &&
    Array.isArray(candidate.right) &&
    allIds.length === 5 &&
    allIds.every((entry) => typeof entry === "string" && isBoardCardId(entry)) &&
    new Set(allIds).size === 5
  );
}

function getStoredBoardLayout() {
  if (typeof window === "undefined") {
    return DEFAULT_BOARD_LAYOUT;
  }

  const raw = window.localStorage.getItem(BOARD_LAYOUT_STORAGE_KEY);
  if (!raw) {
    return DEFAULT_BOARD_LAYOUT;
  }

  try {
    const parsed = JSON.parse(raw);
    return isBoardLayout(parsed) ? parsed : DEFAULT_BOARD_LAYOUT;
  } catch {
    return DEFAULT_BOARD_LAYOUT;
  }
}

function locateCard(layout: BoardLayout, cardId: BoardCardId) {
  for (const column of ["left", "right"] as const) {
    const index = layout[column].indexOf(cardId);
    if (index !== -1) {
      return { column, index };
    }
  }

  return null;
}

function swapCards(
  layout: BoardLayout,
  draggedId: BoardCardId,
  targetId: BoardCardId,
) {
  const source = locateCard(layout, draggedId);
  const target = locateCard(layout, targetId);

  if (!source || !target || draggedId === targetId) {
    return layout;
  }

  const nextLayout: BoardLayout = {
    left: [...layout.left],
    right: [...layout.right],
  };

  nextLayout[source.column][source.index] = targetId;
  nextLayout[target.column][target.index] = draggedId;

  return nextLayout;
}

function moveCardToColumnEnd(
  layout: BoardLayout,
  draggedId: BoardCardId,
  targetColumn: BoardColumnId,
) {
  const source = locateCard(layout, draggedId);
  if (!source) {
    return layout;
  }

  if (
    source.column === targetColumn &&
    source.index === layout[targetColumn].length - 1
  ) {
    return layout;
  }

  const nextLayout: BoardLayout = {
    left: [...layout.left],
    right: [...layout.right],
  };

  nextLayout[source.column].splice(source.index, 1);
  nextLayout[targetColumn].push(draggedId);

  return nextLayout;
}

const toneClasses: Record<string, string> = {
  indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  sky: "bg-sky-500/10 text-sky-300 border-sky-500/20",
  purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  rose: "bg-rose-500/10 text-rose-300 border-rose-500/20",
};

const moduleColors: Record<string, string> = {
  requisitions: "bg-indigo-400",
  repair: "bg-emerald-400",
  attendance: "bg-amber-400",
  salaryAdvance: "bg-purple-400",
  vehicleFuel: "bg-sky-400",
  store: "bg-rose-400",
};

export default function OverviewDashboardPage() {
  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    tone: "success" | "error";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [boardLayout, setBoardLayout] =
    useState<BoardLayout>(DEFAULT_BOARD_LAYOUT);
  const [layoutReady, setLayoutReady] = useState(false);
  const [draggedCard, setDraggedCard] = useState<BoardCardId | null>(null);
  const [dragOverCard, setDragOverCard] = useState<BoardCardId | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<BoardColumnId | null>(
    null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBoardLayout(getStoredBoardLayout());
      setLayoutReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!layoutReady) {
      return;
    }

    window.localStorage.setItem(
      BOARD_LAYOUT_STORAGE_KEY,
      JSON.stringify(boardLayout),
    );
  }, [boardLayout, layoutReady]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const token = window.localStorage.getItem("token");
        const url = searchQuery.trim()
          ? `/api/dashboard-summary?q=${encodeURIComponent(searchQuery.trim())}`
          : "/api/dashboard-summary";
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to load dashboard summary");
        }

        const payload = (await response.json()) as DashboardSummaryResponse;
        setSummary(payload);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error(error);
        }
      } finally {
        setLoading(false);
      }
    }, searchQuery.trim() ? 220 : 0);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timer = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadSummary = async (query: string) => {
    const token = window.localStorage.getItem("token");
    const url = query.trim()
      ? `/api/dashboard-summary?q=${encodeURIComponent(query.trim())}`
      : "/api/dashboard-summary";
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to load dashboard summary");
    }

    const payload = (await response.json()) as DashboardSummaryResponse;
    setSummary(payload);
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    try {
      const token = window.localStorage.getItem("token");
      const response = await fetch("/api/demo/seed", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error((await response.json()).error || "Failed to seed demo data");
      }

      await loadSummary(searchQuery);
      setToast({ message: "Demo data seeded successfully.", tone: "success" });
    } catch (error: unknown) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to seed demo data.",
        tone: "error",
      });
    } finally {
      setSeeding(false);
    }
  };

  const quickLinks = useMemo(() => {
    if (!user?.role) {
      return [];
    }

    const entries = [
      {
        label: "New Store Item",
        href: "/dashboard/store/items/create",
        description: "Create a new image-based inventory item with QR identity.",
        icon: Boxes,
      },
      {
        label: "New Requisition",
        href: "/dashboard/create",
        description: "Raise a fresh purchase request.",
        icon: ReceiptText,
      },
      {
        label: "New Repair Request",
        href: "/dashboard/repair-maintainance/create",
        description: "Log a new breakdown or repair job.",
        icon: Wrench,
      },
      {
        label: "New Vehicle Fuel",
        href: "/dashboard/vehicle-fuel/create",
        description: "Raise a petrol or diesel fuel request for a vehicle.",
        icon: Fuel,
      },
      {
        label: "New Attendance",
        href: "/dashboard/attendance/create",
        description: "Create a new driver attendance entry.",
        icon: CalendarCheck2,
      },
      {
        label: "New Salary Advance",
        href: "/dashboard/salary-advance/create",
        description: "Create a new salary advance request.",
        icon: HandCoins,
      },
      {
        label: "Manage Users",
        href: "/dashboard/users",
        description: "Review users, roles, and activity.",
        icon: Users,
      },
    ];

    return entries.filter((entry) =>
      canAccessDashboardPath(entry.href, user.role, user.pageAccess, user.rolePageAccess),
    );
  }, [user]);

  const statCards = summary
    ? [
        {
          label: "Total Records",
          value: summary.summaryCards.totalRecords,
          helper: "Across requisition, repair, vehicle fuel, and store modules",
          tone: "indigo",
          icon: LayoutDashboard,
        },
        {
          label: "Pending Approvals",
          value: summary.summaryCards.pendingApprovals,
          helper: "Operational items still waiting for review",
          tone: "amber",
          icon: Clock3,
        },
        {
          label: "Active Users",
          value: summary.summaryCards.activeUsers,
          helper: "Users currently contributing to this workspace",
          tone: "sky",
          icon: Users,
        },
        {
          label: "Reminders",
          value: summary.summaryCards.reminders,
          helper: "Notifications that need follow-up from the team",
          tone: "purple",
          icon: BellRing,
        },
      ]
    : [];

  const maxTrendValue = useMemo(() => {
    if (!summary?.trends.length) {
      return 1;
    }

    const peak = Math.max(
      ...summary.trends.flatMap((point) => [
        point.requisitions,
        point.repair,
        point.attendance,
        point.salaryAdvance,
        point.vehicleFuel,
        point.store,
      ]),
    );

    return Math.max(peak, 1);
  }, [summary]);

  const resetBoardLayout = () => {
    setBoardLayout(DEFAULT_BOARD_LAYOUT);
  };

  const handleDragStart = (cardId: BoardCardId) => {
    setDraggedCard(cardId);
  };

  const handleDragEnd = () => {
    setDraggedCard(null);
    setDragOverCard(null);
    setDragOverColumn(null);
  };

  const handleCardDrop = (targetCardId: BoardCardId) => {
    if (!draggedCard || draggedCard === targetCardId) {
      handleDragEnd();
      return;
    }

    setBoardLayout((current) => swapCards(current, draggedCard, targetCardId));
    handleDragEnd();
  };

  const handleColumnDrop = (columnId: BoardColumnId) => {
    if (!draggedCard) {
      return;
    }

    setBoardLayout((current) => moveCardToColumnEnd(current, draggedCard, columnId));
    handleDragEnd();
  };

  const renderBoardCard = (cardId: BoardCardId) => {
    switch (cardId) {
      case "trends":
        return (
          <div className="min-h-[320px] rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  7-Day Activity
                </h2>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Daily volume across the core modules.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-[var(--app-muted)]">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
                  Requisition
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  Repair
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  Attendance
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                  Salary
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                  Fuel
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  Inventory
                </span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
              {(summary?.trends || []).map((point) => (
                <div key={point.label} className="space-y-2">
                    <div className="flex h-24 items-end justify-center gap-1 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] px-1.5 py-2 sm:h-32">
                    {[
                      { key: "requisitions", value: point.requisitions },
                      { key: "repair", value: point.repair },
                      { key: "attendance", value: point.attendance },
                      { key: "salaryAdvance", value: point.salaryAdvance },
                      { key: "vehicleFuel", value: point.vehicleFuel },
                      { key: "store", value: point.store },
                    ].map((bar) => (
                      <div
                        key={bar.key}
                        className={`w-2.5 rounded-full ${moduleColors[bar.key]}`}
                        style={{
                          height: `${Math.max(
                            8,
                            (bar.value / maxTrendValue) * 92,
                          )}px`,
                          opacity: bar.value > 0 ? 1 : 0.2,
                        }}
                        title={`${bar.key}: ${bar.value}`}
                      />
                    ))}
                  </div>
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--app-muted)]">
                    {point.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="min-h-[320px] rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  Reminders & Notifications
                </h2>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Key follow-ups for approvals, deductions, and active work.
                </p>
              </div>
              <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-panel)] px-3 py-1 text-xs text-[var(--app-muted)]">
                {summary?.notifications.length || 0} items
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {(summary?.notifications || []).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 inline-flex rounded-xl border p-2 ${toneClasses[item.tone]}`}
                    >
                      <BellRing size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--app-text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {!loading && summary?.notifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-6 text-sm text-[var(--app-muted)]">
                  No urgent reminders right now. The workflow looks calm.
                </div>
              )}
            </div>
          </div>
        );

      case "recentActivity":
        return (
          <div className="min-h-[320px] rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                Recent Activity
              </h2>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Latest operational movement across all connected modules.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {(summary?.recentActivity || []).slice(0, 6).map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[activity.tone]}`}
                        >
                          {activity.module}
                        </span>
                        <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                          {activity.title}
                        </p>
                      </div>
                      <p className="mt-1.5 text-sm text-[var(--app-muted)]">
                        {activity.description}
                      </p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-[var(--app-muted)]">
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-[var(--app-muted)]"
                    />
                  </div>
                </Link>
              ))}

              {!loading && summary?.recentActivity.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-6 text-sm text-[var(--app-muted)]">
                  Recent activity will show up here after records start moving.
                </div>
              )}
            </div>
          </div>
        );

      case "modulePulse":
        return (
          <div className="min-h-[320px] rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div>
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                Module Pulse
              </h2>
              <p className="mt-1 text-xs text-[var(--app-muted)]">
                Snapshot of total load, pending work, and attention areas.
              </p>
            </div>

            <div className="mt-4 space-y-3">
              {(summary?.moduleStats || []).map((module) => {
                const completionPercent =
                  module.total > 0
                    ? Math.min(
                        100,
                        Math.round((module.completed / module.total) * 100),
                      )
                    : 0;

                return (
                  <Link
                    key={module.key}
                    href={module.href}
                    className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3.5 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--app-text)]">
                          {module.label}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">
                          {module.total} total
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[module.tone]}`}
                      >
                        {module.pending} pending
                      </span>
                    </div>

                    <div className="mt-3 h-2 rounded-full bg-white/5">
                      <div
                        className={`h-2 rounded-full ${moduleColors[module.key]}`}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 text-xs text-[var(--app-muted)] sm:grid-cols-3">
                      <div>
                        <p className="text-[var(--app-muted)]">Completed</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                          {module.completed}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--app-muted)]">Pending</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                          {module.pending}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--app-muted)]">Attention</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--app-text)]">
                          {module.attention}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        );

      case "quickLinks":
        return (
          <div className="min-h-[320px] rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  Quick Links
                </h2>
                <p className="mt-1 text-xs text-[var(--app-muted)]">
                  Jump directly into the most-used actions and modules.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="group rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-1.5 text-[var(--app-text)]">
                        <link.icon size={16} />
                      </div>
                      <p className="mt-2.5 text-sm font-semibold text-[var(--app-text)]">
                        {link.label}
                      </p>
                      <p className="mt-1 text-xs text-[var(--app-muted)]">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-[var(--app-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--app-text)]"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
    }
  };

  const renderBoardColumn = (columnId: BoardColumnId, cards: BoardCardId[]) => (
    <div className="space-y-4">
      {cards.map((cardId) => (
        <div
          key={cardId}
          draggable
          onDragStart={() => handleDragStart(cardId)}
          onDragEnd={handleDragEnd}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverCard(cardId);
            setDragOverColumn(columnId);
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleCardDrop(cardId);
          }}
          className={`cursor-grab transition-all active:cursor-grabbing ${
            draggedCard === cardId ? "opacity-60" : ""
          } ${
            dragOverCard === cardId && draggedCard !== cardId
              ? "scale-[1.01]"
              : ""
          }`}
        >
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.18em] text-[var(--app-muted)]">
            <span>Draggable Card</span>
            <GripVertical size={14} className="text-[var(--app-muted)]" />
          </div>
          {renderBoardCard(cardId)}
        </div>
      ))}

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOverCard(null);
          setDragOverColumn(columnId);
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleColumnDrop(columnId);
        }}
        className={`rounded-2xl border border-dashed px-4 py-3 text-center text-xs uppercase tracking-[0.18em] transition-colors ${
          dragOverColumn === columnId
            ? "border-indigo-400/40 bg-indigo-500/5 text-indigo-300"
            : "border-[var(--app-border-strong)] bg-[var(--app-panel)] text-[var(--app-muted)]"
        }`}
      >
        Drop Here
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      {toast ? (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      ) : null}

      <PageHeader
        title="Project Command Center"
        subtitle={`${summary?.organizationName || "Organization"} summary with module trends, quick actions, reminders, and global search in one place.`}
        align="end"
        eyebrow={
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <LayoutDashboard size={14} />
            Overview
          </div>
        }
        actions={
          <div className="w-full space-y-3 sm:max-w-xl">
            {user?.role === "ADMIN" ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSeedDemoData}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-2 text-sm font-medium text-indigo-200 transition-colors hover:bg-indigo-500/15 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {seeding ? (
                    <Clock3 size={15} className="animate-spin" />
                  ) : (
                    <DatabaseZap size={15} />
                  )}
                  {seeding ? "Seeding Demo Data..." : "Seed Demo Data"}
                </button>
              </div>
            ) : null}

            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
              />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Global search by request ID, employee, site, vehicle, department..."
                className="w-full rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 pl-11 pr-4 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)] focus:border-indigo-500/40"
              />
            </div>

            {searchQuery.trim() && summary && (
              <div className="mt-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-3 shadow-2xl shadow-black/10">
                <div className="mb-2 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
                    Search Results
                  </p>
                  <p className="text-xs text-[var(--app-muted)]">
                    {summary.searchResults.length} matches
                  </p>
                </div>

                <div className="space-y-2">
                  {summary.searchResults.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--app-border)] px-4 py-5 text-sm text-[var(--app-muted)]">
                      No matching records found yet.
                    </div>
                  ) : (
                    summary.searchResults.map((result) => (
                      <Link
                        key={result.id}
                        href={result.href}
                        className="flex items-center justify-between rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 transition-colors hover:border-[var(--app-border-strong)] hover:bg-[var(--app-surface-strong)]"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[result.tone]}`}
                            >
                              {result.module}
                            </span>
                            <p className="truncate text-sm font-semibold text-[var(--app-text)]">
                              {result.title}
                            </p>
                          </div>
                          <p className="mt-1 truncate text-sm text-[var(--app-muted)]">
                            {result.subtitle}
                          </p>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-[var(--app-muted)]" />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            title={card.label}
            value={loading ? "..." : card.value.toLocaleString("en-IN")}
            helper={card.helper}
            icon={card.icon}
            tone={card.tone as any}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-panel)] p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--app-text)]">
              Desktop Board
            </h2>
            <p className="mt-1 text-xs text-[var(--app-muted)]">
              Drag cards to rearrange the dashboard the way you want.
            </p>
          </div>
          <button
            type="button"
            onClick={resetBoardLayout}
            className="inline-flex items-center justify-center rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-text)] transition-colors hover:bg-[var(--app-surface-strong)]"
          >
            Reset Layout
          </button>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {renderBoardColumn("left", boardLayout.left)}
          {renderBoardColumn("right", boardLayout.right)}
        </div>
      </div>
    </div>
  );
}
