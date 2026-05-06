import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { resolvePermissions } from "@/lib/permissions";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

hydrateDemoModuleGlobals();


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
  approvedBy?: {
    fullName?: string | null;
  } | null;
  approvedAt?: Date | string | null;
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
    approvedAt:
      typeof row.approvedAt === "string"
        ? row.approvedAt
        : row.approvedAt
          ? new Date(row.approvedAt).toISOString()
          : null,
    approvedByName: row.approvedBy?.fullName || null,
  };
};



export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {


    try {
      const organizationId = user.organizationId === 'demo' ? 'demo' : BigInt(user.organizationId);
      const rows = await prisma.requisition.findMany({
        where: {
          organizationId: organizationId as any,
          requiredFor: MODULE_KEY,
        },
        include: {
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
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



    try {
      const organizationId = user.organizationId === 'demo' ? 'demo' : BigInt(user.organizationId);
      const userId = user.sub === 'demo' ? 'demo' : BigInt(user.sub);

      const nextId =
        (await prisma.requisition.count({
          where: {
            organizationId: organizationId as any,
            requiredFor: MODULE_KEY,
          },
        })) + 1;

      const requestId = `ATT-${new Date().getFullYear()}-${String(nextId).padStart(
        4,
        "0",
      )}`;

      // Fetch org defaults for this module
      const defaults = await prisma.workflowDefaults.findFirst({
        where: { 
          organizationId: organizationId as any, 
          module: MODULE_KEY
        }
      });

      const approverId = data.approverId ? BigInt(data.approverId) : defaults?.defaultApproverId;

      const created = await prisma.requisition.create({
        data: {
          organizationId: organizationId as any,
          createdById: userId as any,
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
          approverId,
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
export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const perms = await resolvePermissions({ userId: user.sub, baseRole: user.role, organizationId: user.organizationId });
  if (!perms.has("attendance.delete")) {
    return NextResponse.json({ error: "You do not have permission to delete attendance records." }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const prismaIds = ids.map(id => BigInt(id));
    const organizationId = user.organizationId === 'demo' ? 'demo' : BigInt(user.organizationId);

    await prisma.requisition.deleteMany({
      where: {
        id: { in: prismaIds as any },
        organizationId: organizationId as any,
        requiredFor: MODULE_KEY,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Attendance DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
