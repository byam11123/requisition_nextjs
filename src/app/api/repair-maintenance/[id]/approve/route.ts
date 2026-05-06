import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { hydrateDemoModuleGlobals } from "@/lib/stores/demo-module-store";

hydrateDemoModuleGlobals();
const DEV_IDS = new Set(["9999","9998","9997","9996"]);
const g = globalThis as any;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (DEV_IDS.has(user.sub)) {
    const store: any[] = g.__devRepairStore || [];
    const idx = store.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    store[idx] = { 
      ...store[idx], 
      approvalStatus: body.approvalStatus || "APPROVED",
      approvedAt: new Date().toISOString(),
      approvedByName: user.fullName || "Test User"
    };
    return NextResponse.json(store[idx]);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        approvalStatus: body.approvalStatus || "APPROVED",
        approvedAt: new Date(),
        approverId: dbUser.id,
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Repair approval error:", error);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
