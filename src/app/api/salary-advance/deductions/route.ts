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

    const deductions = await prisma.$queryRaw`
      SELECT * FROM salary_advance_deductions 
      WHERE employee_code = ${employeeCode} 
      AND organization_id = ${dbUser.organizationId}
      ORDER BY deduction_date DESC
    `;

    return NextResponse.json(deductions);
  } catch (error) {
    console.error("Fetch deductions error:", error);
    return NextResponse.json({ error: "Failed to fetch deductions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const { employeeCode, amount, deductionDate, remark } = body;

    if (!employeeCode || !amount) {
      return NextResponse.json({ error: "Employee code and amount are required" }, { status: 400 });
    }

    await prisma.$executeRaw`
      INSERT INTO salary_advance_deductions (
        organization_id,
        employee_code,
        amount,
        deduction_date,
        remark,
        created_by
      ) VALUES (
        ${dbUser.organizationId},
        ${employeeCode},
        ${Number(amount)},
        ${deductionDate || new Date().toISOString().split('T')[0]},
        ${remark},
        ${BigInt(user.sub)}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Create deduction error:", error);
    return NextResponse.json({ error: "Failed to record deduction" }, { status: 500 });
  }
}
