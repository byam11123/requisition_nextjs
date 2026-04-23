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
  receivedBy?: string;
  receivedDate?: string;
  deliveryStatus?: "NOT_DELIVERED" | "DELIVERED";
  deliveredAt?: string;
  deliveredByName?: string;
  contacts?: Array<{ name: string; phone: string; role?: string }>;
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

const mapRepair = (row: any) => {
  const meta = parseMeta(row.cardSubtitleInfo);
  return {
    id: row.id,
    requestId: row.requestId,
    timestamp: row.createdAt,
    priority: row.priority,
    repairRequisitionByName: meta.repairRequisitionByName || row.createdBy?.fullName || "",
    warrantyStatus: meta.warrantyStatus || "OUT_OF_WARRANTY",
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
    receivedBy: meta.receivedBy || null,
    receivedDate: meta.receivedDate || null,
    deliveryStatus: meta.deliveryStatus || "NOT_DELIVERED",
    deliveredAt: meta.deliveredAt || null,
    deliveredByName: meta.deliveredByName || null,
    contacts: meta.contacts || [],
    approvalStatus: row.approvalStatus,
    paymentStatus: row.paymentStatus,
    status: row.status,
    approvalNotes: row.approvalNotes,
    paymentUtrNo: row.paymentUtrNo,
    paymentMode: row.paymentMode,
    approvedAt: row.approvedAt,
    paidAt: row.paidAt,
    dispatchedAt: row.dispatchedAt,
    createdByName: row.createdBy?.fullName || null,
    approvedByName: row.approvedBy?.fullName || null,
    paidByName: row.paidBy?.fullName || null,
    dispatchedByName: row.dispatchedBy?.fullName || null,
    vendorPaymentDetailsUrl: row.vendorPaymentDetailsUrl,
  };
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (DEV_IDS.has(user.sub)) {
    const store: any[] = g.__devRepairStore || [];
    const row = store.find((r) => String(r.id) === String(id));
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const row = await prisma.requisition.findFirst({
      where: { id: BigInt(id), organizationId: dbUser.organizationId, requiredFor: MODULE_KEY },
      include: {
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
        paidBy: { select: { fullName: true } },
        dispatchedBy: { select: { fullName: true } },
      },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(mapRepair(row));
  } catch (error) {
    console.error("Repair/Maintainance detail GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (DEV_IDS.has(user.sub)) {
    const store: any[] = g.__devRepairStore || [];
    const idx = store.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    store[idx] = { ...store[idx], ...body };
    return NextResponse.json(store[idx]);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const row = await prisma.requisition.findFirst({
      where: { id: BigInt(id), organizationId: dbUser.organizationId, requiredFor: MODULE_KEY },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const prevMeta = parseMeta(row.cardSubtitleInfo);
    const nextMeta: RepairMeta = {
      ...prevMeta,
      repairRequisitionByName: body.repairRequisitionByName ?? prevMeta.repairRequisitionByName ?? "",
      warrantyStatus: body.warrantyStatus ?? prevMeta.warrantyStatus ?? "OUT_OF_WARRANTY",
      expectedReturnDate: body.expectedReturnDate ?? prevMeta.expectedReturnDate ?? "",
      repairStatusAfterPhotoUrl: body.repairStatusAfterPhoto ?? prevMeta.repairStatusAfterPhotoUrl ?? "",
      dispatchItemPhotoUrl: body.dispatchItemPhoto ?? prevMeta.dispatchItemPhotoUrl ?? "",
      repairStatus: body.repairStatus ?? prevMeta.repairStatus ?? "",
      returnedByName: body.returnedByName ?? prevMeta.returnedByName ?? "",
      dateOfReturn: body.dateOfReturn ?? prevMeta.dateOfReturn ?? "",
      dispatchSite: body.dispatchSite ?? prevMeta.dispatchSite ?? "",
      dispatchDate: body.dispatchDate ?? prevMeta.dispatchDate ?? "",
      receivedBy: body.receivedBy ?? prevMeta.receivedBy ?? "",
      receivedDate: body.receivedDate ?? prevMeta.receivedDate ?? "",
      deliveryStatus: body.deliveryStatus ?? prevMeta.deliveryStatus ?? "NOT_DELIVERED",
      deliveredAt: (body.deliveryStatus === "DELIVERED" && prevMeta.deliveryStatus !== "DELIVERED") ? new Date().toISOString() : prevMeta.deliveredAt,
      deliveredByName:
        body.deliveryStatus === "DELIVERED" &&
        prevMeta.deliveryStatus !== "DELIVERED"
          ? dbUser.fullName ?? undefined
          : prevMeta.deliveredByName,
      contacts: Array.isArray(body.contacts) ? body.contacts : prevMeta.contacts ?? [],
    };

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        priority: body.priority ?? undefined,
        siteAddress: body.siteAddress ?? undefined,
        materialDescription: body.itemDescription ?? undefined,
        quantity: body.quantity ? Number(body.quantity) : undefined,
        vendorName: body.repairVendorName ?? undefined,
        dispatchStatus: body.dispatchStatus ?? undefined,
        dispatchedAt: (body.dispatchStatus === "DISPATCHED" && row.dispatchStatus === "NOT_DISPATCHED") ? new Date() : undefined,
        dispatchedById: (body.dispatchStatus === "DISPATCHED" && row.dispatchStatus === "NOT_DISPATCHED") ? dbUser.id : undefined,
        cardSubtitleInfo: JSON.stringify(nextMeta),
      },
      include: {
        createdBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
        paidBy: { select: { fullName: true } },
        dispatchedBy: { select: { fullName: true } },
      },
    });

    return NextResponse.json(mapRepair(updated));
  } catch (error) {
    console.error("Repair/Maintainance detail PUT error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
