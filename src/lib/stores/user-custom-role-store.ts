import fs from "node:fs";
import path from "node:path";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const USER_CUSTOM_ROLE_ENTITY_TYPE = "USER_CUSTOM_ROLE";
const USER_CUSTOM_ROLE_STORE_PATH = path.join(process.cwd(), ".local", "user-custom-roles.json");

type UserCustomRoleStore = Record<string, string>;

function readUserCustomRoleStore() {
  try {
    if (process.env.VERCEL || !fs.existsSync(USER_CUSTOM_ROLE_STORE_PATH)) {
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
  if (process.env.VERCEL) return;
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { customRoleKey: true },
    });

    return user?.customRoleKey || fileValue;
  } catch (error) {
    console.error("Error fetching user custom role from DB:", error);
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
    const users = await prisma.user.findMany({
      where: { id: { in: bigintIds } },
      select: { id: true, customRoleKey: true },
    });

    for (const user of users) {
      const key = user.id.toString();
      if (user.customRoleKey) {
        map.set(key, user.customRoleKey);
      }
    }
  } catch (error) {
    console.error("Error fetching user custom role map from DB:", error);
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
      await prisma.user.update({
        where: { id: userId },
        data: { customRoleKey: roleKey },
      });
    } catch (error) {
      console.error("Error saving user custom role to DB:", error);
      // File fallback already saved the assignment.
    }
  }

  return roleKey;
}
