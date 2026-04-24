import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  type RequisitionWorkflowConfig,
  normalizeRequisitionWorkflowConfig,
} from "@/lib/config/requisition-workflow-config";

const WORKFLOW_ENTITY_TYPE = "REQUISITION_WORKFLOW";
const WORKFLOW_STORE_PATH = path.join(process.cwd(), ".local", "workflow-config.json");

type WorkflowFileStore = Record<string, RequisitionWorkflowConfig>;

function readFileStore(): WorkflowFileStore {
  try {
    if (!fs.existsSync(WORKFLOW_STORE_PATH)) {
      return {};
    }

    const raw = fs.readFileSync(WORKFLOW_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) => {
      const normalized = normalizeRequisitionWorkflowConfig(value);
      return normalized ? [[key, normalized] as const] : [];
    });

    return Object.fromEntries(normalizedEntries);
  } catch {
    return {};
  }
}

function writeFileStore(store: WorkflowFileStore) {
  fs.mkdirSync(path.dirname(WORKFLOW_STORE_PATH), { recursive: true });
  fs.writeFileSync(WORKFLOW_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toOrgKey(organizationId: bigint | string) {
  return typeof organizationId === "bigint" ? organizationId.toString() : organizationId;
}

export async function getRequisitionWorkflowOrganizationScope(userSub: string) {
  if (userSub === "9999" || userSub === "9998" || userSub === "9997" || userSub === "9996") {
    return "demo";
  }

  const devUser = findDevUserById(userSub);
  if (devUser) {
    return devUser.organizationId;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(userSub) },
    select: { organizationId: true },
  });

  return dbUser?.organizationId || null;
}

export async function getRequisitionWorkflowConfig(
  organizationId: bigint | string,
) {
  const orgKey = toOrgKey(organizationId);
  const fileStore = readFileStore();
  const fileValue = fileStore[orgKey];

  if (typeof organizationId === "string") {
    return fileValue || DEFAULT_REQUISITION_WORKFLOW_CONFIG;
  }

  try {
    const latestEntry = await prisma.syncLog.findFirst({
      where: {
        entityType: WORKFLOW_ENTITY_TYPE,
        entityId: organizationId,
      },
      orderBy: { createdAt: "desc" },
    });

    const dbValue = normalizeRequisitionWorkflowConfig(latestEntry?.payload ? JSON.parse(latestEntry.payload) : null);
    return dbValue || fileValue || DEFAULT_REQUISITION_WORKFLOW_CONFIG;
  } catch {
    return fileValue || DEFAULT_REQUISITION_WORKFLOW_CONFIG;
  }
}

export async function saveRequisitionWorkflowConfig(
  organizationId: bigint | string,
  config: RequisitionWorkflowConfig,
) {
  const normalized = normalizeRequisitionWorkflowConfig(config);
  if (!normalized) {
    throw new Error("Invalid workflow configuration");
  }

  const orgKey = toOrgKey(organizationId);
  const fileStore = readFileStore();
  fileStore[orgKey] = normalized;
  writeFileStore(fileStore);

  if (typeof organizationId === "bigint") {
    try {
      // Skipping SyncLog creation as it requires a user context.
    } catch {
      // File fallback already captured the config for offline use.
    }
  }

  return normalized;
}

