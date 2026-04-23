import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { getCustomRolesForOrganization } from "@/lib/custom-role-store";
import {
  getDesignationsForOrganization,
  saveDesignationsForOrganization,
} from "@/lib/designation-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/designations/[key]">,
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
    department?: string;
    defaultCustomRoleKey?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Designation name is required" }, { status: 400 });
  }

  const designations = await getDesignationsForOrganization(roleContext.organizationId);
  const target = designations.find((entry) => entry.key === key);
  if (!target) {
    return NextResponse.json({ error: "Designation not found" }, { status: 404 });
  }

  const defaultCustomRoleKey = body.defaultCustomRoleKey?.trim().toUpperCase() || "";
  if (defaultCustomRoleKey) {
    const roles = await getCustomRolesForOrganization(roleContext.organizationId);
    if (!roles.some((entry) => entry.key === defaultCustomRoleKey)) {
      return NextResponse.json({ error: "Selected default custom role was not found" }, { status: 404 });
    }
  }

  const saved = await saveDesignationsForOrganization(
    roleContext.organizationId,
    designations.map((entry) =>
      entry.key === key
        ? {
            ...entry,
            name: body.name!.trim(),
            description: body.description?.trim() || "",
            department: body.department?.trim() || "",
            defaultCustomRoleKey,
          }
        : entry,
    ),
  );

  return NextResponse.json(saved);
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext<"/api/designations/[key]">,
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
  const designations = await getDesignationsForOrganization(roleContext.organizationId);
  const target = designations.find((entry) => entry.key === key);
  if (!target) {
    return NextResponse.json({ error: "Designation not found" }, { status: 404 });
  }

  const saved = await saveDesignationsForOrganization(
    roleContext.organizationId,
    designations.filter((entry) => entry.key !== key),
  );

  return NextResponse.json(saved);
}
