import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { buildCustomRoleKey, getCustomRolesForOrganization, saveCustomRolesForOrganization } from "@/lib/custom-role-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { normalizeDashboardPageAccess, normalizeDashboardRole } from "@/lib/page-access";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({
    userId: user.sub,
    baseRole: user.role,
  });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({
    userId: user.sub,
    baseRole: user.role,
  });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const body = (await req.json()) as {
    name?: string;
    description?: string;
    baseRole?: string;
    pageAccess?: string[];
  };

  if (!body.name?.trim() || !body.baseRole?.trim()) {
    return NextResponse.json({ error: "Role name and base role are required" }, { status: 400 });
  }

  const baseRole = normalizeDashboardRole(body.baseRole);
  const pageAccess = normalizeDashboardPageAccess(body.pageAccess);
  if (!baseRole || !pageAccess) {
    return NextResponse.json({ error: "Invalid base role or page access" }, { status: 400 });
  }

  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  const key = buildCustomRoleKey(body.name);
  if (!key) {
    return NextResponse.json({ error: "Invalid role name" }, { status: 400 });
  }
  if (roles.some((entry) => entry.key === key)) {
    return NextResponse.json({ error: "A role with this key already exists" }, { status: 409 });
  }

  const saved = await saveCustomRolesForOrganization(roleContext.organizationId, [
    ...roles.filter((entry) => !entry.isSystem),
    {
      key,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      baseRole,
      pageAccess,
      isSystem: false,
    },
  ]);

  return NextResponse.json(saved);
}
