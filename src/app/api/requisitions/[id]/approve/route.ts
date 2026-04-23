import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

const DEV_IDS = new Set(['9999', '9998', '9997', '9996']);
const g = globalThis as any;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const role = user.role;
  if (role !== 'MANAGER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Managers or Admins can approve requisitions' }, { status: 403 });
  }

  const { approvalStatus, notes } = await req.json();

  if (DEV_IDS.has(user.sub)) {
    const reqStore: any[] = g.__devReqStore || [];
    const repairStore: any[] = g.__devRepairStore || [];
    
    let targetStore = reqStore;
    let idx = reqStore.findIndex(r => String(r.id) === id);
    
    if (idx === -1) {
      targetStore = repairStore;
      idx = repairStore.findIndex(r => String(r.id) === id);
    }

    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
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
    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: approvalStatus as any,
        approvalNotes: notes,
        approvedById: BigInt(user.sub),
        approvedAt: approvalStatus === 'APPROVED' ? new Date() : undefined,
        managerTime: new Date(),
        status: approvalStatus === 'APPROVED' ? 'APPROVED' : approvalStatus === 'REJECTED' ? 'REJECTED' : undefined,
      },
    });
    return NextResponse.json(requisition);
  } catch (e: any) {
    console.error('Approval error:', e);
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
