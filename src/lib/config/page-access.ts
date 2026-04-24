export type DashboardRole = "ADMIN" | "PURCHASER" | "MANAGER" | "ACCOUNTANT";

export type DashboardPageKey =
  | "overview"
  | "roles"
  | "designations"
  | "contactManager"
  | "store"
  | "requisition"
  | "workflow"
  | "repair"
  | "vehicleFuel"
  | "attendance"
  | "salaryAdvance"
  | "users"
  | "profile"
  | "newStoreItem"
  | "newRequisition"
  | "newRepairRequest"
  | "newVehicleFuel"
  | "newAttendance"
  | "newSalaryAdvance";

type DashboardPageOption = {
  key: DashboardPageKey;
  label: string;
  href: string;
  description: string;
};

type DashboardPathRule = {
  key: DashboardPageKey;
  href: string;
};

const DASHBOARD_PATH_RULES: DashboardPathRule[] = [
  { key: "overview", href: "/dashboard/overview" },
  { key: "roles", href: "/dashboard/roles" },
  { key: "designations", href: "/dashboard/designations" },
  { key: "contactManager", href: "/dashboard/contact-manager" },
  { key: "newStoreItem", href: "/dashboard/store/items/create" },
  { key: "store", href: "/dashboard/store" },
  { key: "workflow", href: "/dashboard/workflow" },
  { key: "users", href: "/dashboard/users" },
  { key: "newRepairRequest", href: "/dashboard/repair-maintainance/create" },
  { key: "repair", href: "/dashboard/repair-maintainance" },
  { key: "newVehicleFuel", href: "/dashboard/vehicle-fuel/create" },
  { key: "vehicleFuel", href: "/dashboard/vehicle-fuel" },
  { key: "newAttendance", href: "/dashboard/attendance/create" },
  { key: "attendance", href: "/dashboard/attendance" },
  { key: "newSalaryAdvance", href: "/dashboard/salary-advance/create" },
  { key: "salaryAdvance", href: "/dashboard/salary-advance" },
  { key: "newRequisition", href: "/dashboard/create" },
  { key: "requisition", href: "/dashboard/requisition" },
  { key: "requisition", href: "/dashboard/req" },
  { key: "requisition", href: "/dashboard/edit" },
  { key: "profile", href: "/dashboard/profile" },
  { key: "requisition", href: "/dashboard" },
];

export const DASHBOARD_PAGE_OPTIONS: DashboardPageOption[] = [
  {
    key: "overview",
    label: "Dashboard",
    href: "/dashboard/overview",
    description: "Main command center and overview widgets.",
  },
  {
    key: "roles",
    label: "Custom Roles",
    href: "/dashboard/roles",
    description: "Create organization-specific roles and their page defaults.",
  },
  {
    key: "designations",
    label: "Designations",
    href: "/dashboard/designations",
    description: "Manage organization-specific job titles and designation defaults.",
  },
  {
    key: "contactManager",
    label: "Contact Manager",
    href: "/dashboard/contact-manager",
    description: "Bookmark for shared employee contacts and future repair sync.",
  },
  {
    key: "store",
    label: "Store Management",
    href: "/dashboard/store",
    description: "Visual inventory, QR item records, and multi-location stock control.",
  },
  {
    key: "workflow",
    label: "Workflow Config",
    href: "/dashboard/workflow",
    description: "Manage requisition workflow steps and role ownership.",
  },
  {
    key: "requisition",
    label: "Requisition",
    href: "/dashboard/requisition",
    description: "Register, request details, and requisition records.",
  },
  {
    key: "repair",
    label: "Repair & Maintenance",
    href: "/dashboard/repair-maintainance",
    description: "Repair register and repair detail pages.",
  },
  {
    key: "vehicleFuel",
    label: "Vehicle Daily Fuel",
    href: "/dashboard/vehicle-fuel",
    description: "Vehicle fuel requests, approvals, and bill completion.",
  },
  {
    key: "attendance",
    label: "Attendance",
    href: "/dashboard/attendance",
    description: "Attendance register and attendance records.",
  },
  {
    key: "salaryAdvance",
    label: "Salary Advance",
    href: "/dashboard/salary-advance",
    description: "Salary advance register and deduction detail pages.",
  },
  {
    key: "users",
    label: "Manage Users",
    href: "/dashboard/users",
    description: "User management and access controls.",
  },
  {
    key: "profile",
    label: "Profile",
    href: "/dashboard/profile",
    description: "Own account profile page.",
  },
  {
    key: "newStoreItem",
    label: "New Store Item",
    href: "/dashboard/store/items/create",
    description: "Create a new visual inventory item with image and QR identity.",
  },
  {
    key: "newRequisition",
    label: "New Requisition",
    href: "/dashboard/create",
    description: "Create a fresh requisition request.",
  },
  {
    key: "newRepairRequest",
    label: "New Repair Request",
    href: "/dashboard/repair-maintainance/create",
    description: "Create a new repair or breakdown request.",
  },
  {
    key: "newVehicleFuel",
    label: "New Vehicle Fuel",
    href: "/dashboard/vehicle-fuel/create",
    description: "Create a new daily diesel or petrol request for a vehicle.",
  },
  {
    key: "newAttendance",
    label: "New Attendance",
    href: "/dashboard/attendance/create",
    description: "Create a new attendance entry.",
  },
  {
    key: "newSalaryAdvance",
    label: "New Salary Advance",
    href: "/dashboard/salary-advance/create",
    description: "Create a new salary advance request.",
  },
];

export const ROLE_DEFAULT_PAGE_ACCESS: Record<DashboardRole, DashboardPageKey[]> = {
  ADMIN: DASHBOARD_PAGE_OPTIONS.map((page) => page.key),
  PURCHASER: [
    "overview",
    "store",
    "requisition",
    "repair",
    "vehicleFuel",
    "attendance",
    "profile",
    "newStoreItem",
    "newRequisition",
    "newRepairRequest",
    "newVehicleFuel",
    "newAttendance",
  ],
  MANAGER: [
    "overview",
    "store",
    "requisition",
    "repair",
    "vehicleFuel",
    "attendance",
    "salaryAdvance",
    "profile",
  ],
  ACCOUNTANT: [
    "overview",
    "store",
    "requisition",
    "vehicleFuel",
    "salaryAdvance",
    "profile",
    "newSalaryAdvance",
  ],
};

export function normalizeDashboardRole(role?: string | null): DashboardRole | null {
  if (
    role === "ADMIN" ||
    role === "PURCHASER" ||
    role === "MANAGER" ||
    role === "ACCOUNTANT"
  ) {
    return role;
  }

  return null;
}

export function normalizeDashboardPageAccess(
  value: unknown,
): DashboardPageKey[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value.filter(
    (entry): entry is DashboardPageKey =>
      typeof entry === "string" &&
      DASHBOARD_PAGE_OPTIONS.some((page) => page.key === entry),
  );

  return normalized.length === value.length
    ? Array.from(new Set(normalized))
    : null;
}

export function getEffectiveDashboardPageAccess(
  role?: string | null,
  pageAccess?: unknown,
  rolePageAccess?: unknown,
) {
  const normalizedRole = normalizeDashboardRole(role);
  const normalizedAccess = normalizeDashboardPageAccess(pageAccess);
  if (normalizedAccess) {
    return normalizedAccess;
  }

  const normalizedRoleAccess = normalizeDashboardPageAccess(rolePageAccess);
  if (normalizedRoleAccess) {
    return normalizedRoleAccess;
  }

  if (!normalizedRole) {
    return [] as DashboardPageKey[];
  }

  return ROLE_DEFAULT_PAGE_ACCESS[normalizedRole];
}

function getDashboardPageKeyForPath(pathname: string) {
  const matchedRule = DASHBOARD_PATH_RULES.find(
    (rule) => pathname === rule.href || pathname.startsWith(`${rule.href}/`),
  );

  return matchedRule?.key ?? null;
}

export function canAccessDashboardPath(
  pathname: string,
  role?: string | null,
  pageAccess?: unknown,
  rolePageAccess?: unknown,
) {
  const key = getDashboardPageKeyForPath(pathname);
  if (!key) {
    return false;
  }

  return getEffectiveDashboardPageAccess(role, pageAccess, rolePageAccess).includes(key);
}

export function getDefaultDashboardPath(
  role?: string | null,
  pageAccess?: unknown,
  rolePageAccess?: unknown,
) {
  const availablePages = getEffectiveDashboardPageAccess(role, pageAccess, rolePageAccess);
  if (availablePages.length === 0) {
    return "/";
  }

  const preferredOrder: DashboardPageKey[] = [
    "overview",
    "roles",
    "designations",
    "contactManager",
    "store",
    "workflow",
    "requisition",
    "repair",
    "vehicleFuel",
    "attendance",
    "salaryAdvance",
    "profile",
    "users",
    "newStoreItem",
    "newRequisition",
    "newRepairRequest",
    "newVehicleFuel",
    "newAttendance",
    "newSalaryAdvance",
  ];

  const matchedKey = preferredOrder.find((key) => availablePages.includes(key));
  const matchedPage = DASHBOARD_PAGE_OPTIONS.find((page) => page.key === matchedKey);

  return matchedPage?.href || "/";
}
