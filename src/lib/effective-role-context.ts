import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { findCustomRoleForOrganization } from "@/lib/stores/custom-role-store";
import { getUserCustomRoleKey } from "@/lib/stores/user-custom-role-store";

export type EffectiveRoleContext = {
  baseRole: string;
  roleKey: string;
  roleName: string;
  rolePageAccess: string[];
  organizationId: bigint | string;
};

export async function getEffectiveRoleContext(input: {
  userId: string;
  baseRole: string;
  organizationId?: bigint | string | null;
}) {
  let organizationId = input.organizationId ?? null;

  if (!organizationId) {
    if (input.userId === "9999" || input.userId === "9998" || input.userId === "9997" || input.userId === "9996" || input.userId === "9995") {
      organizationId = "demo";
    } else {
      const devUser = findDevUserById(input.userId);
      if (devUser) {
        organizationId = devUser.organizationId;
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { id: BigInt(input.userId) },
          select: { organizationId: true },
        });
        organizationId = dbUser?.organizationId || null;
      }
    }
  }

  if (!organizationId) {
    return null;
  }

  const assignedRoleKey = await getUserCustomRoleKey(input.userId);
  const fallbackRoleKey = input.baseRole.toUpperCase();
  const customRole =
    (assignedRoleKey && (await findCustomRoleForOrganization(organizationId, assignedRoleKey))) ||
    (await findCustomRoleForOrganization(organizationId, fallbackRoleKey));

  if (!customRole) {
    return null;
  }

  return {
    baseRole: customRole.baseRole,
    roleKey: customRole.key,
    roleName: customRole.name,
    rolePageAccess: customRole.pageAccess,
    organizationId,
  } satisfies EffectiveRoleContext;
}

