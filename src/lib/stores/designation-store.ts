import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DESIGNATION_ENTITY_TYPE = "DESIGNATION_CONFIG";
const DESIGNATION_STORE_PATH = path.join(process.cwd(), ".local", "designations.json");

export type DesignationDefinition = {
  key: string;
  name: string;
  description: string;
  department: string;
  defaultCustomRoleKey: string;
  isSystem: boolean;
};

type DesignationStoreFile = Record<string, DesignationDefinition[]>;

function slugifyDesignationKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildDesignationKey(name: string) {
  return slugifyDesignationKey(name).toUpperCase();
}

export function normalizeDesignationDefinition(value: unknown): DesignationDefinition | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const rawKey =
    typeof (value as { key?: unknown }).key === "string"
      ? (value as { key: string }).key
      : "";
  const key = buildDesignationKey(rawKey) || rawKey.trim().toUpperCase();
  const name =
    typeof (value as { name?: unknown }).name === "string"
      ? (value as { name: string }).name.trim()
      : "";
  const description =
    typeof (value as { description?: unknown }).description === "string"
      ? (value as { description: string }).description.trim()
      : "";
  const department =
    typeof (value as { department?: unknown }).department === "string"
      ? (value as { department: string }).department.trim()
      : "";
  const defaultCustomRoleKey =
    typeof (value as { defaultCustomRoleKey?: unknown }).defaultCustomRoleKey === "string"
      ? (value as { defaultCustomRoleKey: string }).defaultCustomRoleKey.trim().toUpperCase()
      : "";

  if (!key || !name) {
    return null;
  }

  return {
    key,
    name,
    description,
    department,
    defaultCustomRoleKey,
    isSystem: Boolean((value as { isSystem?: unknown }).isSystem),
  };
}

export function normalizeDesignationDefinitions(value: unknown): DesignationDefinition[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const normalized = value.map(normalizeDesignationDefinition);
  if (normalized.some((entry) => !entry)) {
    return null;
  }

  const unique = new Map<string, DesignationDefinition>();
  for (const designation of normalized) {
    if (!designation) {
      return null;
    }
    if (unique.has(designation.key)) {
      return null;
    }
    unique.set(designation.key, designation);
  }

  return [...unique.values()];
}

function readDesignationFileStore() {
  try {
    if (process.env.VERCEL || !fs.existsSync(DESIGNATION_STORE_PATH)) {
      return {} as DesignationStoreFile;
    }

    const raw = fs.readFileSync(DESIGNATION_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) => {
      const designations = normalizeDesignationDefinitions(value);
      return designations ? [[key, designations] as const] : [];
    });
    return Object.fromEntries(normalizedEntries) as DesignationStoreFile;
  } catch {
    return {} as DesignationStoreFile;
  }
}

function writeDesignationFileStore(store: DesignationStoreFile) {
  if (process.env.VERCEL) return;
  fs.mkdirSync(path.dirname(DESIGNATION_STORE_PATH), { recursive: true });
  fs.writeFileSync(DESIGNATION_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toOrganizationKey(organizationId: bigint | string) {
  return typeof organizationId === "bigint" ? organizationId.toString() : organizationId;
}

export async function getDesignationsForOrganization(organizationId: bigint | string) {
  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readDesignationFileStore();
  const fileDesignations = fileStore[orgKey];

  if (typeof organizationId === "string") {
    return fileDesignations || [];
  }

  try {
    const dbConfig = await prisma.designationConfig.findUnique({
      where: { organizationId },
    });

    const dbDesignations = dbConfig?.payload
      ? normalizeDesignationDefinitions(JSON.parse(dbConfig.payload))
      : null;

    return dbDesignations || fileDesignations || [];
  } catch (error) {
    console.error("Error fetching designations from DB:", error);
    return fileDesignations || [];
  }
}

export async function saveDesignationsForOrganization(
  organizationId: bigint | string,
  designations: DesignationDefinition[],
) {
  const normalized = normalizeDesignationDefinitions(designations);
  if (!normalized) {
    throw new Error("Invalid designation payload");
  }

  const orgKey = toOrganizationKey(organizationId);
  const fileStore = readDesignationFileStore();
  fileStore[orgKey] = normalized;
  writeDesignationFileStore(fileStore);

  if (typeof organizationId === "bigint") {
    try {
      await prisma.designationConfig.upsert({
        where: { organizationId },
        update: {
          payload: JSON.stringify(normalized),
        },
        create: {
          organizationId,
          payload: JSON.stringify(normalized),
        },
      });
    } catch (error) {
      console.error("Error saving designations to DB:", error);
      // File fallback already covers offline mode.
    }
  }

  return normalized;
}

export async function findDesignationForOrganization(
  organizationId: bigint | string,
  designationKey: string,
) {
  const normalizedKey = buildDesignationKey(designationKey) || designationKey.trim().toUpperCase();
  const designations = await getDesignationsForOrganization(organizationId);
  return designations.find((designation) => designation.key === normalizedKey) || null;
}
