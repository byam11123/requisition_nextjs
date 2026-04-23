import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { findDevUserById } from "@/lib/dev-auth-store";
import { hydrateDemoModuleGlobals } from "@/lib/demo-module-store";
import { prisma } from "@/lib/prisma";

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

type SalaryAdvanceStatus = "PENDING" | "APPROVED" | "REJECTED";

type SalaryAdvanceRecord = {
  id: string;
  organizationId?: string;
  status: SalaryAdvanceStatus;
  approvedAt?: string | null;
  approvedByName?: string | null;
};

type SalaryAdvanceStoreGlobal = typeof globalThis & {
  __devSalaryAdvanceStore?: SalaryAdvanceRecord[];
};

const g = globalThis as SalaryAdvanceStoreGlobal;

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = String(user.role || "").toUpperCase().trim();
  if (role !== "MANAGER") {
    return NextResponse.json(
      { error: "Only managers can approve salary advance requests." },
      { status: 403 },
    );
  }

  const body = (await req.json()) as { status?: SalaryAdvanceStatus };
  const nextStatus: SalaryAdvanceStatus =
    body.status === "APPROVED" || body.status === "REJECTED"
      ? body.status
      : "APPROVED";

  const signedUpDevUser = findDevUserById(user.sub);

  if (DEV_IDS.has(user.sub) || signedUpDevUser) {
    const store = g.__devSalaryAdvanceStore || [];
    const row = store.find(
      (item) =>
        String(item.id) === String(id) &&
        (signedUpDevUser ? item.organizationId === signedUpDevUser.organizationId : !item.organizationId),
    );

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    row.status = nextStatus;
    row.approvedAt = new Date().toISOString();
    row.approvedByName = signedUpDevUser?.fullName || "Manager";

    return NextResponse.json(row);
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

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: nextStatus,
        status: nextStatus,
        approvedAt: new Date(),
        approvedById: BigInt(user.sub),
      },
      include: {
        approvedBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json({
      id: String(updated.id),
      status: nextStatus,
      approvedAt: updated.approvedAt,
      approvedByName: updated.approvedBy?.fullName || dbUser.fullName || "Manager",
    });
  } catch (error) {
    console.error("Salary advance approve error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
