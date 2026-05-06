import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";
import { findDevUserById } from "@/lib/stores/dev-auth-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { canRunRequisitionWorkflowStep } from "@/lib/config/requisition-workflow-config";
import { getRequisitionWorkflowConfig, getRequisitionWorkflowOrganizationScope } from "@/lib/stores/requisition-workflow-store";
import { resolvePermissions } from "@/lib/permissions";
import { canPerformStep } from "@/lib/workflow-assignee-guard";

hydrateDemoModuleGlobals();
const DEV_IDS = new Set(["9999","9998","9997","9996"]);
type DevRecord = { id: string; requiredFor?: string; approvalStatus?: string; paymentStatus?: string; dispatchStatus?: string; dispatchedAt?: string|null; dispatchedByName?: string|null; status?: string; warrantyStatus?: string; cardSubtitleInfo?: string|null; };
const g = globalThis as typeof globalThis & { __devReqStore?: DevRecord[]; __devRepairStore?: DevRecord[]; };

function isInWarrantyRepairRecord(record: DevRecord | null | undefined) {
  if (!record) return false;
  if (String(record.warrantyStatus || "").toUpperCase() === "IN_WARRANTY") return true;
  if (String(record.requiredFor || "").toUpperCase() !== "REPAIR_MAINTENANCE") return false;
  if (!record.cardSubtitleInfo) return false;
  try { const parsed = JSON.parse(record.cardSubtitleInfo) as { warrantyStatus?: string }; return String(parsed.warrantyStatus || "").toUpperCase() === "IN_WARRANTY"; } catch { return false; }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const perms = await resolvePermissions({ userId: user.sub, baseRole: user.role, organizationId: user.organizationId });
  if (!perms.has("requisition.dispatch") && !perms.has("requisition.deliver")) {
    return NextResponse.json({ error: "You do not have permission to update dispatch status." }, { status: 403 });
  }

  let body: { action?: string } = {};
  try {
    if (req.headers.get("content-length") !== "0") {
      body = await req.json();
    }
  } catch (e) {
    // Body is empty or not JSON, which is fine for some actions
  }
  
  const isDeliver = body.action === "DELIVER";
  const role = user.role;
  const signedUpDevUser = findDevUserById(user.sub);
  const effectiveRoleContext = await getEffectiveRoleContext({ userId: user.sub, baseRole: role, organizationId: signedUpDevUser?.organizationId });
  const organizationScope = await getRequisitionWorkflowOrganizationScope(user.sub);
  const workflowConfig = organizationScope ? await getRequisitionWorkflowConfig(organizationScope) : null;

  if (DEV_IDS.has(user.sub) || signedUpDevUser) {
    const reqStore = g.__devReqStore || [];
    const repairStore = g.__devRepairStore || [];
    let targetStore = reqStore;
    let idx = reqStore.findIndex(r => String(r.id) === id);
    if (idx === -1) { targetStore = repairStore; idx = repairStore.findIndex(r => String(r.id) === id); }
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (workflowConfig && !isInWarrantyRepairRecord(targetStore[idx])) {
      const access = canRunRequisitionWorkflowStep({ config: workflowConfig, key: "dispatch", roleKey: effectiveRoleContext?.roleKey || role, record: targetStore[idx] });
      if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 409 });
    }
    const newDispatchStatus = isDeliver ? "DELIVERED" : "DISPATCHED";
    
    const updates: any = { 
      dispatchStatus: newDispatchStatus, 
      status: "COMPLETED"
    };

    if (!isDeliver && targetStore[idx].dispatchStatus === "NOT_DISPATCHED") {
      updates.dispatchedAt = new Date().toISOString();
      updates.dispatchedByName = signedUpDevUser?.fullName || role;
    }

    if (targetStore[idx].requiredFor === "REPAIR_MAINTENANCE" && isDeliver) {
      try {
        const meta = JSON.parse(targetStore[idx].cardSubtitleInfo || "{}");
        meta.deliveryStatus = "DELIVERED";
        meta.receivedDate = new Date().toISOString();
        meta.receivedBy = signedUpDevUser?.fullName || role;
        updates.cardSubtitleInfo = JSON.stringify(meta);
      } catch (e) {}
    }

    targetStore[idx] = { ...targetStore[idx], ...updates };
    return NextResponse.json(targetStore[idx]);
  }

  try {
    if (!organizationScope || !workflowConfig) return NextResponse.json({ error: "Workflow configuration unavailable" }, { status: 404 });
    const existing = await prisma.requisition.findUnique({ 
      where: { id: BigInt(id) }, 
      select: { 
        requiredFor: true, 
        cardSubtitleInfo: true, 
        approvalStatus: true, 
        paymentStatus: true, 
        dispatchStatus: true,
        approverId: true,
        payerId: true,
        dispatcherId: true
      } 
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canPerformStep('dispatch', existing, user)) {
      return NextResponse.json({ error: "You are not assigned to dispatch this request" }, { status: 403 });
    }

    if (!isInWarrantyRepairRecord(existing as unknown as DevRecord)) {
      const access = canRunRequisitionWorkflowStep({ config: workflowConfig, key: "dispatch", roleKey: effectiveRoleContext?.roleKey || role, record: existing as any });
      if (!access.allowed) return NextResponse.json({ error: access.reason }, { status: 409 });
    }
    const newDispatchStatus = isDeliver ? "DELIVERED" : "DISPATCHED";
    
    // For repairs, we need to sync the JSON metadata as well
    let cardSubtitleInfo = undefined;
    if (existing.requiredFor === "REPAIR_MAINTENANCE" && isDeliver) {
      try {
        const meta = JSON.parse(existing.cardSubtitleInfo || "{}");
        meta.deliveryStatus = "DELIVERED";
        meta.receivedDate = new Date().toISOString();
        meta.receivedBy = user.fullName || "System";
        cardSubtitleInfo = JSON.stringify(meta);
      } catch (e) {
        console.error("Failed to update repair meta during delivery:", e);
      }
    }

    const requisition = await prisma.requisition.update({ 
      where: { id: BigInt(id) }, 
      data: { 
        dispatchStatus: newDispatchStatus as any, 
        dispatchedAt: (!isDeliver && existing.dispatchStatus === "NOT_DISPATCHED") ? new Date() : undefined, 
        dispatchedById: (!isDeliver && existing.dispatchStatus === "NOT_DISPATCHED") ? BigInt(user.sub) : undefined, 
        status: "COMPLETED", 
        materialReceived: isDeliver ? true : undefined,
        cardSubtitleInfo: cardSubtitleInfo
      } 
    });
    return NextResponse.json(requisition);
  } catch (error: unknown) {
    console.error("Dispatch error:", error);
    return NextResponse.json({ error: "Dispatch failed" }, { status: 500 });
  }
}