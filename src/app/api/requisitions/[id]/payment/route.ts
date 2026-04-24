import { NextRequest, NextResponse } from 'next/server';
import { PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hydrateDemoModuleGlobals } from '@/lib/stores/demo-module-store';
import { findDevUserById } from '@/lib/stores/dev-auth-store';
import { getEffectiveRoleContext } from '@/lib/effective-role-context';
import { canRunRequisitionWorkflowStep } from '@/lib/config/requisition-workflow-config';
import {
  getRequisitionWorkflowConfig,
  getRequisitionWorkflowOrganizationScope,
} from '@/lib/stores/requisition-workflow-store';

hydrateDemoModuleGlobals();

const DEV_IDS = new Set(['9999', '9998', '9997', '9996']);
type DevRequisitionRecord = {
  id: string;
  approvalStatus?: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  paymentUtrNo?: string | null;
  paymentMode?: string | null;
  paidAt?: string | null;
  paidByName?: string | null;
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
  if (role !== 'ACCOUNTANT' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Accountants or Admins can update payment' }, { status: 403 });
  }

  const body = (await req.json()) as {
    paymentStatus: string;
    utrNo?: string;
    paymentMode?: string;
    paymentDate?: string;
    amount?: number;
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
        key: 'payment',
        roleKey: effectiveRoleContext?.roleKey || role,
        record: targetStore[idx],
      });
      if (!access.allowed) {
        return NextResponse.json({ error: access.reason }, { status: 409 });
      }
    }

    targetStore[idx] = {
      ...targetStore[idx],
      paymentStatus: body.paymentStatus,
      paymentUtrNo: body.utrNo,
      paymentMode: body.paymentMode,
      paidAt: body.paymentStatus === 'DONE' ? new Date().toISOString() : targetStore[idx].paidAt,
      paidByName: role === 'ADMIN' ? 'Test Admin' : 'Test Accountant',
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
      key: 'payment',
      roleKey: effectiveRoleContext?.roleKey || role,
      record: existing,
    });
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason }, { status: 409 });
    }

    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        paymentStatus: body.paymentStatus as PaymentStatus,
        paymentUtrNo: body.utrNo,
        paymentMode: body.paymentMode,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
        paymentAmount: body.amount,
        paidById: BigInt(user.sub),
        paidAt: body.paymentStatus === 'DONE' ? new Date() : undefined,
        accountantTime: new Date(),
      },
    });
    return NextResponse.json(requisition);
  } catch (error: unknown) {
    console.error('Payment error:', error);
    return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
  }
}
