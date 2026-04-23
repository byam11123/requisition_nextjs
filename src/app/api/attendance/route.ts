import { NextRequest, NextResponse } from "next/server";

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
};

type AttendanceStoreGlobal = typeof globalThis & {
  __devAttendanceStore?: AttendanceRecord[];
  __devAttendanceCounter?: number;
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
  createdBy?: {
    fullName?: string | null;
  } | null;
};

const g = globalThis as AttendanceStoreGlobal;
if (!g.__devAttendanceStore) {
  g.__devAttendanceStore = [];
}
if (typeof g.__devAttendanceCounter !== "number") {
  g.__devAttendanceCounter = 0;
}

const devStore = (): AttendanceRecord[] => g.__devAttendanceStore ?? [];
const nextDevId = (): { id: string; seq: number } => {
  g.__devAttendanceCounter =
    (typeof g.__devAttendanceCounter === "number"
      ? g.__devAttendanceCounter
      : 0) + 1;

  return {
    id: String(5000 + g.__devAttendanceCounter),
    seq: g.__devAttendanceCounter,
  };
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

const mapAttendanceRecord = (row: AttendanceRow) => {
  const meta = parseMeta(row.cardSubtitleInfo);
  const timestampSource =
    row.submittedAt || row.createdAt || row.timestamp || new Date().toISOString();

  return {
    id: String(row.id),
    requestId: row.requestId || "",
    status:
      row.status && ["PENDING", "APPROVED", "REJECTED"].includes(row.status)
        ? row.status
        : mapApprovalStatusToAttendanceStatus(row.approvalStatus),
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
  };
};

const getDevAttendanceRecords = (organizationId?: string | null) =>
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
      return NextResponse.json(getDevAttendanceRecords());
    }

    if (signedUpDevUser) {
      return NextResponse.json(getDevAttendanceRecords(signedUpDevUser.organizationId));
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
        include: {
          createdBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(rows.map(mapAttendanceRecord));
    } catch (dbError) {
      console.error("Attendance GET database fallback:", dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Attendance GET error:", error);
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
    const payloadMeta: AttendanceMeta = {
      adminName: data.adminName || "",
      driverName: data.driverName || "",
      fromSiteName: data.fromSiteName || "",
      toSiteName: data.toSiteName || "",
      fatherName: data.fatherName || "NA",
      vehicleType: data.vehicleType || "",
      vehicleName: data.vehicleName || "",
      vehicleNumber: data.vehicleNumber || "",
    };

    if (DEV_IDS.has(user.sub)) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const created: AttendanceRecord = {
        id: newId,
        requestId: `ATT-${year}-${String(seq).padStart(4, "0")}`,
        status: "PENDING",
        approvalStatus: "PENDING",
        timestamp: new Date().toISOString(),
        adminName: payloadMeta.adminName || "Test Admin",
        driverName: payloadMeta.driverName || "",
        fromSiteName: payloadMeta.fromSiteName || "",
        toSiteName: payloadMeta.toSiteName || "",
        fatherName: payloadMeta.fatherName || "NA",
        vehicleType: payloadMeta.vehicleType || "",
        vehicleName: payloadMeta.vehicleName || "",
        vehicleNumber: payloadMeta.vehicleNumber || "",
        geoTagPhotoUrl: null,
      };

      devStore().unshift(created);
      return NextResponse.json(created);
    }

    if (signedUpDevUser) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const created: AttendanceRecord = {
        id: newId,
        organizationId: signedUpDevUser.organizationId,
        requestId: `ATT-${year}-${String(seq).padStart(4, "0")}`,
        status: "PENDING",
        approvalStatus: "PENDING",
        timestamp: new Date().toISOString(),
        adminName: payloadMeta.adminName || signedUpDevUser.fullName,
        driverName: payloadMeta.driverName || "",
        fromSiteName: payloadMeta.fromSiteName || "",
        toSiteName: payloadMeta.toSiteName || "",
        fatherName: payloadMeta.fatherName || "NA",
        vehicleType: payloadMeta.vehicleType || "",
        vehicleName: payloadMeta.vehicleName || "",
        vehicleNumber: payloadMeta.vehicleNumber || "",
        geoTagPhotoUrl: null,
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

      const requestId = `ATT-${new Date().getFullYear()}-${String(nextId).padStart(
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
          siteAddress: payloadMeta.fromSiteName || "",
          materialDescription: payloadMeta.driverName || "",
          vendorName: payloadMeta.vehicleName || "",
          cardSubtitleInfo: JSON.stringify(payloadMeta),
          submittedAt: new Date(),
        },
        include: {
          createdBy: { select: { fullName: true } },
        },
      });

      return NextResponse.json(mapAttendanceRecord(created));
    } catch (dbError) {
      console.error("Attendance POST database fallback:", dbError);
      return NextResponse.json(
        { error: "Attendance save is unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Attendance POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
