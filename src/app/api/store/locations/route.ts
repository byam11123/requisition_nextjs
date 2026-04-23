import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import {
  createStoreLocation,
  listStoreLocations,
} from "@/lib/store-management-store";
import { resolveStoreOrganizationScope } from "@/lib/store-management-scope";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(listStoreLocations(scope.organizationId));
  } catch (error) {
    console.error("Store locations GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const created = createStoreLocation(scope.organizationId, {
      name: body.name || "",
      code: body.code || "",
      type: ["OFFICE", "SITE", "WAREHOUSE", "YARD", "OTHER"].includes(body.type)
        ? body.type
        : "OTHER",
      address: body.address || "",
      contactPerson: body.contactPerson || "",
      isActive: body.isActive !== false,
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Store locations POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
