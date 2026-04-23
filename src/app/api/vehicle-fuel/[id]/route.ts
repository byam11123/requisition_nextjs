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
const MODULE_KEY = "VEHICLE_FUEL";

type VehicleFuelMeta = {
  requestedByName?: string;
  fuelType?: "PETROL" | "DIESEL";
  vehicleType?: string;
  rcNo?: string;
  lastPurchaseDate?: string;
  lastIssuedQtyLitres?: number;
  lastReading?: number;
  currentReading?: number;
  totalRunning?: number;
  currentRequirementLitres?: number;
  fuelPumpName?: string;
  billAmount?: number;
  billUploadedAt?: string | null;
};

type VehicleFuelRow = {
  id: bigint | string;
  requestId?: string | null;
  approvalStatus?: string | null;
  createdAt?: Date | string | null;
  submittedAt?: Date | string | null;
  materialPhotoUrl?: string | null;
  billPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
  approvedAt?: Date | string | null;
  createdBy?: {
    fullName?: string | null;
  } | null;
  approvedBy?: {
    fullName?: string | null;
  } | null;
};

type DevRequisitionRecord = Record<string, unknown> & {
  id: string | number;
  organizationId?: string;
  requestId?: string;
  approvalStatus?: string;
  status?: string;
  createdAt?: string;
  submittedAt?: string;
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

const parseMeta = (raw: string | null | undefined): VehicleFuelMeta => {
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

const mapApprovalToStatus = (
  approvalStatus: string | null | undefined,
  billPhotoUrl?: string | null,
) => {
  if (approvalStatus === "REJECTED") return "REJECTED" as const;
  if (billPhotoUrl) return "COMPLETED" as const;
  if (approvalStatus === "APPROVED") return "APPROVED" as const;
  return "PENDING" as const;
};

const mapVehicleFuelRecord = (row: VehicleFuelRow) => {
  const meta = parseMeta(row.cardSubtitleInfo);
  const entryTimestamp = row.submittedAt || row.createdAt || new Date().toISOString();

  return {
    id: String(row.id),
    requestId: row.requestId || "",
    status: mapApprovalToStatus(row.approvalStatus, row.billPhotoUrl),
    approvalStatus:
      row.approvalStatus === "APPROVED" || row.approvalStatus === "REJECTED"
        ? row.approvalStatus
        : "PENDING",
    entryTimestamp:
      typeof entryTimestamp === "string"
        ? entryTimestamp
        : new Date(entryTimestamp).toISOString(),
    requestedByName: meta.requestedByName || row.createdBy?.fullName || "",
    fuelType: meta.fuelType === "PETROL" ? "PETROL" : "DIESEL",
    vehicleType: meta.vehicleType || "",
    rcNo: meta.rcNo || "",
    lastPurchaseDate: meta.lastPurchaseDate || "",
    lastIssuedQtyLitres: Number(meta.lastIssuedQtyLitres || 0),
    lastReading: Number(meta.lastReading || 0),
    currentReading: Number(meta.currentReading || 0),
    totalRunning: Number(meta.totalRunning || 0),
    currentRequirementLitres: Number(meta.currentRequirementLitres || 0),
    lastReadingPhotoUrl: row.materialPhotoUrl || null,
    billPhotoUrl: row.billPhotoUrl || null,
    billAmount: Number(meta.billAmount || 0),
    fuelPumpName: meta.fuelPumpName || "",
    approvedAt:
      typeof row.approvedAt === "string"
        ? row.approvedAt
        : row.approvedAt
          ? new Date(row.approvedAt).toISOString()
          : null,
    approvedByName: row.approvedBy?.fullName || null,
    billUploadedAt: meta.billUploadedAt || null,
  };
};

const getScopedDevRecord = (id: string, organizationId?: string | null) => {
  const store = g.__devReqStore || [];
  return store.find(
    (row) =>
      String(row.id) === String(id) &&
      row.requiredFor === MODULE_KEY &&
      (organizationId ? row.organizationId === organizationId : !row.organizationId),
  );
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
      const record = getScopedDevRecord(id, signedUpDevUser?.organizationId);
      if (!record) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(
        mapVehicleFuelRecord({
          ...record,
          createdBy: { fullName: record.createdByName || "" },
          approvedBy: { fullName: record.approvedByName || "" },
        }),
      );
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
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
      });
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(mapVehicleFuelRecord(row));
    } catch (dbError) {
      console.error("Vehicle fuel detail GET database fallback:", dbError);
      return NextResponse.json(
        { error: "Vehicle fuel detail unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Vehicle fuel detail GET error:", error);
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

  try {
    const body = await req.json();
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

      const current = store[index];
      const meta = parseMeta(
        typeof current.cardSubtitleInfo === "string" ? current.cardSubtitleInfo : null,
      );

      if (current.approvalStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Approve the fuel request before uploading the bill" },
          { status: 409 },
        );
      }

      if (!current.billPhotoUrl) {
        return NextResponse.json(
          { error: "Upload the fuel bill before saving bill details" },
          { status: 400 },
        );
      }

      const nextMeta: VehicleFuelMeta = {
        ...meta,
        fuelPumpName: body.fuelPumpName || "",
        billAmount: Number(body.billAmount || 0),
        billUploadedAt: new Date().toISOString(),
      };

      store[index] = {
        ...current,
        status: "COMPLETED",
        cardSubtitleInfo: JSON.stringify(nextMeta),
      };

      return NextResponse.json(
        mapVehicleFuelRecord({
          ...store[index],
          createdBy: { fullName: store[index].createdByName || "" },
          approvedBy: { fullName: store[index].approvedByName || "" },
        }),
      );
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
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
      });
      if (!row) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (row.approvalStatus !== "APPROVED") {
        return NextResponse.json(
          { error: "Approve the fuel request before uploading the bill" },
          { status: 409 },
        );
      }

      if (!row.billPhotoUrl) {
        return NextResponse.json(
          { error: "Upload the fuel bill before saving bill details" },
          { status: 400 },
        );
      }

      const meta = parseMeta(row.cardSubtitleInfo);
      const nextMeta: VehicleFuelMeta = {
        ...meta,
        fuelPumpName: body.fuelPumpName || "",
        billAmount: Number(body.billAmount || 0),
        billUploadedAt: new Date().toISOString(),
      };

      const updated = await prisma.requisition.update({
        where: { id: BigInt(id) },
        data: {
          amount: Number(body.billAmount || 0),
          status: "COMPLETED",
          cardSubtitleInfo: JSON.stringify(nextMeta),
        },
        include: {
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
      });

      return NextResponse.json(mapVehicleFuelRecord(updated));
    } catch (dbError) {
      console.error("Vehicle fuel detail PUT database fallback:", dbError);
      return NextResponse.json(
        { error: "Vehicle fuel bill update unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Vehicle fuel detail PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
