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
const MODULE_KEY = "DRIVER_ATTENDANCE";

type AttendanceRecord = {
  id: string;
  organizationId?: string;
  requestId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  timestamp: string;
  adminName: string;
  driverName: string;
  fromSiteName: string;
  toSiteName: string;
  fatherName: string;
  vehicleType: string;
  vehicleName: string;
  vehicleNumber: string;
  geoTagPhotoUrl: string | null;
  approvedAt?: string | null;
  approvedByName?: string | null;
};

type AttendanceMeta = {
  adminName?: string;
  driverName?: string;
  fromSiteName?: string;
  toSiteName?: string;
  fatherName?: string;
  vehicleType?: string;
  vehicleName?: string;
  vehicleNumber?: string;
};

type AttendanceRow = {
  id: bigint | string;
  requestId?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  submittedAt?: Date | string | null;
  createdAt?: Date | string | null;
  timestamp?: string | null;
  adminName?: string | null;
  driverName?: string | null;
  fromSiteName?: string | null;
  toSiteName?: string | null;
  fatherName?: string | null;
  vehicleType?: string | null;
  vehicleName?: string | null;
  vehicleNumber?: string | null;
  siteAddress?: string | null;
  materialDescription?: string | null;
  vendorName?: string | null;
  materialPhotoUrl?: string | null;
  geoTagPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
  approvedAt?: Date | string | null;
  createdBy?: {
    fullName?: string | null;
  } | null;
  approvedBy?: {
    fullName?: string | null;
  } | null;
};

type AttendanceStoreGlobal = typeof globalThis & {
  __devAttendanceStore?: AttendanceRecord[];
};

const g = globalThis as AttendanceStoreGlobal;

const parseMeta = (raw: string | null | undefined): AttendanceMeta => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mapApprovalStatusToAttendanceStatus = (
  approvalStatus: string | null | undefined,
): "PENDING" | "APPROVED" | "REJECTED" => {
  if (approvalStatus === "APPROVED") return "APPROVED";
  if (approvalStatus === "REJECTED") return "REJECTED";
  return "PENDING";
};

const mapAttendanceRecord = (row: AttendanceRow): AttendanceRecord => {
  const meta = parseMeta(row.cardSubtitleInfo);
  const timestampSource =
    row.submittedAt || row.createdAt || row.timestamp || new Date().toISOString();

  return {
    id: String(row.id),
    requestId: row.requestId || "",
    status:
      row.status && ["PENDING", "APPROVED", "REJECTED"].includes(row.status)
        ? (row.status as "PENDING" | "APPROVED" | "REJECTED")
        : mapApprovalStatusToAttendanceStatus(row.approvalStatus),
    approvalStatus:
      row.approvalStatus === "APPROVED" || row.approvalStatus === "REJECTED"
        ? row.approvalStatus
        : "PENDING",
    timestamp:
      typeof timestampSource === "string"
        ? timestampSource
        : new Date(timestampSource).toISOString(),
    adminName: meta.adminName || row.createdBy?.fullName || row.adminName || "",
    driverName: meta.driverName || row.materialDescription || row.driverName || "",
    fromSiteName: meta.fromSiteName || row.siteAddress || row.fromSiteName || "",
    toSiteName: meta.toSiteName || row.toSiteName || "",
    fatherName: meta.fatherName || row.fatherName || "NA",
    vehicleType: meta.vehicleType || row.vehicleType || "",
    vehicleName: meta.vehicleName || row.vendorName || row.vehicleName || "",
    vehicleNumber: meta.vehicleNumber || row.vehicleNumber || "",
    geoTagPhotoUrl: row.materialPhotoUrl || row.geoTagPhotoUrl || null,
    approvedAt:
      typeof row.approvedAt === "string"
        ? row.approvedAt
        : row.approvedAt
          ? new Date(row.approvedAt).toISOString()
          : null,
    approvedByName: row.approvedBy?.fullName || null,
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

  try {
    const signedUpDevUser = findDevUserById(user.sub);

    if (DEV_IDS.has(user.sub) || signedUpDevUser) {
      const store = g.__devAttendanceStore || [];
      const record = store.find(
        (item) =>
          String(item.id) === String(id) &&
          (signedUpDevUser ? item.organizationId === signedUpDevUser.organizationId : !item.organizationId),
      );
      if (!record) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(record);
    }

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
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
      },
    });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(mapAttendanceRecord(row));
  } catch (error) {
    console.error("Attendance detail GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
