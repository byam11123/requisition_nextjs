import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  type DashboardPageKey,
  type DashboardRole,
  ROLE_DEFAULT_PAGE_ACCESS,
  normalizeDashboardPageAccess,
  normalizeDashboardRole,
} from "@/lib/config/page-access";

const CUSTOM_ROLE_ENTITY_TYPE = "CUSTOM_ROLE_CONFIG";
const CUSTOM_ROLE_STORE_PATH = path.join(process.cwd(), ".local", "custom-roles.json");

export type CustomRoleDefinition = {
  key: string;
  name: string;
  description: string;
  baseRole: DashboardRole;
  pageAccess: DashboardPageKey[];
  isSystem: boolean;
};

type CustomRoleStoreFile = Record<string, CustomRoleDefinition[]>;

function slugifyRoleKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getSystemDefaultCustomRoles() {
  return [
    {
      key: "ADMIN",
      name: "Admin",
      description: "Organization administrator with full operational control.",
      baseRole: "ADMIN" as const,
      pageAccess: ROLE_DEFAULT_PAGE_ACCESS.ADMIN,
      isSystem: true,
    },
    {
      key: "MANAGER",
      name: "Manager",
      description: "Operational manager focused on approvals and oversight.",
      baseRole: "MANAGER" as const,
      pageAccess: ROLE_DEFAULT_PAGE_ACCESS.MANAGER,
      isSystem: true,
    },
    {
      key: "PURCHASER",
      name: "Purchaser",
      description: "Purchasing and field operations role for request execution.",
      baseRole: "PURCHASER" as const,
      pageAccess: ROLE_DEFAULT_PAGE_ACCESS.PURCHASER,
      isSystem: true,
    },
    {
      key: "ACCOUNTANT",
      name: "Accountant",
      description: "Finance role for payment handling and salary operations.",
      baseRole: "ACCOUNTANT" as const,
      pageAccess: ROLE_DEFAULT_PAGE_ACCESS.ACCOUNTANT,
      isSystem: true,
    },
  ] satisfies CustomRoleDefinition[];
}

export function normalizeCustomRoleDefinition(value: unknown): CustomRoleDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const key =
    typeof (value as { key?: unknown }).key === "string"
      ? slugifyRoleKey((value as { key: string }).key) || (value as { key: string }).key
      : "";
  const name =
    typeof (value as { name?: unknown }).name === "string"
      ? (value as { name: string }).name.trim()
      : "";
  const description =
    typeof (value as { description?: unknown }).description === "string"
      ? (value as { description: string }).description.trim()
      : "";
  const baseRole = normalizeDashboardRole((value as { baseRole?: string }).baseRole);
  const pageAccess = normalizeDashboardPageAccess((value as { pageAccess?: unknown }).pageAccess);

  if (!key || !name || !baseRole || !pageAccess) {
    return null;
  }

  return {
    key,
    name,
    description,
    baseRole,
    pageAccess,
    isSystem: Boolean((value as { isSystem?: unknown }).isSystem),
  };
}

export function normalizeCustomRoleDefinitions(value: unknown): CustomRoleDefinition[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value.map(normalizeCustomRoleDefinition);
  if (normalized.some((entry) => !entry)) {
    return null;
  }

  const unique = new Map<string, CustomRoleDefinition>();
  for (const role of normalized) {
    if (!role) {
      return null;
    }
    if (unique.has(role.key)) {
      return null;
    }
    unique.set(role.key, role);
  }

  return [...unique.values()];
}

function mergeWithSystemDefaults(roles: CustomRoleDefinition[]) {
  const map = new Map<string, CustomRoleDefinition>();

  for (const role of getSystemDefaultCustomRoles()) {
    map.set(role.key, role);
  }

  for (const role of roles) {
    map.set(role.key, role);
  }

  return [...map.values()];
}

function readCustomRoleFileStore() {
  try {
    if (!fs.existsSync(CUSTOM_ROLE_STORE_PATH)) {
      return {} as CustomRoleStoreFile;
    }

    const raw = fs.readFileSync(CUSTOM_ROLE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) => {
      const roles = normalizeCustomRoleDefinitions(value);
      return roles ? [[key, roles] as const] : [];
    });
    return Object.fromEntries(normalizedEntries) as CustomRoleStoreFile;
  } catch {
    return {} as CustomRoleStoreFile;
  }
}

function writeCustomRoleFileStore(store: CustomRoleStoreFile) {
  fs.mkdirSync(path.dirname(CUSTOM_ROLE_STORE_PATH), { recursive: true });
  fs.writeFileSync(CUSTOM_ROLE_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toOrganizationKey(organizationId: bigint | string) {
  return typeof organizationId === "bigint" ? organizationId.toString() : organizationId;
}

export async function getCustomRolesForOrganization(organizationId: bigint | string) {
  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readCustomRoleFileStore();
  const fileRoles = fileStore[orgKey];

  if (typeof organizationId === "string") {
    return mergeWithSystemDefaults(fileRoles || []);
  }

  try {
    const latestEntry = await prisma.syncLog.findFirst({
      where: {
        entityType: CUSTOM_ROLE_ENTITY_TYPE,
        entityId: organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    const dbRoles = latestEntry?.payload
      ? normalizeCustomRoleDefinitions(JSON.parse(latestEntry.payload))
      : null;

    return mergeWithSystemDefaults(dbRoles || fileRoles || []);
  } catch {
    return mergeWithSystemDefaults(fileRoles || []);
  }
}

export async function saveCustomRolesForOrganization(
  organizationId: bigint | string,
  roles: CustomRoleDefinition[],
) {
  const normalized = normalizeCustomRoleDefinitions(roles);
  if (!normalized) {
    throw new Error("Invalid custom role payload");
  }

  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readCustomRoleFileStore();
  fileStore[orgKey] = normalized;
  writeCustomRoleFileStore(fileStore);

  if (typeof organizationId === "bigint") {
    try {
      // Database sync logs for custom roles require additional user context.
      // Skipping for now to prioritize local file store persistence.
    } catch {
      // File fallback already covers offline mode.
    }
  }

  return mergeWithSystemDefaults(normalized);
}

export async function findCustomRoleForOrganization(
  organizationId: bigint | string,
  roleKey: string,
) {
  const roles = await getCustomRolesForOrganization(organizationId);
  return roles.find((role) => role.key === roleKey) || null;
}

export function buildCustomRoleKey(name: string) {
  return slugifyRoleKey(name).toUpperCase();
}
