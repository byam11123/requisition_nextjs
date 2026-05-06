import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
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

type SalaryAdvanceDeduction = {
  id: string;
  deductionDate: string;
  deductionAmount: number;
  remark: string;
};

type SalaryAdvanceStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

type SalaryAdvanceRecord = {
  id: string;
  requestId: string;
  status: SalaryAdvanceStatus;
  entryTimestamp: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  currentSalary: number;
  totalAdvanceRequest: number;
  repaymentSchedule: string;
  initialSlipPhotoUrl: string | null;
  totalAdditionalAdvances: number;
  remarks: string;
  deductionHistory: SalaryAdvanceDeduction[];
  totalDeducted: number;
  balanceAdvance: number;
  approvedAt?: string | null;
  approvedByName?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
  paymentMode?: string | null;
  paymentReference?: string | null;
  paymentPhotoUrl?: string | null;
};

type SalaryAdvanceMeta = {
  employeeName?: string;
  employeeCode?: string;
  designation?: string;
  department?: string;
  currentSalary?: number;
  totalAdvanceRequest?: number;
  repaymentSchedule?: string;
  totalAdditionalAdvances?: number;
  remarks?: string;
  deductionHistory?: SalaryAdvanceDeduction[];
  paidAt?: string;
  paidByName?: string;
  paymentMode?: string;
  paymentReference?: string;
  paymentPhotoUrl?: string;
};

type SalaryAdvanceStoreGlobal = typeof globalThis & {
  __devSalaryAdvanceStore?: SalaryAdvanceRecord[];
};

type SalaryAdvanceRow = {
  id: bigint | string;
  requestId?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  createdAt?: Date | string | null;
  submittedAt?: Date | string | null;
  materialDescription?: string | null;
  siteAddress?: string | null;
  vendorName?: string | null;
  amount?: Prisma.Decimal | number | string | null;
  description?: string | null;
  materialPhotoUrl?: string | null;
  paymentPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
  approvedAt?: Date | string | null;
  approvedBy?: {
    fullName?: string | null;
  } | null;
  paidAt?: Date | string | null;
  paidBy?: {
    fullName?: string | null;
  } | null;
};

const g = globalThis as SalaryAdvanceStoreGlobal;

const parseMeta = (raw: string | null | undefined): SalaryAdvanceMeta => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mapRequisitionStatus = (
  rowStatus: string | null | undefined,
  approvalStatus: string | null | undefined,
): SalaryAdvanceStatus => {
  if (rowStatus === "PAID") return "PAID";
  if (approvalStatus === "APPROVED") return "APPROVED";
  if (approvalStatus === "REJECTED") return "REJECTED";
  return "PENDING";
};

const toNumber = (
  value: Prisma.Decimal | number | string | null | undefined,
) => {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value) || 0;
  return 0;
};

const mapSalaryAdvanceRecord = (row: SalaryAdvanceRow): SalaryAdvanceRecord => {
  const meta = parseMeta(row.cardSubtitleInfo);
  const deductionHistory = Array.isArray(meta.deductionHistory)
    ? meta.deductionHistory
    : [];
  const totalAdvanceRequest = Number(meta.totalAdvanceRequest ?? toNumber(row.amount));
  const totalAdditionalAdvances = Number(meta.totalAdditionalAdvances ?? 0);
  const totalDeducted = deductionHistory.reduce(
    (sum, entry) => sum + Number(entry.deductionAmount || 0),
    0,
  );
  const balanceAdvance = Math.max(
    totalAdvanceRequest + totalAdditionalAdvances - totalDeducted,
    0,
  );

  return {
    id: String(row.id),
    requestId: row.requestId || "",
    status: mapRequisitionStatus(row.status, row.approvalStatus),
    entryTimestamp: String(row.submittedAt || row.createdAt || new Date().toISOString()),
    employeeName: meta.employeeName || row.materialDescription || "",
    employeeCode: meta.employeeCode || "",
    designation: meta.designation || row.vendorName || "",
    department: meta.department || row.siteAddress || "",
    currentSalary: Number(meta.currentSalary || 0),
    totalAdvanceRequest,
    repaymentSchedule: meta.repaymentSchedule || "",
    initialSlipPhotoUrl: row.materialPhotoUrl || null,
    totalAdditionalAdvances,
    remarks: meta.remarks || row.description || "",
    deductionHistory,
    totalDeducted,
    balanceAdvance,
    approvedAt:
      typeof row.approvedAt === "string"
        ? row.approvedAt
        : row.approvedAt
          ? new Date(row.approvedAt).toISOString()
          : null,
    approvedByName: row.approvedBy?.fullName || null,
    paidAt: row.paidAt ? new Date(row.paidAt as any).toISOString() : meta.paidAt || null,
    paidByName: row.paidBy ? (row.paidBy as any).fullName : meta.paidByName || null,
    paymentMode: meta.paymentMode || null,
    paymentReference: meta.paymentReference || null,
    paymentPhotoUrl: row.paymentPhotoUrl || meta.paymentPhotoUrl || null,
  };
};

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (DEV_IDS.has(user.sub)) {
    const store = g.__devSalaryAdvanceStore || [];
    const row = store.find((item) => String(item.id) === String(id));
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(row);
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = await prisma.requisition.findFirst({
      where: {
        id: BigInt(id),
        organizationId: dbUser.organizationId,
        requiredFor: MODULE_KEY,
      },
      include: {
        approvedBy: { select: { fullName: true } },
        paidBy: { select: { fullName: true } },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(mapSalaryAdvanceRecord(row));
  } catch (error) {
    console.error("Salary advance detail GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (DEV_IDS.has(user.sub)) {
    const store = g.__devSalaryAdvanceStore || [];
    const index = store.findIndex((item) => String(item.id) === String(id));
    if (index === -1) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const current = store[index];
    const nextDeductionHistory = Array.isArray(body.deductionHistory)
      ? (body.deductionHistory as SalaryAdvanceDeduction[])
      : current.deductionHistory;
    const totalDeducted = nextDeductionHistory.reduce(
      (sum, entry) => sum + Number(entry.deductionAmount || 0),
      0,
    );
    const totalAdvanceRequest = Number(
      body.totalAdvanceRequest ?? current.totalAdvanceRequest ?? 0,
    );
    const totalAdditionalAdvances = Number(
      body.totalAdditionalAdvances ?? current.totalAdditionalAdvances ?? 0,
    );

    store[index] = {
      ...current,
      repaymentSchedule: body.repaymentSchedule ?? current.repaymentSchedule,
      remarks: body.remarks ?? current.remarks,
      totalAdvanceRequest,
      totalAdditionalAdvances,
      deductionHistory: nextDeductionHistory,
      totalDeducted,
      balanceAdvance: Math.max(
        totalAdvanceRequest + totalAdditionalAdvances - totalDeducted,
        0,
      ),
    };

    return NextResponse.json(store[index]);
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = await prisma.requisition.findFirst({
      where: {
        id: BigInt(id),
        organizationId: dbUser.organizationId,
        requiredFor: MODULE_KEY,
      },
      include: {
        approvedBy: { select: { fullName: true } },
        paidBy: { select: { fullName: true } },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const previousMeta = parseMeta(row.cardSubtitleInfo);
    const nextMeta: SalaryAdvanceMeta = {
      ...previousMeta,
      repaymentSchedule:
        body.repaymentSchedule ?? previousMeta.repaymentSchedule ?? "",
      remarks: body.remarks ?? previousMeta.remarks ?? "",
      totalAdvanceRequest: Number(
        body.totalAdvanceRequest ?? previousMeta.totalAdvanceRequest ?? 0,
      ),
      totalAdditionalAdvances: Number(
        body.totalAdditionalAdvances ??
          previousMeta.totalAdditionalAdvances ??
          0,
      ),
      deductionHistory: Array.isArray(body.deductionHistory)
        ? (body.deductionHistory as SalaryAdvanceDeduction[])
        : previousMeta.deductionHistory ?? [],
      employeeName: previousMeta.employeeName ?? row.materialDescription ?? "",
      employeeCode: previousMeta.employeeCode ?? "",
      designation: previousMeta.designation ?? row.vendorName ?? "",
      department: previousMeta.department ?? row.siteAddress ?? "",
      currentSalary: Number(previousMeta.currentSalary ?? 0),
    };

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        amount: Number(nextMeta.totalAdvanceRequest || 0),
        description: nextMeta.remarks || "",
        cardSubtitleInfo: JSON.stringify(nextMeta),
      },
      include: {
        approvedBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json(mapSalaryAdvanceRecord(updated));
  } catch (error) {
    console.error("Salary advance detail PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
