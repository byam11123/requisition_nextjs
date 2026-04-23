import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hydrateDemoModuleGlobals } from '@/lib/demo-module-store';
import { findDevUserById } from '@/lib/dev-auth-store';
import { getEffectiveRoleContext } from '@/lib/effective-role-context';
import { canRunRequisitionWorkflowStep } from '@/lib/requisition-workflow-config';
import {
  getRequisitionWorkflowConfig,
  getRequisitionWorkflowOrganizationScope,
} from '@/lib/requisition-workflow-store';

hydrateDemoModuleGlobals();

const DEV_IDS = new Set(['9999', '9998', '9997', '9996']);
type DevRequisitionRecord = {
  id: string;
  requiredFor?: string;
  approvalStatus?: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  dispatchedAt?: string | null;
  dispatchedByName?: string | null;
  status?: string;
  warrantyStatus?: string;
  cardSubtitleInfo?: string | null;
};

const g = globalThis as typeof globalThis & {
  __devReqStore?: DevRequisitionRecord[];
  __devRepairStore?: DevRequisitionRecord[];
};

function isInWarrantyRepairRecord(record: DevRequisitionRecord | null | undefined) {
  if (!record) return false;

  if (String(record.warrantyStatus || '').toUpperCase() === 'IN_WARRANTY') {
    return true;
  }

  if (String(record.requiredFor || '').toUpperCase() !== 'REPAIR_MAINTAINANCE') {
    return false;
  }

  if (!record.cardSubtitleInfo) {
    return false;
  }

  try {
    const parsed = JSON.parse(record.cardSubtitleInfo) as { warrantyStatus?: string };
    return String(parsed.warrantyStatus || '').toUpperCase() === 'IN_WARRANTY';
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.role;
  if (role !== 'PURCHASER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Purchasers can mark dispatch' }, { status: 403 });
  }

  const signedUpDevUser = findDevUserById(user.sub);
  const effectiveRoleContext = await getEffectiveRoleContext({
    userId: user.sub,
    baseRole: user.role,
    organizationId: signedUpDevUser?.organizationId,
  });
  const organizationScope = await getRequisitionWorkflowOrganizationScope(user.sub);
  const workflowConfig = organizationScope
    ? await getRequisitionWorkflowConfig(organizationScope)
    : null;

  if (DEV_IDS.has(user.sub) || signedUpDevUser) {
    const reqStore = g.__devReqStore || [];
    const repairStore = g.__devRepairStore || [];
    
    let targetStore = reqStore;
    let idx = reqStore.findIndex(r => String(r.id) === id);
    
    if (idx === -1) {
      targetStore = repairStore;
      idx = repairStore.findIndex(r => String(r.id) === id);
    }

    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (workflowConfig && !isInWarrantyRepairRecord(targetStore[idx])) {
      const access = canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: 'dispatch',
        roleKey: effectiveRoleContext?.roleKey || role,
        record: targetStore[idx],
      });
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason }, { status: 409 });
      }
    }

    targetStore[idx] = {
      ...targetStore[idx],
      dispatchStatus: 'DISPATCHED',
      dispatchedAt: new Date().toISOString(),
      dispatchedByName: role === 'ADMIN' ? 'Test Admin' : 'Test Purchaser',
      status: 'COMPLETED',
    };
    return NextResponse.json(targetStore[idx]);
  }

  try {
    if (!organizationScope || !workflowConfig) {
      return NextResponse.json({ error: 'Workflow configuration unavailable' }, { status: 404 });
    }

    const existing = await prisma.requisition.findUnique({
      where: { id: BigInt(id) },
      select: {
        requiredFor: true,
        cardSubtitleInfo: true,
        approvalStatus: true,
        paymentStatus: true,
        dispatchStatus: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!isInWarrantyRepairRecord(existing)) {
      const access = canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: 'dispatch',
        roleKey: effectiveRoleContext?.roleKey || role,
        record: existing,
      });
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason }, { status: 409 });
      }
    }

    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        dispatchStatus: 'DISPATCHED',
        dispatchedAt: new Date(),
        dispatchedById: BigInt(user.sub),
        status: 'COMPLETED',
      },
    });
    return NextResponse.json(requisition);
  } catch (error: unknown) {
    console.error('Dispatch error:', error);
    return NextResponse.json({ error: 'Dispatch failed' }, { status: 500 });
  }
}
