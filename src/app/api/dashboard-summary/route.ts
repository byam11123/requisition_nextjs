import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { DashboardService } from "@/modules/dashboard/services/dashboard.service";
import { resolveStoreOrganizationScope } from "@/lib/store-management-scope";
import { setupBigIntSerialization } from "@/lib/utils/bigint-fix";

setupBigIntSerialization();
const dashboardService = new DashboardService();

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = req.nextUrl.searchParams.get("q") || "";
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User or Organization not found" }, { status: 404 });
    }
    
    const summary = await dashboardService.getSummary(scope.organizationId, query);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
