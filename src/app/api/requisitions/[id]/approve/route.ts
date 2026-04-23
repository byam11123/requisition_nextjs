import { NextRequest, NextResponse } from 'next/server';
import { ApprovalStatus } from '@prisma/client';
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
  approvalStatus?: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  approvalNotes?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  status?: string;
};

const g = globalThis as typeof globalThis & {
  __devReqStore?: DevRequisitionRecord[];
  __devRepairStore?: DevRequisitionRecord[];
};

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.role;
  if (role !== 'MANAGER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Managers or Admins can approve requisitions' }, { status: 403 });
  }

  const { approvalStatus, notes } = (await req.json()) as {
    approvalStatus: string;
    notes?: string;
  };
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

    if (workflowConfig) {
      const access = canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: 'approval',
        roleKey: effectiveRoleContext?.roleKey || role,
        record: targetStore[idx],
      });
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason }, { status: 409 });
      }
    }
    
    targetStore[idx] = {
      ...targetStore[idx],
      approvalStatus,
      approvalNotes: notes || null,
      approvedByName: role === 'ADMIN' ? 'Test Admin' : 'Test Manager',
      approvedAt: new Date().toISOString(),
      status: approvalStatus === 'APPROVED' ? 'APPROVED' : approvalStatus === 'REJECTED' ? 'REJECTED' : targetStore[idx].status,
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
        approvalStatus: true,
        paymentStatus: true,
        dispatchStatus: true,
      },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const access = canRunRequisitionWorkflowStep({
      config: workflowConfig,
      key: 'approval',
      roleKey: effectiveRoleContext?.roleKey || role,
      record: existing,
    });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 409 });
    }

    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: approvalStatus as ApprovalStatus,
        approvalNotes: notes,
        approvedById: BigInt(user.sub),
        approvedAt: approvalStatus === 'APPROVED' ? new Date() : undefined,
        managerTime: new Date(),
        status: approvalStatus === 'APPROVED' ? 'APPROVED' : approvalStatus === 'REJECTED' ? 'REJECTED' : undefined,
      },
    });
    return NextResponse.json(requisition);
  } catch (error: unknown) {
    console.error('Approval error:', error);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
