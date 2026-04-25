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


// ─────────────────────────────────────────────────────────────────────────────

const NON_REQUISITION_MODULE_KEYS = new Set([
  'REPAIR_MAINTAINANCE',
  'DRIVER_ATTENDANCE',
  'SALARY_ADVANCE',
  'VEHICLE_FUEL',
]);

const isPlainRequisitionRecord = (record: { requiredFor?: string | null }) =>
  !record.requiredFor || !NON_REQUISITION_MODULE_KEYS.has(record.requiredFor);

export async function GET(req: NextRequest) {
    const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');



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

