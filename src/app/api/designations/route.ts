import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { getCustomRolesForOrganization } from "@/lib/stores/custom-role-store";
import {
  buildDesignationKey,
  getDesignationsForOrganization,
  saveDesignationsForOrganization,
} from "@/lib/stores/designation-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";

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

  const designations = await getDesignationsForOrganization(roleContext.organizationId);
  return NextResponse.json(designations);
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
    department?: string;
    defaultCustomRoleKey?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Designation name is required" }, { status: 400 });
  }

  const key = buildDesignationKey(body.name);
  if (!key) {
    return NextResponse.json({ error: "Invalid designation name" }, { status: 400 });
  }

  const designations = await getDesignationsForOrganization(roleContext.organizationId);
  if (designations.some((entry) => entry.key === key)) {
    return NextResponse.json({ error: "A designation with this key already exists" }, { status: 409 });
  }

  const defaultCustomRoleKey = body.defaultCustomRoleKey?.trim().toUpperCase() || "";
  if (defaultCustomRoleKey) {
    const roles = await getCustomRolesForOrganization(roleContext.organizationId);
    if (!roles.some((entry) => entry.key === defaultCustomRoleKey)) {
      return NextResponse.json({ error: "Selected default custom role was not found" }, { status: 404 });
    }
  }

  const saved = await saveDesignationsForOrganization(roleContext.organizationId, [
    ...designations,
    {
      key,
      name: body.name.trim(),
      description: body.description?.trim() || "",
      department: body.department?.trim() || "",
      defaultCustomRoleKey,
      isSystem: false,
    },
  ]);

  return NextResponse.json(saved);
}

