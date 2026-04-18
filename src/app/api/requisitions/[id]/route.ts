import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

declare global { interface BigInt { toJSON(): string; } }
BigInt.prototype.toJSON = function () { return this.toString(); };

const DEV_IDS = new Set(['9999', '9998', '9997', '9996']);

// Import devReqStore from parent – can't easily do cross-module in Next.js
// So we duplicate a small lookup here using a global singleton
const g = globalThis as any;
if (!g.__devReqStore) {
  g.__devReqStore = [
    {
      id: '1', requestId: 'REQ-2026-0001',
      materialDescription: 'MacBook Pro M3 Max for Development',
      description: 'Required for dev team.', siteAddress: 'Head Office HQ',
      quantity: 1, amount: 249000, priority: 'HIGH',
      approvalStatus: 'APPROVED', paymentStatus: 'NOT_DONE', dispatchStatus: 'NOT_DISPATCHED',
      status: 'APPROVED', vendorName: 'Apple India', poDetails: 'PO-001', indentNo: 'IN-001', requiredFor: 'Dev team',
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      paidAt: null, dispatchedAt: null,
      createdByName: 'Jane Smith', approvedByName: 'Mike Manager', paidByName: null, dispatchedByName: null,
      approvalNotes: 'Approved after budget review.', paymentUtrNo: null, paymentMode: null,
      createdBy: { id: '101', fullName: 'Jane Smith' },
      billPhotoUrl: null, materialPhotoUrl: null, paymentPhotoUrl: null, vendorPaymentDetailsUrl: null,
    },
    {
      id: '2', requestId: 'REQ-2026-0002',
      materialDescription: 'Office Chairs (Ergonomic) x10',
      description: '', siteAddress: 'Branch Bangalore',
      quantity: 10, amount: 125000, priority: 'NORMAL',
      approvalStatus: 'PENDING', paymentStatus: 'NOT_DONE', dispatchStatus: 'NOT_DISPATCHED',
      status: 'SUBMITTED', vendorName: 'FurniCo', poDetails: '', indentNo: '', requiredFor: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      approvedAt: null, paidAt: null, dispatchedAt: null,
      createdByName: 'Michael Scott', approvedByName: null, paidByName: null, dispatchedByName: null,
      approvalNotes: null, paymentUtrNo: null, paymentMode: null,
      createdBy: { id: '102', fullName: 'Michael Scott' },
      billPhotoUrl: null, materialPhotoUrl: null, paymentPhotoUrl: null, vendorPaymentDetailsUrl: null,
    },
    {
      id: '3', requestId: 'REQ-2026-0003',
      materialDescription: 'AWS Cloud Hosting Renewal (Annual)',
      description: 'Annual cloud billing.', siteAddress: 'Cloud Infrastructure',
      quantity: 1, amount: 450000, priority: 'HIGH',
      approvalStatus: 'APPROVED', paymentStatus: 'DONE', dispatchStatus: 'DISPATCHED',
      status: 'COMPLETED', vendorName: 'AWS India', poDetails: 'PO-003', indentNo: 'IN-003', requiredFor: 'IT Ops',
      createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      approvedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
      paidAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      dispatchedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      createdByName: 'Sarah Tech', approvedByName: 'Mike Manager', paidByName: 'Alice Accountant', dispatchedByName: 'Paul Purchaser',
      approvalNotes: 'Auto-approved.', paymentUtrNo: 'UTR2026001', paymentMode: 'NEFT',
      createdBy: { id: '103', fullName: 'Sarah Tech' },
      billPhotoUrl: null, materialPhotoUrl: null, paymentPhotoUrl: null, vendorPaymentDetailsUrl: null,
    },
  ];
}

// GET /api/requisitions/:id
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (DEV_IDS.has(user.sub)) {
    const item = (g.__devReqStore as any[]).find(r => String(r.id) === id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const requisition = await prisma.requisition.findFirst({
      where: { id: BigInt(id), organizationId: dbUser.organizationId },
      include: { createdBy: { select: { fullName: true, id: true } } },
    });
    if (!requisition) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(requisition);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/requisitions/:id/approve  → handled in /approve/route.ts
// POST /api/requisitions/:id/payment  → handled in /payment/route.ts
// POST /api/requisitions/:id/dispatch → handled in /dispatch/route.ts

// PUT /api/requisitions/:id  (edit)
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.json();

  if (DEV_IDS.has(user.sub)) {
    const store: any[] = g.__devReqStore;
    const idx = store.findIndex(r => String(r.id) === id);
    if (idx === -1) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    store[idx] = { ...store[idx], ...data };
    return NextResponse.json(store[idx]);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const requisition = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        materialDescription: data.materialDescription,
        siteAddress: data.siteAddress,
        quantity: data.quantity ? parseInt(data.quantity) : undefined,
        amount: data.amount ? parseFloat(data.amount) : undefined,
        poDetails: data.poDetails,
        requiredFor: data.requiredFor,
        vendorName: data.vendorName,
        indentNo: data.indentNo,
        description: data.description,
      },
    });
    return NextResponse.json(requisition);
  } catch (e: any) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
