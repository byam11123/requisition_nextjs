import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
import {
  findDevOrganizationById,
  findDevUserById,
  getDevUsersForOrganization,
} from "@/lib/stores/dev-auth-store";
import { prisma } from "@/lib/prisma";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

hydrateDemoModuleGlobals();


const REPAIR_MODULE_KEY = "REPAIR_MAINTAINANCE";
const ATTENDANCE_MODULE_KEY = "DRIVER_ATTENDANCE";
const SALARY_ADVANCE_MODULE_KEY = "SALARY_ADVANCE";
const VEHICLE_FUEL_MODULE_KEY = "VEHICLE_FUEL";

import { listStoreItems } from "@/lib/stores/store-management-store";

type SummaryUser = {
  id: bigint | string;
  fullName: string | null;
  email?: string | null;
  role: string;
  department: string | null;
  isActive: boolean;
  lastLogin: Date | null;
};

type SummaryRequisitionRow = {
  id: bigint | string;
  requestId: string | null;
  requiredFor: string | null;
  approvalStatus: string | null;
  paymentStatus: string | null;
  dispatchStatus: string | null;
  priority: string | null;
  amount: number | string | null;
  createdAt: Date | string;
  submittedAt?: Date | string | null;
  siteAddress: string | null;
  materialDescription: string | null;
  vendorName: string | null;
  description?: string | null;
  cardSubtitleInfo?: string | null;
  createdBy?: {
    fullName: string | null;
  } | null;
};

type SalaryAdvanceDeduction = {
  id: string;
  deductionDate: string;
  deductionAmount: number;
  remark: string;
};

type AttendanceMeta = {
  adminName?: string;
  driverName?: string;
  fromSiteName?: string;
  toSiteName?: string;
  fatherName?: string;
  vehicleType?: string;
  vehicleName?: string;
  vehicleNumber?: string;
};

type SalaryAdvanceMeta = {
  employeeName?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  currentSalary?: number;
  totalAdvanceRequest?: number;
  repaymentSchedule?: string;
  totalAdditionalAdvances?: number;
  remarks?: string;
  deductionHistory?: SalaryAdvanceDeduction[];
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

type NotificationItem = {
  id: string;
  title: string;
  description: string;
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

const parseJsonObject = <T extends object>(raw: string | null | undefined): T => {
  if (!raw) {
    return {} as T;
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
};

const toIsoString = (value: Date | string | null | undefined) => {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
};

const toNumber = (value: number | string | null | undefined) => {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const withinLastDays = (value: string, days: number) => {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= days * 24 * 60 * 60 * 1000;
};

const matchesQuery = (values: Array<string | null | undefined>, query: string) => {
  if (!query) {
    return false;
  }

  const normalizedQuery = query.toLowerCase();
  return values.some((value) => value?.toLowerCase().includes(normalizedQuery));
};

const buildTrendSeries = (
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  vehicleFuel: SummaryRequisitionRow[],
  storeItems: any[],
): TrendPoint[] => {
  const dayFormatter = new Intl.DateTimeFormat("en-IN", { weekday: "short" });
  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - (6 - index));

    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);

    const inRange = (value: Date | string) => {
      const time = new Date(value).getTime();
      return time >= date.getTime() && time < nextDate.getTime();
    };

    return {
      label: dayFormatter.format(date),
      requisitions: requisitions.filter((row) => inRange(row.submittedAt || row.createdAt)).length,
      repair: repairs.filter((row) => inRange(row.submittedAt || row.createdAt)).length,
      attendance: attendance.filter((row) => inRange(row.submittedAt || row.createdAt)).length,
      salaryAdvance: salaryAdvances.filter((row) => inRange(row.submittedAt || row.createdAt)).length,
      vehicleFuel: vehicleFuel.filter((row) => inRange(row.submittedAt || row.createdAt)).length,
      store: storeItems.filter((item) => inRange(item.createdAt)).length,
    };
  });
};

const buildSiteBreakdown = (rows: SummaryRequisitionRow[]) => {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const site = row.siteAddress?.trim();
    if (!site) {
      return;
    }

    counts.set(site, (counts.get(site) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
};

const buildRecentActivities = (
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  vehicleFuel: SummaryRequisitionRow[],
) => {
  const items: RecentActivity[] = [
    ...requisitions.map((row: SummaryRequisitionRow) => ({
      id: `req-${row.id}`,
      module: "Requisition",
      title: row.requestId || "Requisition",
      description: `${row.materialDescription || "Untitled item"} · ${row.siteAddress || "No site"}`,
      timestamp: toIsoString(row.submittedAt || row.createdAt),
      href: `/dashboard/req/${row.id}`,
      tone: "indigo" as const,
    })),
    ...repairs.map((row: SummaryRequisitionRow) => ({
      id: `repair-${row.id}`,
      module: "Repair",
      title: row.requestId || "Repair Case",
      description: `${row.materialDescription || "Repair job"} · ${row.siteAddress || "No site"}`,
      timestamp: toIsoString(row.submittedAt || row.createdAt),
      href: `/dashboard/repair-maintainance/${row.id}`,
      tone: "emerald" as const,
    })),
    ...attendance.map((row: SummaryRequisitionRow) => {
      const meta = parseJsonObject<AttendanceMeta>(row.cardSubtitleInfo);
      return {
        id: `attendance-${row.id}`,
        module: "Attendance",
        title: row.requestId || "Attendance Entry",
        description: `${meta.driverName || row.materialDescription || "Driver"} · ${meta.fromSiteName || row.siteAddress || "No site"}`,
        timestamp: toIsoString(row.submittedAt || row.createdAt),
        href: "/dashboard/attendance",
        tone: "amber" as const,
      };
    }),
    ...salaryAdvances.map((row: SummaryRequisitionRow) => {
      const meta = parseJsonObject<SalaryAdvanceMeta>(row.cardSubtitleInfo);
      return {
        id: `salary-${row.id}`,
        module: "Salary Advance",
        title: row.requestId || "Salary Advance",
        description: `${meta.employeeName || row.materialDescription || "Employee"} · ${meta.department || row.siteAddress || "No department"}`,
        timestamp: toIsoString(row.submittedAt || row.createdAt),
        href: `/dashboard/salary-advance/${row.id}`,
        tone: "purple" as const,
      };
    }),
    ...vehicleFuel.map((row: SummaryRequisitionRow) => ({
      id: `fuel-${row.id}`,
      module: "Vehicle Fuel",
      title: row.requestId || "Fuel Request",
      description: `${row.materialDescription || "Vehicle"} · ${row.siteAddress || "No site"}`,
      timestamp: toIsoString(row.submittedAt || row.createdAt),
      href: `/dashboard/vehicle-fuel`,
      tone: "sky" as const,
    })),
  ];

  return items
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, 8);
};

const buildNotifications = (
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  vehicleFuel: SummaryRequisitionRow[],
  users: SummaryUser[],
) => {
  const pendingRequisitions = requisitions.filter(
    (row) => row.approvalStatus === "PENDING",
  ).length;
  const activeRepairs = repairs.filter(
    (row) =>
      row.approvalStatus === "APPROVED" &&
      row.dispatchStatus !== "DISPATCHED" &&
      row.dispatchStatus !== "DELIVERED",
  ).length;
  const pendingAttendance = attendance.filter(
    (row) => row.approvalStatus !== "APPROVED",
  ).length;
  const outstandingSalary = salaryAdvances.reduce((sum, row) => {
    const meta = parseJsonObject<SalaryAdvanceMeta>(row.cardSubtitleInfo);
    const deductionHistory = Array.isArray(meta.deductionHistory)
      ? meta.deductionHistory
      : [];
    const totalRequested = Number(meta.totalAdvanceRequest || toNumber(row.amount));
    const totalAdditional = Number(meta.totalAdditionalAdvances || 0);
    const totalDeducted = deductionHistory.reduce(
      (acc, entry) => acc + Number(entry.deductionAmount || 0),
      0,
    );
    return sum + Math.max(totalRequested + totalAdditional - totalDeducted, 0);
  }, 0);
  const inactiveUsers = users.filter((user) => !user.isActive).length;

  const notifications: NotificationItem[] = [];

  if (pendingRequisitions > 0) {
    notifications.push({
      id: "pending-requisitions",
      title: `${pendingRequisitions} requisitions need attention`,
      description: "Pending approval requests are stacking up in the purchase register.",
      href: "/dashboard/requisition",
      tone: "amber",
    });
  }

  if (activeRepairs > 0) {
    notifications.push({
      id: "active-repairs",
      title: `${activeRepairs} repair jobs are still active`,
      description: "Follow up on approved repair cases that have not completed their logistics flow.",
      href: "/dashboard/repair-maintainance",
      tone: "emerald",
    });
  }

  if (pendingAttendance > 0) {
    notifications.push({
      id: "pending-attendance",
      title: `${pendingAttendance} attendance entries are pending`,
      description: "Driver attendance entries still need operational review or approval.",
      href: "/dashboard/attendance",
      tone: "sky",
    });
  }

  if (outstandingSalary > 0) {
    notifications.push({
      id: "outstanding-salary",
      title: `₹${Math.round(outstandingSalary).toLocaleString("en-IN")} salary balance is open`,
      description: "Outstanding salary advances still need deduction follow-up.",
      href: "/dashboard/salary-advance",
      tone: "purple",
    });
  }

  if (inactiveUsers > 0) {
    notifications.push({
      id: "inactive-users",
      title: `${inactiveUsers} user accounts are inactive`,
      description: "User access should be reviewed so the operations dashboard stays accurate.",
      href: "/dashboard/users",
      tone: "rose",
    });
  }

  return notifications.slice(0, 6);
};

const buildSearchResults = (
  query: string,
  role: string,
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  users: SummaryUser[],
) => {
  if (!query.trim()) {
    return [] as SearchResult[];
  }

  const results: SearchResult[] = [];

  requisitions.forEach((row) => {
    if (
      matchesQuery(
        [
          row.requestId,
          row.materialDescription,
          row.siteAddress,
          row.vendorName,
          row.createdBy?.fullName || "",
        ],
        query,
      )
    ) {
      results.push({
        id: `req-${row.id}`,
        module: "Requisition",
        title: row.requestId || "Requisition",
        subtitle: `${row.materialDescription || "Untitled item"} · ${row.siteAddress || "No site"}`,
        href: `/dashboard/req/${row.id}`,
        tone: "indigo",
      });
    }
  });

  repairs.forEach((row) => {
    if (
      matchesQuery(
        [
          row.requestId,
          row.materialDescription,
          row.siteAddress,
          row.vendorName,
          row.createdBy?.fullName || "",
        ],
        query,
      )
    ) {
      results.push({
        id: `repair-${row.id}`,
        module: "Repair",
        title: row.requestId || "Repair Case",
        subtitle: `${row.materialDescription || "Repair job"} · ${row.siteAddress || "No site"}`,
        href: `/dashboard/repair-maintainance/${row.id}`,
        tone: "emerald",
      });
    }
  });

  attendance.forEach((row) => {
    const meta = parseJsonObject<AttendanceMeta>(row.cardSubtitleInfo);
    if (
      matchesQuery(
        [
          row.requestId,
          meta.driverName,
          meta.fromSiteName,
          meta.toSiteName,
          meta.vehicleNumber,
          meta.vehicleName,
        ],
        query,
      )
    ) {
      results.push({
        id: `attendance-${row.id}`,
        module: "Attendance",
        title: row.requestId || "Attendance Entry",
        subtitle: `${meta.driverName || row.materialDescription || "Driver"} · ${meta.vehicleNumber || "Vehicle pending"}`,
        href: "/dashboard/attendance",
        tone: "amber",
      });
    }
  });

  salaryAdvances.forEach((row) => {
    const meta = parseJsonObject<SalaryAdvanceMeta>(row.cardSubtitleInfo);
    if (
      matchesQuery(
        [
          row.requestId,
          meta.employeeName,
          meta.employeeCode,
          meta.department,
          meta.designation,
        ],
        query,
      )
    ) {
      results.push({
        id: `salary-${row.id}`,
        module: "Salary Advance",
        title: row.requestId || "Salary Advance",
        subtitle: `${meta.employeeName || row.materialDescription || "Employee"} · ${meta.employeeCode || "No code"}`,
        href: `/dashboard/salary-advance/${row.id}`,
        tone: "purple",
      });
    }
  });

  if (role === "ADMIN") {
    users.forEach((entry) => {
      if (
        matchesQuery(
          [entry.fullName, entry.email || "", entry.department, entry.role],
          query,
        )
      ) {
        results.push({
          id: `user-${entry.id}`,
          module: "User",
          title: entry.fullName || entry.email || "User",
          subtitle: `${entry.role} · ${entry.department || "No department"}`,
          href: "/dashboard/users",
          tone: "sky",
        });
      }
    });
  }

  return results.slice(0, 8);
};

const buildModuleStats = (
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  vehicleFuel: SummaryRequisitionRow[],
  storeItems: any[],
): ModuleStat[] => {
  const salaryOutstanding = salaryAdvances.filter((row) => {
    const meta = parseJsonObject<SalaryAdvanceMeta>(row.cardSubtitleInfo);
    const deductionHistory = Array.isArray(meta.deductionHistory)
      ? meta.deductionHistory
      : [];
    const totalRequested = Number(meta.totalAdvanceRequest || toNumber(row.amount));
    const totalAdditional = Number(meta.totalAdditionalAdvances || 0);
    const totalDeducted = deductionHistory.reduce(
      (acc, entry) => acc + Number(entry.deductionAmount || 0),
      0,
    );

    return totalRequested + totalAdditional - totalDeducted > 0;
  }).length;

  return [
    {
      key: "requisitions",
      label: "Requisitions",
      href: "/dashboard/requisition",
      tone: "indigo",
      total: requisitions.length,
      pending: requisitions.filter((row) => row.approvalStatus === "PENDING").length,
      completed: requisitions.filter((row) => row.paymentStatus === "DONE").length,
      attention: requisitions.filter((row) => row.priority === "URGENT").length,
    },
    {
      key: "repair",
      label: "Repair & Maintenance",
      href: "/dashboard/repair-maintainance",
      tone: "emerald",
      total: repairs.length,
      pending: repairs.filter((row) => row.approvalStatus === "PENDING").length,
      completed: repairs.filter((row) => row.dispatchStatus === "DELIVERED").length,
      attention: repairs.filter((row) => row.dispatchStatus === "NOT_DISPATCHED").length,
    },
    {
      key: "attendance",
      label: "Attendance",
      href: "/dashboard/attendance",
      tone: "amber",
      total: attendance.length,
      pending: attendance.filter((row) => row.approvalStatus !== "APPROVED").length,
      completed: attendance.filter((row) => row.approvalStatus === "APPROVED").length,
      attention: attendance.filter((row) =>
        withinLastDays(toIsoString(row.submittedAt || row.createdAt), 2),
      ).length,
    },
    {
      key: "salaryAdvance",
      label: "Salary Advance",
      href: "/dashboard/salary-advance",
      tone: "purple",
      total: salaryAdvances.length,
      pending: salaryAdvances.filter((row) => row.approvalStatus !== "APPROVED").length,
      completed: salaryAdvances.filter((row) => row.approvalStatus === "APPROVED").length,
      attention: salaryOutstanding,
    },
    {
      key: "vehicleFuel",
      label: "Vehicle Fuel",
      href: "/dashboard/vehicle-fuel",
      tone: "sky",
      total: vehicleFuel.length,
      pending: vehicleFuel.filter((row) => row.approvalStatus === "PENDING").length,
      completed: vehicleFuel.filter((row) => {
        const meta = parseJsonObject<{ billPhotoUrl?: string }>(row.cardSubtitleInfo);
        return !!meta.billPhotoUrl;
      }).length,
      attention: vehicleFuel.filter((row) => {
        const meta = parseJsonObject<{ billPhotoUrl?: string }>(row.cardSubtitleInfo);
        return row.approvalStatus === "APPROVED" && !meta.billPhotoUrl;
      }).length,
    },
    {
      key: "store",
      label: "Store Management",
      href: "/dashboard/store",
      tone: "rose",
      total: storeItems.length,
      pending: 0,
      completed: storeItems.length,
      attention: storeItems.filter((item) => (item.stock || 0) < (item.minStock || 5)).length,
    },
  ];
};

const buildSummaryResponse = (
  organizationName: string,
  role: string,
  query: string,
  requisitions: SummaryRequisitionRow[],
  repairs: SummaryRequisitionRow[],
  attendance: SummaryRequisitionRow[],
  salaryAdvances: SummaryRequisitionRow[],
  vehicleFuel: SummaryRequisitionRow[],
  storeItems: any[],
  users: SummaryUser[],
) => {
  const moduleStats = buildModuleStats(
    requisitions,
    repairs,
    attendance,
    salaryAdvances,
    vehicleFuel,
    storeItems,
  );
  const notifications = buildNotifications(
    requisitions,
    repairs,
    attendance,
    salaryAdvances,
    vehicleFuel,
    users,
  );

  return {
    organizationName,
    role,
    summaryCards: {
      totalRecords:
        requisitions.length +
        repairs.length +
        attendance.length +
        salaryAdvances.length +
        vehicleFuel.length +
        storeItems.length,
      pendingApprovals: moduleStats.reduce((sum, item) => sum + item.pending, 0),
      activeUsers: users.filter((entry) => entry.isActive).length,
      reminders: notifications.length,
    },
    moduleStats,
    trends: buildTrendSeries(
      requisitions,
      repairs,
      attendance,
      salaryAdvances,
      vehicleFuel,
      storeItems,
    ),
    siteBreakdown: buildSiteBreakdown([...requisitions, ...repairs]),
    notifications,
    recentActivity: buildRecentActivities(
      requisitions,
      repairs,
      attendance,
      salaryAdvances,
      vehicleFuel,
    ),
    searchResults: buildSearchResults(
      query,
      role,
      requisitions,
      repairs,
      attendance,
      salaryAdvances,
      users,
    ),
  };
};

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get("q")?.trim() || "";


    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(user.sub) },
        include: {
          organization: true,
        },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const [requisitionRows, userRows] = await Promise.all([
        prisma.requisition.findMany({
          where: {
            organizationId: dbUser.organizationId,
          },
          include: {
            createdBy: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.findMany({
          where: {
            organizationId: dbUser.organizationId,
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            department: true,
            isActive: true,
            lastLogin: true,
          },
        }),
      ]);

      const mappedRows: SummaryRequisitionRow[] = (requisitionRows as any[]).map((row: any) => ({
        id: row.id,
        requestId: row.requestId,
        requiredFor: row.requiredFor,
        approvalStatus: row.approvalStatus,
        paymentStatus: row.paymentStatus,
        dispatchStatus: row.dispatchStatus,
        priority: row.priority,
        amount:
          row.amount === null || row.amount === undefined
            ? null
            : Number(row.amount),
        createdAt: row.createdAt,
        submittedAt: row.submittedAt,
        siteAddress: row.siteAddress,
        materialDescription: row.materialDescription,
        vendorName: row.vendorName,
        description: row.description,
        cardSubtitleInfo: row.cardSubtitleInfo,
        createdBy: row.createdBy
          ? {
              fullName: row.createdBy.fullName,
            }
          : null,
      }));

      const requisitions = mappedRows.filter(
        (row) =>
          row.requiredFor !== REPAIR_MODULE_KEY &&
          row.requiredFor !== ATTENDANCE_MODULE_KEY &&
          row.requiredFor !== SALARY_ADVANCE_MODULE_KEY &&
          row.requiredFor !== VEHICLE_FUEL_MODULE_KEY,
      );
      const repairs = mappedRows.filter(
        (row) => row.requiredFor === REPAIR_MODULE_KEY,
      );
      const attendance = mappedRows.filter(
        (row) => row.requiredFor === ATTENDANCE_MODULE_KEY,
      );
      const salaryAdvances = mappedRows.filter(
        (row) => row.requiredFor === SALARY_ADVANCE_MODULE_KEY,
      );
      const vehicleFuel = mappedRows.filter(
        (row) => row.requiredFor === VEHICLE_FUEL_MODULE_KEY,
      );
      const storeItems = await listStoreItems(String(dbUser.organizationId));
      const users: SummaryUser[] = (userRows as any[]).map((entry: any) => ({
        id: entry.id,
        fullName: entry.fullName,
        email: entry.email,
        role: entry.role,
        department: entry.department,
        isActive: entry.isActive,
        lastLogin: entry.lastLogin,
      }));

      return NextResponse.json(
        buildSummaryResponse(
          dbUser.organization.name,
          user.role,
          query,
          requisitions,
          repairs,
          attendance,
          salaryAdvances,
          vehicleFuel,
          storeItems,
          users,
        ),
      );
    } catch (dbError) {
      const devUser = findDevUserById(user.sub);
      if (devUser) {
        const organization = findDevOrganizationById(devUser.organizationId);
        const orgUsers = getDevUsersForOrganization(devUser.organizationId);

        return NextResponse.json(
          buildSummaryResponse(
            organization?.name || "Development Organization",
            user.role,
            query,
            [],
            [],
            [],
            [],
            [],
            [],
            orgUsers.map((entry) => ({
              id: entry.id,
              fullName: entry.fullName,
              email: entry.email,
              role: entry.role,
              department: entry.department,
              isActive: entry.isActive,
              lastLogin: entry.lastLogin ? new Date(entry.lastLogin) : null,
            })),
          ),
        );
      }

      throw dbError;
    }
  } catch (error) {
    console.error("Dashboard summary GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

