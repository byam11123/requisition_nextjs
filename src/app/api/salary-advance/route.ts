import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/demo-module-store";
import { findDevUserById } from "@/lib/dev-auth-store";
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

type SalaryAdvanceRecord = {
  id: string;
  organizationId?: string;
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
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
};

type SalaryAdvanceStoreGlobal = typeof globalThis & {
  __devSalaryAdvanceStore?: SalaryAdvanceRecord[];
  __devSalaryAdvanceCounter?: number;
};

type SalaryAdvanceRow = {
  id: bigint | string;
  requestId?: string | null;
  approvalStatus?: string | null;
  createdAt?: Date | string | null;
  submittedAt?: Date | string | null;
  materialDescription?: string | null;
  siteAddress?: string | null;
  vendorName?: string | null;
  amount?: Prisma.Decimal | number | string | null;
  description?: string | null;
  materialPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
};

const g = globalThis as SalaryAdvanceStoreGlobal;
if (!g.__devSalaryAdvanceStore) {
  g.__devSalaryAdvanceStore = [];
}
if (typeof g.__devSalaryAdvanceCounter !== "number") {
  g.__devSalaryAdvanceCounter = 0;
}

const devStore = (): SalaryAdvanceRecord[] => g.__devSalaryAdvanceStore ?? [];
const nextDevId = (): { id: string; seq: number } => {
  g.__devSalaryAdvanceCounter =
    (typeof g.__devSalaryAdvanceCounter === "number"
      ? g.__devSalaryAdvanceCounter
      : 0) + 1;

  return {
    id: String(8000 + g.__devSalaryAdvanceCounter),
    seq: g.__devSalaryAdvanceCounter,
  };
};

const parseMeta = (raw: string | null | undefined): SalaryAdvanceMeta => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mapApprovalStatusToStatus = (
  approvalStatus: string | null | undefined,
): "PENDING" | "APPROVED" | "REJECTED" => {
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
    status: mapApprovalStatusToStatus(row.approvalStatus),
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
  };
};

const getDevSalaryAdvanceRecords = (organizationId?: string | null) =>
  devStore().filter((record) =>
    organizationId ? record.organizationId === organizationId : !record.organizationId,
  );

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signedUpDevUser = findDevUserById(user.sub);

    if (DEV_IDS.has(user.sub)) {
      return NextResponse.json(getDevSalaryAdvanceRecords());
    }

    if (signedUpDevUser) {
      return NextResponse.json(getDevSalaryAdvanceRecords(signedUpDevUser.organizationId));
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(user.sub) },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const rows = await prisma.requisition.findMany({
        where: {
          organizationId: dbUser.organizationId,
          requiredFor: MODULE_KEY,
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(rows.map(mapSalaryAdvanceRecord));
    } catch (dbError) {
      console.error("Salary advance GET database fallback:", dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Salary advance GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    const signedUpDevUser = findDevUserById(user.sub);
    const payloadMeta: SalaryAdvanceMeta = {
      employeeName: data.employeeName || "",
      employeeCode: data.employeeCode || "",
      designation: data.designation || "",
      department: data.department || "",
      currentSalary: Number(data.currentSalary || 0),
      totalAdvanceRequest: Number(data.totalAdvanceRequest || 0),
      repaymentSchedule: data.repaymentSchedule || "",
      totalAdditionalAdvances: Number(data.totalAdditionalAdvances || 0),
      remarks: data.remarks || "",
      deductionHistory: [],
    };

    if (DEV_IDS.has(user.sub)) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const created: SalaryAdvanceRecord = {
        id: newId,
        requestId: `SA-${year}-${String(seq).padStart(4, "0")}`,
        status: "PENDING",
        entryTimestamp: new Date().toISOString(),
        employeeName: payloadMeta.employeeName || "",
        employeeCode: payloadMeta.employeeCode || "",
        designation: payloadMeta.designation || "",
        department: payloadMeta.department || "",
        currentSalary: Number(payloadMeta.currentSalary || 0),
        totalAdvanceRequest: Number(payloadMeta.totalAdvanceRequest || 0),
        repaymentSchedule: payloadMeta.repaymentSchedule || "",
        initialSlipPhotoUrl: null,
        totalAdditionalAdvances: Number(payloadMeta.totalAdditionalAdvances || 0),
        remarks: payloadMeta.remarks || "",
        deductionHistory: [],
        totalDeducted: 0,
        balanceAdvance:
          Number(payloadMeta.totalAdvanceRequest || 0) +
          Number(payloadMeta.totalAdditionalAdvances || 0),
      };

      devStore().unshift(created);
      return NextResponse.json(created);
    }

    if (signedUpDevUser) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const totalAdvanceRequest = Number(payloadMeta.totalAdvanceRequest || 0);
      const totalAdditionalAdvances = Number(payloadMeta.totalAdditionalAdvances || 0);
      const created: SalaryAdvanceRecord = {
        id: newId,
        organizationId: signedUpDevUser.organizationId,
        requestId: `SA-${year}-${String(seq).padStart(4, "0")}`,
        status: "PENDING",
        entryTimestamp: new Date().toISOString(),
        employeeName: payloadMeta.employeeName || "",
        employeeCode: payloadMeta.employeeCode || "",
        designation: payloadMeta.designation || "",
        department: payloadMeta.department || "",
        currentSalary: Number(payloadMeta.currentSalary || 0),
        totalAdvanceRequest,
        repaymentSchedule: payloadMeta.repaymentSchedule || "",
        initialSlipPhotoUrl: null,
        totalAdditionalAdvances,
        remarks: payloadMeta.remarks || "",
        deductionHistory: [],
        totalDeducted: 0,
        balanceAdvance: totalAdvanceRequest + totalAdditionalAdvances,
      };

      devStore().unshift(created);
      return NextResponse.json(created);
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: BigInt(user.sub) },
        include: { organization: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const nextId =
        (await prisma.requisition.count({
          where: {
            organizationId: dbUser.organizationId,
            requiredFor: MODULE_KEY,
          },
        })) + 1;

      const requestId = `SA-${new Date().getFullYear()}-${String(nextId).padStart(
        4,
        "0",
      )}`;

      const created = await prisma.requisition.create({
        data: {
          organizationId: dbUser.organizationId,
          createdById: BigInt(user.sub),
          requestId,
          status: "SUBMITTED",
          approvalStatus: "PENDING",
          paymentStatus: "NOT_DONE",
          dispatchStatus: "NOT_DISPATCHED",
          priority: "NORMAL",
          requiredFor: MODULE_KEY,
          materialDescription: payloadMeta.employeeName || "",
          siteAddress: payloadMeta.department || "",
          vendorName: payloadMeta.designation || "",
          amount: Number(payloadMeta.totalAdvanceRequest || 0),
          description: payloadMeta.remarks || "",
          cardSubtitleInfo: JSON.stringify(payloadMeta),
          submittedAt: new Date(),
        },
      });

      return NextResponse.json(mapSalaryAdvanceRecord(created));
    } catch (dbError) {
      console.error("Salary advance POST database fallback:", dbError);
      return NextResponse.json(
        { error: "Salary advance save is unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Salary advance POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
