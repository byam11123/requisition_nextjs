import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  DashboardPageKey,
  normalizeDashboardPageAccess,
} from "@/lib/config/page-access";

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pageAccessOverride: true },
    });

    return parsePayload(user?.pageAccessOverride || null)?.pages || fallbackValue;
  } catch (error) {
    console.error("Error fetching user page access from DB:", error);
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
    const users = await prisma.user.findMany({
      where: { id: { in: bigintIds } },
      select: { id: true, pageAccessOverride: true },
    });

    for (const user of users) {
      const key = user.id.toString();
      const dbPages = parsePayload(user.pageAccessOverride)?.pages;
      if (dbPages) {
        map.set(key, dbPages);
      }
    }
  } catch (error) {
    console.error("Error fetching user page access map from DB:", error);
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
      await prisma.user.update({
        where: { id: userId },
        data: {
          pageAccessOverride: JSON.stringify({ pages: normalizedPages }),
        },
      });
    } catch (error) {
      console.error("Error saving user page access to DB:", error);
    }
  }

  return normalizedPages;
}
