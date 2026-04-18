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
    const store: any[] = g.__devReqStore || [];
    const idx = store.findIndex(r => String(r.id) === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    store[idx] = {
      ...store[idx],
      paymentStatus: body.paymentStatus,
      paymentUtrNo: body.utrNo,
      paymentMode: body.paymentMode,
      paidAt: body.paymentStatus === 'DONE' ? new Date().toISOString() : store[idx].paidAt,
      paidByName: role === 'ADMIN' ? 'Test Admin' : 'Test Accountant',
    };
    return NextResponse.json(store[idx]);
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
        paidAt: body.paymentStatus === 'DONE' ? new Date() : undefined,
      },
    });
    return NextResponse.json(requisition);
  } catch (e: any) {
    return NextResponse.json({ error: 'Payment update failed' }, { status: 500 });
  }
}
