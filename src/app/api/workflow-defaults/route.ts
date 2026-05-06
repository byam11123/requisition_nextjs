import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const moduleName = searchParams.get("module");

  if (!moduleName) return NextResponse.json({ error: "Module is required" }, { status: 400 });

  try {
    const organizationId = user.organizationId === 'demo' ? 'demo' : BigInt(user.organizationId);
    
    const defaults = await prisma.workflowDefaults.findUnique({
      where: {
        organizationId_module: {
          organizationId: organizationId as any,
          module: moduleName,
        },
      },
    });

    return NextResponse.json(defaults ? {
      ...defaults,
      id: defaults.id.toString(),
      organizationId: defaults.organizationId.toString(),
      defaultApproverId: defaults.defaultApproverId?.toString(),
      defaultPayerId: defaults.defaultPayerId?.toString(),
      defaultDispatcherId: defaults.defaultDispatcherId?.toString(),
    } : null);
  } catch (error) {
    console.error("Workflow defaults GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { module, defaultApproverId, defaultPayerId, defaultDispatcherId } = body;

    if (!module) return NextResponse.json({ error: "Module is required" }, { status: 400 });

    const organizationId = user.organizationId === 'demo' ? 'demo' : BigInt(user.organizationId);

    const upserted = await prisma.workflowDefaults.upsert({
      where: {
        organizationId_module: {
          organizationId: organizationId as any,
          module: module,
        },
      },
      update: {
        defaultApproverId: defaultApproverId ? BigInt(defaultApproverId) : null,
        defaultPayerId: defaultPayerId ? BigInt(defaultPayerId) : null,
        defaultDispatcherId: defaultDispatcherId ? BigInt(defaultDispatcherId) : null,
      },
      create: {
        organizationId: organizationId as any,
        module: module,
        defaultApproverId: defaultApproverId ? BigInt(defaultApproverId) : null,
        defaultPayerId: defaultPayerId ? BigInt(defaultPayerId) : null,
        defaultDispatcherId: defaultDispatcherId ? BigInt(defaultDispatcherId) : null,
      },
    });

    return NextResponse.json({
      ...upserted,
      id: upserted.id.toString(),
      organizationId: upserted.organizationId.toString(),
      defaultApproverId: upserted.defaultApproverId?.toString(),
      defaultPayerId: upserted.defaultPayerId?.toString(),
      defaultDispatcherId: upserted.defaultDispatcherId?.toString(),
    });
  } catch (error) {
    console.error("Workflow defaults POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
