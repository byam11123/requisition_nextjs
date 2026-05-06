import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json();
    const {
      employeeCode,
      employeeName,
      department,
      designation,
      currentSalary,
      requestedAmount,
      requestType,
      repaymentSchedule,
      remarks,
      slipPhotoUrl,
      approverId,
      payerId
    } = body;

    if (!employeeCode || !requestedAmount) {
      return NextResponse.json({ error: "Employee code and amount are required" }, { status: 400 });
    }

    // Generate a Request ID (SA-YYYYMMDD-Random)
    const requestId = `SA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    // Insert into salary_advance_requests
    // Using queryRaw for the new table
    await prisma.$executeRaw`
      INSERT INTO salary_advance_requests (
        organization_id,
        request_id,
        employee_code,
        employee_name,
        department,
        designation,
        current_salary,
        requested_amount,
        request_type,
        repayment_schedule,
        remarks,
        slip_photo_url,
        status
      ) VALUES (
        ${dbUser.organizationId},
        ${requestId},
        ${employeeCode},
        ${employeeName},
        ${department},
        ${designation},
        ${Number(currentSalary)},
        ${Number(requestedAmount)},
        ${requestType || 'Initial'},
        ${repaymentSchedule},
        ${remarks},
        ${slipPhotoUrl},
        'PENDING'
      )
    `;

    // Also create a record in the generic 'requisitions' table to maintain workflow compatibility
    // This allows the existing Approval/Payment screens to work without being rewritten
    const requisition = await prisma.requisition.create({
      data: {
        organizationId: dbUser.organizationId,
        requisitionTypeId: null, // Custom module
        createdById: BigInt(user.sub),
        requestId: requestId,
        status: "SUBMITTED",
        approvalStatus: "PENDING",
        priority: "NORMAL",
        description: `Salary Advance Request (${requestType || 'Initial'}) for ${employeeName}`,
        amount: Number(requestedAmount),
        requiredFor: "SALARY_ADVANCE",
        approverId: approverId ? BigInt(approverId) : null,
        payerId: payerId ? BigInt(payerId) : null,
        cardSubtitleInfo: JSON.stringify({
          employeeCode,
          employeeName,
          department,
          designation,
          currentSalary,
          requestType,
          repaymentSchedule,
          remarks,
          slipPhotoUrl,
          isNewModel: true // Flag to indicate it exists in the new table too
        })
      }
    });

    return NextResponse.json({ 
      id: String(requisition.id), // Return the requisition ID for frontend redirect
      requestId 
    });
  } catch (error) {
    console.error("Create request error:", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}
