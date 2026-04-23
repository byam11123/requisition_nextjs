import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { getStoreItem } from "@/lib/store-management-store";
import { resolveStoreOrganizationScope } from "@/lib/store-management-scope";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const item = getStoreItem(scope.organizationId, id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error("Store item detail GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
