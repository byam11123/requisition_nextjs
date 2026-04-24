import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { getCustomRolesForOrganization } from "@/lib/stores/custom-role-store";
import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { prisma } from "@/lib/prisma";
import { saveUserCustomRoleKey } from "@/lib/stores/user-custom-role-store";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/users/[id]/custom-role">,
) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({ userId: user.sub, baseRole: user.role });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const { id } = await ctx.params;
  const { roleKey } = (await req.json()) as { roleKey?: string };
  if (!roleKey?.trim()) {
    return NextResponse.json({ error: "Role key is required" }, { status: 400 });
  }

  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  const targetRole = roles.find((entry) => entry.key === roleKey);
  if (!targetRole) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  const devTargetUser = findDevUserById(id);
  if (devTargetUser && String(devTargetUser.organizationId) === String(roleContext.organizationId)) {
    const savedKey = await saveUserCustomRoleKey(id, targetRole.key);
    return NextResponse.json({
      id,
      customRoleKey: savedKey,
      customRoleName: targetRole.name,
      rolePageAccess: targetRole.pageAccess,
      baseRole: targetRole.baseRole,
    });
  }

  if (typeof roleContext.organizationId === "bigint") {
    const targetUser = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, organizationId: true },
    });
    if (!targetUser || targetUser.organizationId !== roleContext.organizationId) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const savedKey = await saveUserCustomRoleKey(targetUser.id, targetRole.key);
    return NextResponse.json({
      id: targetUser.id.toString(),
      customRoleKey: savedKey,
      customRoleName: targetRole.name,
      rolePageAccess: targetRole.pageAccess,
      baseRole: targetRole.baseRole,
    });
  }

  return NextResponse.json({ error: "Target user not found" }, { status: 404 });
}
