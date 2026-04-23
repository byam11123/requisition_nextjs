import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DashboardPageKey,
  normalizeDashboardPageAccess,
} from "@/lib/page-access";

const USER_PAGE_ACCESS_ENTITY_TYPE = "USER_PAGE_ACCESS";
const g = globalThis as typeof globalThis & {
  __userPageAccessStore?: Map<string, DashboardPageKey[]>;
};

type UserPageAccessPayload = {
  pages: DashboardPageKey[];
};

function getFallbackStore() {
  if (!g.__userPageAccessStore) {
    g.__userPageAccessStore = new Map<string, DashboardPageKey[]>();
  }

  return g.__userPageAccessStore;
}

function toUserKey(userId: bigint | string) {
  return typeof userId === "bigint" ? userId.toString() : userId;
}

function parsePayload(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<UserPageAccessPayload>;
    const normalized = normalizeDashboardPageAccess(parsed.pages);
    return normalized ? { pages: normalized } : null;
  } catch {
    return null;
  }
}

export async function getUserPageAccess(userId: bigint | string) {
  const fallbackStore = getFallbackStore();
  const fallbackValue = fallbackStore.get(toUserKey(userId)) || null;

  if (typeof userId === "string") {
    return fallbackValue;
  }

  try {
    const latestEntry = await prisma.syncLog.findFirst({
      where: {
        entityType: USER_PAGE_ACCESS_ENTITY_TYPE,
        entityId: userId,
      },
      orderBy: { createdAt: "desc" },
    });

    return parsePayload(latestEntry?.payload || null)?.pages || fallbackValue;
  } catch {
    return fallbackValue;
  }
}

export async function getUserPageAccessMap(userIds: Array<bigint | string>) {
  if (userIds.length === 0) {
    return new Map<string, DashboardPageKey[] | null>();
  }

  const map = new Map<string, DashboardPageKey[] | null>();
  const fallbackStore = getFallbackStore();

  userIds.forEach((userId) => {
    const key = toUserKey(userId);
    map.set(key, fallbackStore.get(key) || null);
  });

  const bigintIds = userIds.filter(
    (userId): userId is bigint => typeof userId === "bigint",
  );
  if (bigintIds.length === 0) {
    return map;
  }

  try {
    const entries = await prisma.syncLog.findMany({
      where: {
        entityType: USER_PAGE_ACCESS_ENTITY_TYPE,
        entityId: { in: bigintIds },
      },
      orderBy: { createdAt: "desc" },
    });

    for (const entry of entries) {
      const key = entry.entityId?.toString();
      if (!key || (map.get(key) && map.get(key)?.length)) {
        continue;
      }

      map.set(key, parsePayload(entry.payload || null)?.pages || map.get(key) || null);
    }
  } catch {
    return map;
  }

  return map;
}

export async function saveUserPageAccess(
  userId: bigint | string,
  pages: DashboardPageKey[],
) {
  const normalizedPages = normalizeDashboardPageAccess(pages);
  if (!normalizedPages) {
    throw new Error("Invalid page access payload");
  }

  getFallbackStore().set(toUserKey(userId), normalizedPages);

  if (typeof userId === "bigint") {
    try {
      await prisma.syncLog.create({
        data: {
          userId,
          entityType: USER_PAGE_ACCESS_ENTITY_TYPE,
          entityId: userId,
          operation: Prisma.SyncOperation.UPDATE,
          payload: JSON.stringify({ pages: normalizedPages } satisfies UserPageAccessPayload),
          synced: true,
          syncAt: new Date(),
        },
      });
    } catch {
      // Keep in-memory access available even when the database is offline.
    }
  }

  return normalizedPages;
}
