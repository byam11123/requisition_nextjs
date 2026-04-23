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
  organizationId?: bigint | string | null;
  requestId?: string | null;
  approvalStatus?: string | null;
  status?: string | null;
  createdAt?: Date | string | null;
  submittedAt?: Date | string | null;
  materialPhotoUrl?: string | null;
  billPhotoUrl?: string | null;
  cardSubtitleInfo?: string | null;
  createdBy?: {
    fullName?: string | null;
  } | null;
  approvedBy?: {
    fullName?: string | null;
  } | null;
  approvedAt?: Date | string | null;
  requiredFor?: string | null;
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
  __devReqCounter?: number;
};

if (!g.__devReqStore) {
  g.__devReqStore = [];
}
if (typeof g.__devReqCounter !== "number") {
  g.__devReqCounter = 0;
}

const devStore = () => g.__devReqStore ?? [];

const nextDevId = () => {
  g.__devReqCounter =
    (typeof g.__devReqCounter === "number" ? g.__devReqCounter : 0) + 1;

  return {
    id: String(1000 + g.__devReqCounter),
    seq: g.__devReqCounter,
  };
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
  const approvedAt = row.approvedAt || null;

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
    requestedByName:
      meta.requestedByName || row.createdBy?.fullName || "",
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
      typeof approvedAt === "string"
        ? approvedAt
        : approvedAt
          ? new Date(approvedAt).toISOString()
          : null,
    approvedByName: row.approvedBy?.fullName || null,
    billUploadedAt: meta.billUploadedAt || null,
  };
};

const getDevFuelRows = (organizationId?: string | null) =>
  devStore()
    .filter((row) => row.requiredFor === MODULE_KEY)
    .filter((row) =>
      organizationId ? row.organizationId === organizationId : !row.organizationId,
    )
    .map((row) =>
      mapVehicleFuelRecord({
        ...row,
        createdBy: { fullName: row.createdByName || "" },
        approvedBy: { fullName: row.approvedByName || "" },
      }),
    );

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const signedUpDevUser = findDevUserById(user.sub);

    if (DEV_IDS.has(user.sub)) {
      return NextResponse.json(getDevFuelRows());
    }

    if (signedUpDevUser) {
      return NextResponse.json(getDevFuelRows(signedUpDevUser.organizationId));
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
          approvedBy: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(rows.map(mapVehicleFuelRecord));
    } catch (dbError) {
      console.error("Vehicle fuel GET database fallback:", dbError);
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error("Vehicle fuel GET error:", error);
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
    const body = await req.json();
    const signedUpDevUser = findDevUserById(user.sub);
    const payloadMeta: VehicleFuelMeta = {
      requestedByName: body.requestedByName || "",
      fuelType: body.fuelType === "PETROL" ? "PETROL" : "DIESEL",
      vehicleType: body.vehicleType || "",
      rcNo: body.rcNo || "",
      lastPurchaseDate: body.lastPurchaseDate || "",
      lastIssuedQtyLitres: Number(body.lastIssuedQtyLitres || 0),
      lastReading: Number(body.lastReading || 0),
      currentReading: Number(body.currentReading || 0),
      totalRunning: Number(body.totalRunning || 0),
      currentRequirementLitres: Number(body.currentRequirementLitres || 0),
      fuelPumpName: "",
      billAmount: 0,
      billUploadedAt: null,
    };

    if (DEV_IDS.has(user.sub) || signedUpDevUser) {
      const { id, seq } = nextDevId();
      const year = new Date().getFullYear();
      const createdByName = payloadMeta.requestedByName || signedUpDevUser?.fullName || "Test User";
      const created: DevRequisitionRecord = {
        id,
        organizationId: signedUpDevUser?.organizationId,
        requestId: `FUEL-${year}-${String(seq).padStart(4, "0")}`,
        approvalStatus: "PENDING",
        status: "SUBMITTED",
        createdAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
        createdByName,
        approvedByName: null,
        approvedAt: null,
        materialPhotoUrl: null,
        billPhotoUrl: null,
        requiredFor: MODULE_KEY,
        cardSubtitleInfo: JSON.stringify(payloadMeta),
      };

      devStore().unshift(created);
      return NextResponse.json(
        mapVehicleFuelRecord({
          ...created,
          createdBy: { fullName: createdByName },
          approvedBy: null,
        }),
      );
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

      const requestId = `FUEL-${new Date().getFullYear()}-${String(nextId).padStart(4, "0")}`;

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
          materialDescription: payloadMeta.vehicleType || "",
          siteAddress: payloadMeta.rcNo || "",
          submittedAt: new Date(),
          cardSubtitleInfo: JSON.stringify(payloadMeta),
        },
        include: {
          createdBy: { select: { fullName: true } },
          approvedBy: { select: { fullName: true } },
        },
      });

      return NextResponse.json(mapVehicleFuelRecord(created));
    } catch (dbError) {
      console.error("Vehicle fuel POST database fallback:", dbError);
      return NextResponse.json(
        { error: "Vehicle fuel request save is unavailable right now" },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Vehicle fuel POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
