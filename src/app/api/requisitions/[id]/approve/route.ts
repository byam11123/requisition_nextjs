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
    const store: any[] = g.__devReqStore || [];
    const idx = store.findIndex(r => String(r.id) === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    store[idx] = {
      ...store[idx],
      approvalStatus,
      approvalNotes: notes || null,
      approvedByName: role === 'ADMIN' ? 'Test Admin' : 'Test Manager',
      approvedAt: new Date().toISOString(),
      status: approvalStatus === 'APPROVED' ? 'APPROVED' : approvalStatus === 'REJECTED' ? 'REJECTED' : store[idx].status,
    };
    return NextResponse.json(store[idx]);
  }

  try {
    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: approvalStatus as any,
        approvalNotes: notes,
        approvedAt: approvalStatus === 'APPROVED' ? new Date() : undefined,
        status: approvalStatus === 'APPROVED' ? 'APPROVED' : approvalStatus === 'REJECTED' ? 'REJECTED' : undefined,
      },
    });
    return NextResponse.json(requisition);
  } catch (e: any) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
