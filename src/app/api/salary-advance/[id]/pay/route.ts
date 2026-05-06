import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
import { prisma } from "@/lib/prisma";
import { canPerformStep } from "@/lib/workflow-assignee-guard";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

hydrateDemoModuleGlobals();

const DEV_IDS = new Set(["9999", "9998", "9997", "9996"]);
const MODULE_KEY = "SALARY_ADVANCE";

type SalaryAdvanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { 
    paymentMode: string;
    paymentReference: string;
    paymentPhotoUrl?: string;
  };

  if (!body.paymentMode || !body.paymentReference) {
    return NextResponse.json({ error: "Payment mode and reference are required" }, { status: 400 });
  }

  const signedUpDevUser = findDevUserById(user.sub);

  if (DEV_IDS.has(user.sub) || signedUpDevUser) {
    // Demo mode: not implemented for payment details specifically in store, 
    // but we can simulate success.
    return NextResponse.json({ success: true, status: "PAID" });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.requisition.findFirst({
      where: {
        id: BigInt(id),
        organizationId: dbUser.organizationId,
        requiredFor: MODULE_KEY,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canPerformStep('pay', existing, user)) {
      return NextResponse.json({ error: "You are not assigned to pay this salary advance" }, { status: 403 });
    }

    const meta = JSON.parse(existing.cardSubtitleInfo || "{}");
    meta.paymentMode = body.paymentMode;
    meta.paymentReference = body.paymentReference;
    meta.paidAt = new Date().toISOString();
    meta.paidByName = dbUser.fullName || "Payer";
    if (body.paymentPhotoUrl) meta.paymentPhotoUrl = body.paymentPhotoUrl;

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: "APPROVED",
        status: "PAID",
        cardSubtitleInfo: JSON.stringify(meta),
        paidById: BigInt(user.sub),
        paidAt: new Date(),
        paymentPhotoUrl: body.paymentPhotoUrl || null,
      },
    });

    // SYNC with salary_advance_requests table
    if (updated.requestId) {
      await prisma.$executeRaw`
        UPDATE salary_advance_requests 
        SET 
          status = 'PAID',
          payment_mode = ${body.paymentMode},
          payment_reference = ${body.paymentReference},
          payment_photo_url = ${body.paymentPhotoUrl || null},
          paid_by = ${BigInt(user.sub)},
          paid_at = NOW()
        WHERE request_id = ${updated.requestId}
      `;
    } else {
      console.warn("Salary advance pay: No requestId found for sync", { id });
    }

    return NextResponse.json({
      id: String(updated.id),
      status: "PAID",
      paymentMode: meta.paymentMode,
      paymentReference: meta.paymentReference,
      paidAt: meta.paidAt,
      paidByName: meta.paidByName,
    });
  } catch (error: any) {
    console.error("Salary advance pay error details:", {
      message: error.message,
      stack: error.stack,
      requestId: id
    });
    return NextResponse.json({ error: `Payment confirmation failed: ${error.message}` }, { status: 500 });
  }
}
