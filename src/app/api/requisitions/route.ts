import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hydrateDemoModuleGlobals } from '@/lib/stores/demo-module-store';

// Add BigInt support for JSON.stringify
declare global {
  interface BigInt {
    toJSON(): string;
  }
}
BigInt.prototype.toJSON = function () {
  return this.toString();
};

hydrateDemoModuleGlobals();

// ── Dev bypass helpers ───────────────────────────────────────────────────────
const DEV_IDS = new Set(['9999', '9998', '9997', '9996']);
const NON_REQUISITION_MODULE_KEYS = new Set([
  'REPAIR_MAINTAINANCE',
  'DRIVER_ATTENDANCE',
  'SALARY_ADVANCE',
  'VEHICLE_FUEL',
]);

// Global singleton so all route modules share the same store
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
// Always ensure counter is in sync (independent guard so it isn't skipped)
if (typeof g.__devReqCounter !== 'number') {
  g.__devReqCounter = (g.__devReqStore as any[]).length;
}
// Convenience accessors
const devStore = (): any[] => g.__devReqStore;
const nextDevId = (): { id: string; seq: number } => {
  g.__devReqCounter = (typeof g.__devReqCounter === 'number' ? g.__devReqCounter : 3) + 1;
  return { id: String(1000 + g.__devReqCounter), seq: g.__devReqCounter };
};
// ─────────────────────────────────────────────────────────────────────────────

const isPlainRequisitionRecord = (record: { requiredFor?: string | null }) =>
  !record.requiredFor || !NON_REQUISITION_MODULE_KEYS.has(record.requiredFor);

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Bypass for all dev test users
    if (DEV_IDS.has(user.sub)) {
      return NextResponse.json(devStore().filter(isPlainRequisitionRecord));
    }

    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) }});
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const whereClause: any = {
      organizationId: dbUser.organizationId,
      OR: [
        { requiredFor: null },
        { requiredFor: '' },
        { requiredFor: { notIn: Array.from(NON_REQUISITION_MODULE_KEYS) } },
      ],
    };

    if (status) {
      whereClause.status = status;
    }

    // Role-based filtering logic
    if (user.role === 'PURCHASER') {
      whereClause.createdById = BigInt(user.sub);
    } 
    // Managers can see SUBMITTED upwards, accountants APPROVED upwards (custom logic depending on original system)

    const requisitions = await prisma.requisition.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { fullName: true, id: true }},
        type: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requisitions);
  } catch (error: any) {
    console.error('Requisitions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();

    // Bypass for all dev test users — persist to shared global store
    if (DEV_IDS.has(user.sub)) {
      const { id: newId, seq } = nextDevId();
      const year = new Date().getFullYear();
      const newReq = {
        id: newId,
        requestId: `REQ-${year}-${String(seq).padStart(4, '0')}`,
        materialDescription: data.materialDescription || '',
        description: data.description || '',
        siteAddress: data.siteAddress || '',
        quantity: Number(data.quantity) || 1,
        amount: Number(data.amount) || 0,
        priority: data.priority || 'NORMAL',
        approvalStatus: 'PENDING',
        paymentStatus: 'NOT_DONE',
        dispatchStatus: 'NOT_DISPATCHED',
        status: data.submit ? 'SUBMITTED' : 'DRAFT',
        vendorName: data.vendorName || '',
        poDetails: data.poDetails || '',
        indentNo: data.indentNo || '',
        requiredFor: data.requiredFor || '',
        createdAt: new Date().toISOString(),
        approvedAt: null, paidAt: null, dispatchedAt: null,
        createdByName: 'Test Purchaser',
        approvedByName: null, paidByName: null, dispatchedByName: null,
        approvalNotes: null, paymentUtrNo: null, paymentMode: null,
        createdBy: { id: user.sub, fullName: 'Test Purchaser' },
        billPhotoUrl: null, materialPhotoUrl: null, paymentPhotoUrl: null, vendorPaymentDetailsUrl: null,
      };
      devStore().unshift(newReq);
      return NextResponse.json(newReq);
    }

    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) }, include: { organization: true }});
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const nextId = await prisma.requisition.count({ where: { organizationId: dbUser.organizationId }}) + 1;
    const prefix = dbUser.organization.requisitionPrefix || 'REQ';
    const requestId = `${prefix}-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;

    const requisition = await prisma.requisition.create({
      data: {
        organizationId: dbUser.organizationId,
        createdById: BigInt(user.sub),
        requestId,
        status: data.submit ? 'SUBMITTED' : 'DRAFT',
        priority: data.priority || 'NORMAL',
        description: data.description,
        siteAddress: data.siteAddress,
        materialDescription: data.materialDescription,
        quantity: data.quantity ? parseInt(data.quantity, 10) : null,
        amount: data.amount ? parseFloat(data.amount) : null,
        poDetails: data.poDetails,
        requiredFor: data.requiredFor,
        vendorName: data.vendorName,
        indentNo: data.indentNo,
        submittedAt: data.submit ? new Date() : null,
      },
    });

    return NextResponse.json(requisition);
  } catch (error: any) {
    console.error('Requisitions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

