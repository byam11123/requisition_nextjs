"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck2,
  Clock3,
  GripVertical,
  HandCoins,
  LayoutDashboard,
  ReceiptText,
  Search,
  Users,
  Wrench,
} from "lucide-react";

import { canAccessDashboardPath } from "@/lib/page-access";

type StoredUser = {
  role?: string;
  fullName?: string;
  pageAccess?: string[] | null;
};

type SummaryCardData = {
  totalRecords: number;
  pendingApprovals: number;
  activeUsers: number;
  reminders: number;
};

type ModuleStat = {
  key: "requisitions" | "repair" | "attendance" | "salaryAdvance";
  label: string;
  href: string;
  tone: "indigo" | "emerald" | "amber" | "purple";
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
};

export default function OverviewDashboardPage() {
  const [user] = useState<StoredUser | null>(() => getStoredUser());
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
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

  const quickLinks = useMemo(() => {
    if (!user?.role) {
      return [];
    }

    const entries = [
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
          helper: "Across requisition, repair, attendance, and salary modules",
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
          <div className="min-h-[320px] rounded-3xl border border-white/5 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  7-Day Activity
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Daily volume across the core modules.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500">
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
              </div>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-2">
              {(summary?.trends || []).map((point) => (
                <div key={point.label} className="space-y-2">
                  <div className="flex h-32 items-end justify-center gap-1 rounded-2xl border border-white/5 bg-slate-950/40 px-1.5 py-2">
                    {[
                      { key: "requisitions", value: point.requisitions },
                      { key: "repair", value: point.repair },
                      { key: "attendance", value: point.attendance },
                      { key: "salaryAdvance", value: point.salaryAdvance },
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
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {point.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="min-h-[320px] rounded-3xl border border-white/5 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Reminders & Notifications
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Key follow-ups for approvals, deductions, and active work.
                </p>
              </div>
              <span className="rounded-full border border-white/5 bg-slate-950/40 px-3 py-1 text-xs text-slate-400">
                {summary?.notifications.length || 0} items
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {(summary?.notifications || []).map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="block rounded-2xl border border-white/5 bg-slate-950/40 p-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 inline-flex rounded-xl border p-2 ${toneClasses[item.tone]}`}
                    >
                      <BellRing size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}

              {!loading && summary?.notifications.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/30 px-4 py-6 text-sm text-slate-500">
                  No urgent reminders right now. The workflow looks calm.
                </div>
              )}
            </div>
          </div>
        );

      case "recentActivity":
        return (
          <div className="min-h-[320px] rounded-3xl border border-white/5 bg-slate-900/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Recent Activity
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Latest operational movement across all connected modules.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {(summary?.recentActivity || []).slice(0, 6).map((activity) => (
                <Link
                  key={activity.id}
                  href={activity.href}
                  className="block rounded-2xl border border-white/5 bg-slate-950/40 p-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[activity.tone]}`}
                        >
                          {activity.module}
                        </span>
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {activity.title}
                        </p>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-400">
                        {activity.description}
                      </p>
                      <p className="mt-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {formatDateTime(activity.timestamp)}
                      </p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="mt-1 shrink-0 text-slate-500"
                    />
                  </div>
                </Link>
              ))}

              {!loading && summary?.recentActivity.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/5 bg-slate-950/30 px-4 py-6 text-sm text-slate-500">
                  Recent activity will show up here after records start moving.
                </div>
              )}
            </div>
          </div>
        );

      case "modulePulse":
        return (
          <div className="min-h-[320px] rounded-3xl border border-white/5 bg-slate-900/50 p-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Module Pulse
              </h2>
              <p className="mt-1 text-xs text-slate-400">
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
                    className="block rounded-2xl border border-white/5 bg-slate-950/40 p-3.5 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {module.label}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
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

                    <div className="mt-3 grid grid-cols-3 gap-3 text-xs text-slate-400">
                      <div>
                        <p className="text-slate-500">Completed</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {module.completed}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Pending</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
                          {module.pending}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Attention</p>
                        <p className="mt-1 text-sm font-semibold text-slate-200">
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
          <div className="min-h-[320px] rounded-3xl border border-white/5 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">
                  Quick Links
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Jump directly into the most-used actions and modules.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="group rounded-2xl border border-white/5 bg-slate-950/40 p-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex rounded-xl border border-white/5 bg-white/[0.03] p-1.5 text-slate-300">
                        <link.icon size={16} />
                      </div>
                      <p className="mt-2.5 text-sm font-semibold text-slate-100">
                        {link.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="mt-1 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300"
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
          <div className="mb-2 flex items-center justify-between px-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">
            <span>Draggable Card</span>
            <GripVertical size={14} className="text-slate-600" />
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
            : "border-white/10 bg-slate-900/30 text-slate-500"
        }`}
      >
        Drop Here
      </div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in-up">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-300">
            <LayoutDashboard size={14} />
            Overview
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              Project Command Center
            </h1>
            <p className="mt-1.5 max-w-3xl text-sm text-slate-400">
              {summary?.organizationName || "Organization"} summary with module
              trends, quick actions, reminders, and global search in one place.
            </p>
          </div>
        </div>

        <div className="w-full max-w-xl">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Global search by request ID, employee, site, vehicle, department..."
              className="w-full rounded-2xl border border-white/5 bg-slate-900/60 py-2.5 pl-11 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/40"
            />
          </div>

          {searchQuery.trim() && summary && (
            <div className="mt-3 rounded-2xl border border-white/5 bg-slate-900/95 p-3 shadow-2xl shadow-slate-950/50">
              <div className="mb-2 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Search Results
                </p>
                <p className="text-xs text-slate-500">
                  {summary.searchResults.length} matches
                </p>
              </div>

              <div className="space-y-2">
                {summary.searchResults.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-white/5 px-4 py-5 text-sm text-slate-500">
                    No matching records found yet.
                  </div>
                ) : (
                  summary.searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={result.href}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${toneClasses[result.tone]}`}
                          >
                            {result.module}
                          </span>
                          <p className="truncate text-sm font-semibold text-slate-200">
                            {result.title}
                          </p>
                        </div>
                        <p className="mt-1 truncate text-sm text-slate-500">
                          {result.subtitle}
                        </p>
                      </div>
                      <ArrowRight size={16} className="shrink-0 text-slate-500" />
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/5 bg-slate-900/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {card.label}
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-100">
                  {loading ? "..." : card.value.toLocaleString("en-IN")}
                </p>
              </div>
              <div
                className={`inline-flex rounded-xl border p-2 ${toneClasses[card.tone]}`}
              >
                <card.icon size={16} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">{card.helper}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Desktop Board
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Drag cards to rearrange the dashboard the way you want.
            </p>
          </div>
          <button
            type="button"
            onClick={resetBoardLayout}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5"
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
