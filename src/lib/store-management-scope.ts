import { findDevUserById } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";

const DEV_IDS = new Set(["9999", "9998", "9997", "9996"]);

export async function resolveStoreOrganizationScope(userId: string) {
  if (DEV_IDS.has(userId)) {
    return { organizationId: "demo", source: "demo" as const };
  }

  const signedUpDevUser = findDevUserById(userId);
  if (signedUpDevUser) {
    return {
      organizationId: signedUpDevUser.organizationId,
      source: "dev" as const,
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
  });
  if (!dbUser) {
    return null;
  }

  return {
    organizationId: String(dbUser.organizationId),
    source: "db" as const,
  };
}
