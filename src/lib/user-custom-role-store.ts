import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const USER_CUSTOM_ROLE_ENTITY_TYPE = "USER_CUSTOM_ROLE";
const USER_CUSTOM_ROLE_STORE_PATH = path.join(process.cwd(), ".local", "user-custom-roles.json");

type UserCustomRoleStore = Record<string, string>;

function readUserCustomRoleStore() {
  try {
    if (!fs.existsSync(USER_CUSTOM_ROLE_STORE_PATH)) {
      return {} as UserCustomRoleStore;
    }

    const raw = fs.readFileSync(USER_CUSTOM_ROLE_STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const normalizedEntries = Object.entries(parsed).flatMap(([key, value]) =>
      typeof value === "string" && value.trim() ? [[key, value] as const] : [],
    );

    return Object.fromEntries(normalizedEntries) as UserCustomRoleStore;
  } catch {
    return {} as UserCustomRoleStore;
  }
}

function writeUserCustomRoleStore(store: UserCustomRoleStore) {
  fs.mkdirSync(path.dirname(USER_CUSTOM_ROLE_STORE_PATH), { recursive: true });
  fs.writeFileSync(USER_CUSTOM_ROLE_STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function toUserKey(userId: bigint | string) {
  return typeof userId === "bigint" ? userId.toString() : userId;
}

export async function getUserCustomRoleKey(userId: bigint | string) {
  const fileStore = readUserCustomRoleStore();
  const fileValue = fileStore[toUserKey(userId)] || null;

  if (typeof userId === "string") {
    return fileValue;
  }

  try {
    const latestEntry = await prisma.syncLog.findFirst({
      where: {
        entityType: USER_CUSTOM_ROLE_ENTITY_TYPE,
        entityId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!latestEntry?.payload) {
      return fileValue;
    }

    const parsed = JSON.parse(latestEntry.payload) as { roleKey?: unknown };
    return typeof parsed.roleKey === "string" ? parsed.roleKey : fileValue;
  } catch {
    return fileValue;
  }
}

export async function getUserCustomRoleMap(userIds: Array<bigint | string>) {
  const fileStore = readUserCustomRoleStore();
  const map = new Map<string, string | null>();

  userIds.forEach((userId) => {
    const key = toUserKey(userId);
    map.set(key, fileStore[key] || null);
  });

  const bigintIds = userIds.filter((userId): userId is bigint => typeof userId === "bigint");
  if (bigintIds.length === 0) {
    return map;
  }

  try {
    const entries = await prisma.syncLog.findMany({
      where: {
        entityType: USER_CUSTOM_ROLE_ENTITY_TYPE,
        entityId: { in: bigintIds },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const entry of entries) {
      const key = entry.entityId?.toString();
      if (!key || map.get(key)) {
        continue;
      }

      const parsed = entry.payload ? (JSON.parse(entry.payload) as { roleKey?: unknown }) : null;
      map.set(key, typeof parsed?.roleKey === "string" ? parsed.roleKey : null);
    }
  } catch {
    return map;
  }

  return map;
}

export async function saveUserCustomRoleKey(
  userId: bigint | string,
  roleKey: string,
) {
  if (!roleKey.trim()) {
    throw new Error("Invalid role key");
  }

  const fileStore = readUserCustomRoleStore();
  fileStore[toUserKey(userId)] = roleKey;
  writeUserCustomRoleStore(fileStore);

  if (typeof userId === "bigint") {
    try {
      await prisma.syncLog.create({
        data: {
          userId,
          entityType: USER_CUSTOM_ROLE_ENTITY_TYPE,
          entityId: userId,
          operation: Prisma.SyncOperation.UPDATE,
          payload: JSON.stringify({ roleKey }),
          synced: true,
          syncAt: new Date(),
        },
      });
    } catch {
      // File fallback already saved the assignment.
    }
  }

  return roleKey;
}
