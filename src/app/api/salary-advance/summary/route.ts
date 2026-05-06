import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const employeeCode = searchParams.get("employeeCode");

  if (!employeeCode) return NextResponse.json({ error: "Employee code required" }, { status: 400 });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch from the view
    // Note: Since Prisma might not know about the view, we use raw SQL
    const summary = await prisma.$queryRaw`
      SELECT * FROM view_employee_advance_summary 
      WHERE employee_code = ${employeeCode} 
      AND organization_id = ${dbUser.organizationId}
      LIMIT 1
    `;

    const result = (summary as any[])[0] || {
      employee_code: employeeCode,
      total_advance: 0,
      total_additional: 0,
      total_deducted: 0,
      current_balance: 0
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Fetch summary error:", error);
    return NextResponse.json({ error: "Failed to fetch summary" }, { status: 500 });
  }
}
