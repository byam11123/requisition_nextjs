import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { findDevUserById } from "@/lib/stores/dev-auth-store";
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
const MODULE_KEY = "VEHICLE_FUEL";

type DevRequisitionRecord = Record<string, unknown> & {
  id: string | number;
  organizationId?: string;
  requestId?: string;
  approvalStatus?: string;
  status?: string;
  materialPhotoUrl?: string | null;
  billPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
  createdByName?: string;
  approvedByName?: string | null;
  approvedAt?: string | null;
  requiredFor?: string;
};

const g = globalThis as typeof globalThis & {
  __devReqStore?: DevRequisitionRecord[];
};

const parseMeta = (raw: string | null | undefined) => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

const mapRecord = (row: DevRequisitionRecord) => {
  const meta = parseMeta(typeof row.cardSubtitleInfo === "string" ? row.cardSubtitleInfo : null);
  return {
    id: String(row.id),
    requestId: row.requestId || "",
    status:
      row.approvalStatus === "REJECTED"
        ? "REJECTED"
        : row.billPhotoUrl
          ? "COMPLETED"
          : row.approvalStatus === "APPROVED"
            ? "APPROVED"
            : "PENDING",
    approvalStatus:
      row.approvalStatus === "APPROVED" || row.approvalStatus === "REJECTED"
        ? row.approvalStatus
        : "PENDING",
    entryTimestamp: String(row.createdAt || new Date().toISOString()),
    requestedByName: String(meta.requestedByName || row.createdByName || ""),
    fuelType: meta.fuelType === "PETROL" ? "PETROL" : "DIESEL",
    vehicleType: String(meta.vehicleType || ""),
    rcNo: String(meta.rcNo || ""),
    lastPurchaseDate: String(meta.lastPurchaseDate || ""),
    lastIssuedQtyLitres: Number(meta.lastIssuedQtyLitres || 0),
    lastReading: Number(meta.lastReading || 0),
    currentReading: Number(meta.currentReading || 0),
    totalRunning: Number(meta.totalRunning || 0),
    currentRequirementLitres: Number(meta.currentRequirementLitres || 0),
    lastReadingPhotoUrl: row.materialPhotoUrl || null,
    billPhotoUrl: row.billPhotoUrl || null,
    billAmount: Number(meta.billAmount || 0),
    fuelPumpName: String(meta.fuelPumpName || ""),
    approvedAt: row.approvedAt || null,
    approvedByName: row.approvedByName || null,
    billUploadedAt:
      typeof meta.billUploadedAt === "string" ? meta.billUploadedAt : null,
  };
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "MANAGER" && user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Only Managers or Admins can approve fuel requests" },
      { status: 403 },
    );
  }

  const body = await req.json();
  const approvalStatus =
    body.approvalStatus === "REJECTED" ? "REJECTED" : "APPROVED";

  try {
    const signedUpDevUser = findDevUserById(user.sub);

    if (DEV_IDS.has(user.sub) || signedUpDevUser) {
      const store = g.__devReqStore || [];
      const index = store.findIndex(
        (row) =>
          String(row.id) === String(id) &&
          row.requiredFor === MODULE_KEY &&
          (signedUpDevUser ? row.organizationId === signedUpDevUser.organizationId : !row.organizationId),
      );

      if (index === -1) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      store[index] = {
        ...store[index],
        approvalStatus,
        status: approvalStatus === "APPROVED" ? "APPROVED" : "REJECTED",
        approvedByName:
          signedUpDevUser?.fullName ||
          (user.role === "ADMIN" ? "Admin" : "Manager"),
        approvedAt: new Date().toISOString(),
      };

      return NextResponse.json(mapRecord(store[index]));
    }

    try {
      const requisition = await prisma.requisition.update({
        where: { id: BigInt(id) },
        data: {
          approvalStatus,
          approvedById: BigInt(user.sub),
          approvedAt: new Date(),
          status: approvalStatus === "APPROVED" ? "APPROVED" : "REJECTED",
        },
        include: {
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
      });

      if (requisition.requiredFor !== MODULE_KEY) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const meta = parseMeta(requisition.cardSubtitleInfo);
      return NextResponse.json({
        id: String(requisition.id),
        requestId: requisition.requestId,
        status:
          approvalStatus === "REJECTED"
            ? "REJECTED"
            : requisition.billPhotoUrl
              ? "COMPLETED"
              : "APPROVED",
        approvalStatus,
        entryTimestamp: requisition.submittedAt || requisition.createdAt,
        requestedByName: String(meta.requestedByName || requisition.createdBy?.fullName || ""),
        fuelType: meta.fuelType === "PETROL" ? "PETROL" : "DIESEL",
        vehicleType: String(meta.vehicleType || ""),
        rcNo: String(meta.rcNo || ""),
        lastPurchaseDate: String(meta.lastPurchaseDate || ""),
        lastIssuedQtyLitres: Number(meta.lastIssuedQtyLitres || 0),
        lastReading: Number(meta.lastReading || 0),
        currentReading: Number(meta.currentReading || 0),
        totalRunning: Number(meta.totalRunning || 0),
        currentRequirementLitres: Number(meta.currentRequirementLitres || 0),
        lastReadingPhotoUrl: requisition.materialPhotoUrl || null,
        billPhotoUrl: requisition.billPhotoUrl || null,
        billAmount: Number(meta.billAmount || 0),
        fuelPumpName: String(meta.fuelPumpName || ""),
        approvedAt: requisition.approvedAt,
        approvedByName: requisition.approvedBy?.fullName || null,
        billUploadedAt:
          typeof meta.billUploadedAt === "string" ? meta.billUploadedAt : null,
      });
    } catch (dbError) {
      console.error("Vehicle fuel approve database fallback:", dbError);
      return NextResponse.json(
        { error: "Vehicle fuel approval unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Vehicle fuel approve error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
