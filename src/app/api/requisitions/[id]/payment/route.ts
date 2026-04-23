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
  if (role !== 'ACCOUNTANT' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only Accountants or Admins can update payment' }, { status: 403 });
  }

  const body = await req.json();

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
      paymentStatus: body.paymentStatus,
      paymentUtrNo: body.utrNo,
      paymentMode: body.paymentMode,
      paidAt: body.paymentStatus === 'DONE' ? new Date().toISOString() : targetStore[idx].paidAt,
      paidByName: role === 'ADMIN' ? 'Test Admin' : 'Test Accountant',
    };
    return NextResponse.json(targetStore[idx]);
  }

  try {
    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        paymentStatus: body.paymentStatus as any,
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
  } catch (e: any) {
    console.error('Payment error:', e);
    return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
  }
}
