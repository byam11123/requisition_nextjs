import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
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

const MODULE_KEY = "REPAIR_MAINTENANCE";

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
  responsiblePersonName?: string;
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
        responsiblePersonName: meta.responsiblePersonName || null,
        approvalStatus: row.approvalStatus,
        paymentStatus: row.paymentStatus,
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
      responsiblePersonName: data.responsiblePersonName || "",
    };

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

    // Fetch org defaults for this module
    const defaults = await prisma.workflowDefaults.findFirst({
      where: { 
        organizationId: dbUser.organizationId, 
        module: MODULE_KEY
      }
    });

    const approverId = data.approverId ? BigInt(data.approverId) : defaults?.defaultApproverId;
    const payerId = data.payerId ? BigInt(data.payerId) : defaults?.defaultPayerId;
    const dispatcherId = data.dispatcherId ? BigInt(data.dispatcherId) : defaults?.defaultDispatcherId;

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
        approverId,
        payerId,
        dispatcherId,
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
      responsiblePersonName: payloadMeta.responsiblePersonName || null,
      approvalStatus: created.approvalStatus,
      paymentStatus: created.paymentStatus,
    });
  } catch (error) {
    console.error("Repair/Maintenance POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const perms = await resolvePermissions({ userId: user.sub, baseRole: user.role, organizationId: user.organizationId });
  if (!perms.has("repair.delete")) {
    return NextResponse.json({ error: "You do not have permission to delete repair records." }, { status: 403 });
  }

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });
    }

    const prismaIds = ids.map(id => BigInt(id));
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.requisition.deleteMany({
      where: {
        id: { in: prismaIds as any },
        organizationId: dbUser.organizationId,
        requiredFor: MODULE_KEY,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Repair DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
