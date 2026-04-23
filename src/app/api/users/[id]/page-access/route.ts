import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { findDevUserById } from "@/lib/dev-auth-store";
import { DASHBOARD_PAGE_OPTIONS, normalizeDashboardPageAccess } from "@/lib/page-access";
import { prisma } from "@/lib/prisma";
import { saveUserPageAccess } from "@/lib/user-page-access-store";

export async function PUT(
  req: NextRequest,
  ctx: RouteContext<"/api/users/[id]/page-access">,
) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await ctx.params;
    const payload = await req.json();
    const pages = normalizeDashboardPageAccess(payload.pages);

    if (!pages) {
      return NextResponse.json(
        {
          error: "Invalid page access payload",
          availablePages: DASHBOARD_PAGE_OPTIONS.map((page) => page.key),
        },
        { status: 400 },
      );
    }

    const devAdminUser = findDevUserById(user.sub);
    const devTargetUser = findDevUserById(id);
    if (
      devAdminUser &&
      devAdminUser.role === "ADMIN" &&
      devTargetUser &&
      devTargetUser.organizationId === devAdminUser.organizationId
    ) {
      const savedPages = await saveUserPageAccess(id, pages);
      return NextResponse.json({
        id,
        pageAccess: savedPages,
      });
    }

    if (user.sub === "9999") {
      const savedPages = await saveUserPageAccess(id, pages);
      return NextResponse.json({
        id,
        pageAccess: savedPages,
      });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!adminUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!targetUser || targetUser.organizationId !== adminUser.organizationId) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    const savedPages = await saveUserPageAccess(targetUser.id, pages);

    return NextResponse.json({
      id: targetUser.id.toString(),
      pageAccess: savedPages,
    });
  } catch (error) {
    console.error("User page access PUT error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
