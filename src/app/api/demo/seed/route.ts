import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
import { seedDemoData } from "@/lib/demo-seed";

hydrateDemoModuleGlobals();

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary = await seedDemoData();
  return NextResponse.json({
    message: "Demo data seeded successfully.",
    ...summary,
  });
}

