import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { getCustomRolesForOrganization, saveCustomRolesForOrganization } from "@/lib/custom-role-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { normalizeDashboardPageAccess, normalizeDashboardRole } from "@/lib/page-access";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/custom-roles/[key]">,
) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({ userId: user.sub, baseRole: user.role });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const { key } = await ctx.params;
  const body = (await req.json()) as {
    name?: string;
    description?: string;
    baseRole?: string;
    pageAccess?: string[];
  };

  const pageAccess = normalizeDashboardPageAccess(body.pageAccess);
  const baseRole = normalizeDashboardRole(body.baseRole);
  if (!body.name?.trim() || !pageAccess || !baseRole) {
    return NextResponse.json({ error: "Invalid role payload" }, { status: 400 });
  }

  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  const target = roles.find((entry) => entry.key === key);
  if (!target) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (target.isSystem) {
    return NextResponse.json({ error: "System roles cannot be edited here" }, { status: 400 });
  }

  const saved = await saveCustomRolesForOrganization(
    roleContext.organizationId,
    roles
      .filter((entry) => !entry.isSystem)
      .map((entry) =>
        entry.key === key
          ? {
              ...entry,
              name: body.name!.trim(),
              description: body.description?.trim() || "",
              baseRole,
              pageAccess,
            }
          : entry,
      ),
  );

  return NextResponse.json(saved);
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/custom-roles/[key]">,
) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({ userId: user.sub, baseRole: user.role });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const { key } = await ctx.params;
  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  const target = roles.find((entry) => entry.key === key);
  if (!target) {
    return NextResponse.json({ error: "Role not found" }, { status: 404 });
  }

  if (target.isSystem) {
    return NextResponse.json({ error: "System roles cannot be deleted" }, { status: 400 });
  }

  const saved = await saveCustomRolesForOrganization(
    roleContext.organizationId,
    roles.filter((entry) => !entry.isSystem && entry.key !== key),
  );

  return NextResponse.json(saved);
}
