import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/demo-module-store";

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
const MODULE_KEY = "REPAIR_MAINTAINANCE";

const g = globalThis as any;
if (!g.__devRepairStore) {
  g.__devRepairStore = [];
}
if (typeof g.__devRepairCounter !== "number") {
  g.__devRepairCounter = 0;
}

const devStore = (): any[] => g.__devRepairStore;
const nextDevId = (): { id: string; seq: number } => {
  g.__devRepairCounter = (typeof g.__devRepairCounter === "number" ? g.__devRepairCounter : 0) + 1;
  return { id: String(3000 + g.__devRepairCounter), seq: g.__devRepairCounter };
};

type RepairMeta = {
  repairRequisitionByName?: string;
  warrantyStatus?: "IN_WARRANTY" | "OUT_OF_WARRANTY";
  repairStatusAfterPhotoUrl?: string;
  dispatchItemPhotoUrl?: string;
  expectedReturnDate?: string;
  repairStatus?: string;
  returnedByName?: string;
  dateOfReturn?: string;
  dispatchSite?: string;
  dispatchByName?: string;
  dispatchDate?: string;
};

const parseMeta = (raw: string | null | undefined): RepairMeta => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? parsed : {};
  } catch {
    return {};
  }
};

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    if (DEV_IDS.has(user.sub)) {
      return NextResponse.json(devStore());
    }

    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

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

    const mapped = rows.map((row) => {
      const meta = parseMeta(row.cardSubtitleInfo);
      return {
        id: row.id,
        requestId: row.requestId,
        timestamp: row.createdAt,
        repairRequisitionByName: meta.repairRequisitionByName || row.createdBy?.fullName || "",
        warrantyStatus: meta.warrantyStatus || "OUT_OF_WARRANTY",
        priority: row.priority,
        siteAddress: row.siteAddress,
        itemDescription: row.materialDescription,
        quantity: row.quantity,
        repairVendorName: row.vendorName,
        repairStatusBeforePhoto: row.materialPhotoUrl,
        repairStatusAfterPhoto: meta.repairStatusAfterPhotoUrl || null,
        expectedReturnDate: meta.expectedReturnDate || null,
        repairStatus: meta.repairStatus || null,
        returnedByName: meta.returnedByName || null,
        dateOfReturn: meta.dateOfReturn || null,
        dispatchStatus: row.dispatchStatus,
        dispatchItemPhoto: meta.dispatchItemPhotoUrl || null,
        paymentProofPhoto: row.paymentPhotoUrl,
        billInvoicePhoto: row.billPhotoUrl,
        dispatchSite: meta.dispatchSite || null,
        dispatchByName: meta.dispatchByName || null,
        dispatchDate: meta.dispatchDate || null,
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("Repair/Maintenance GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await req.json();
    const payloadMeta: RepairMeta = {
      repairRequisitionByName: data.repairRequisitionByName || "",
      warrantyStatus: data.warrantyStatus || "OUT_OF_WARRANTY",
      expectedReturnDate: data.expectedReturnDate || "",
      repairStatus: data.repairStatus || "",
      returnedByName: data.returnedByName || "",
      dateOfReturn: data.dateOfReturn || "",
      dispatchSite: data.dispatchSite || "",
      dispatchByName: data.dispatchByName || "",
      dispatchDate: data.dispatchDate || "",
    };

    if (DEV_IDS.has(user.sub)) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const created = {
        id: newId,
        requestId: `RM-${year}-${String(seq).padStart(4, "0")}`,
        timestamp: new Date().toISOString(),
        repairRequisitionByName: data.repairRequisitionByName || "Test User",
        warrantyStatus: payloadMeta.warrantyStatus || "OUT_OF_WARRANTY",
        priority: data.priority || "NORMAL",
        siteAddress: data.siteAddress || "",
        itemDescription: data.itemDescription || "",
        quantity: Number(data.quantity) || 1,
        repairVendorName: data.repairVendorName || "",
        repairStatusBeforePhoto: data.repairStatusBeforePhoto || null,
        repairStatusAfterPhoto: payloadMeta.repairStatusAfterPhotoUrl || null,
        expectedReturnDate: payloadMeta.expectedReturnDate || null,
        repairStatus: payloadMeta.repairStatus || null,
        returnedByName: payloadMeta.returnedByName || null,
        dateOfReturn: payloadMeta.dateOfReturn || null,
        dispatchStatus: data.dispatchStatus || "NOT_DISPATCHED",
        dispatchItemPhoto: payloadMeta.dispatchItemPhotoUrl || null,
        paymentProofPhoto: data.paymentProofPhoto || null,
        billInvoicePhoto: data.billInvoicePhoto || null,
        dispatchSite: payloadMeta.dispatchSite || null,
        dispatchByName: payloadMeta.dispatchByName || null,
        dispatchDate: payloadMeta.dispatchDate || null,
      };
      devStore().unshift(created);
      return NextResponse.json(created);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
      include: { organization: true },
    });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const nextId =
      (await prisma.requisition.count({
        where: { organizationId: dbUser.organizationId, requiredFor: MODULE_KEY },
      })) + 1;
    const requestId = `RM-${new Date().getFullYear()}-${String(nextId).padStart(4, "0")}`;

    const created = await prisma.requisition.create({
      data: {
        organizationId: dbUser.organizationId,
        createdById: BigInt(user.sub),
        requestId,
        status: "SUBMITTED",
        approvalStatus: "PENDING",
        paymentStatus: "NOT_DONE",
        dispatchStatus: data.dispatchStatus || "NOT_DISPATCHED",
        priority: data.priority || "NORMAL",
        requiredFor: MODULE_KEY,
        siteAddress: data.siteAddress || "",
        materialDescription: data.itemDescription || "",
        quantity: data.quantity ? Number(data.quantity) : null,
        vendorName: data.repairVendorName || "",
        materialPhotoUrl: data.repairStatusBeforePhoto || null,
        paymentPhotoUrl: data.paymentProofPhoto || null,
        cardSubtitleInfo: JSON.stringify(payloadMeta),
        submittedAt: new Date(),
      },
      include: {
        createdBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json({
      id: created.id,
      requestId: created.requestId,
      timestamp: created.createdAt,
      repairRequisitionByName: payloadMeta.repairRequisitionByName || created.createdBy?.fullName || "",
      warrantyStatus: payloadMeta.warrantyStatus || "OUT_OF_WARRANTY",
      priority: created.priority,
      siteAddress: created.siteAddress,
      itemDescription: created.materialDescription,
      quantity: created.quantity,
      repairVendorName: created.vendorName,
      repairStatusBeforePhoto: created.materialPhotoUrl,
      repairStatusAfterPhoto: payloadMeta.repairStatusAfterPhotoUrl || null,
      expectedReturnDate: payloadMeta.expectedReturnDate || null,
      repairStatus: payloadMeta.repairStatus || null,
      returnedByName: payloadMeta.returnedByName || null,
      dateOfReturn: payloadMeta.dateOfReturn || null,
      dispatchStatus: created.dispatchStatus,
      dispatchItemPhoto: payloadMeta.dispatchItemPhotoUrl || null,
      paymentProofPhoto: created.paymentPhotoUrl,
      billInvoicePhoto: created.billPhotoUrl,
      dispatchSite: payloadMeta.dispatchSite || null,
      dispatchByName: payloadMeta.dispatchByName || null,
      dispatchDate: payloadMeta.dispatchDate || null,
    });
  } catch (error) {
    console.error("Repair/Maintenance POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
