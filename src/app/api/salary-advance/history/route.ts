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

    // Using queryRaw because we just created the table and Prisma schema might not be updated
    const history = await prisma.$queryRaw`
      SELECT * FROM salary_advance_requests 
      WHERE employee_code = ${employeeCode} 
      AND organization_id = ${dbUser.organizationId}
      ORDER BY created_at DESC
    `;

    return NextResponse.json(history);
  } catch (error) {
    console.error("Fetch history error:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
