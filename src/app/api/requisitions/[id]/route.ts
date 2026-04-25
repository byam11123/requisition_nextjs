import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { hydrateDemoModuleGlobals } from '@/lib/stores/demo-module-store';

declare global { interface BigInt { toJSON(): string; } }
BigInt.prototype.toJSON = function () { return this.toString(); };

hydrateDemoModuleGlobals();





// GET /api/requisitions/:id
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });



  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const requisition = await prisma.requisition.findFirst({
      where: { id: BigInt(id), organizationId: dbUser.organizationId },
      include: {
        createdBy: { select: { fullName: true, id: true } },
        approvedBy: { select: { fullName: true, id: true } },
        paidBy: { select: { fullName: true, id: true } },
        dispatchedBy: { select: { fullName: true, id: true } },
      },
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
