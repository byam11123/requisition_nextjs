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
  const isDeliver = body.action === "DELIVER";

  if (DEV_IDS.has(user.sub)) {
    const store: any[] = g.__devRepairStore || [];
    const idx = store.findIndex((r) => String(r.id) === String(id));
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    
    const prev = store[idx];
    const updates: any = { ...body };
    
    if (isDeliver) {
      updates.deliveryStatus = "DELIVERED";
      updates.receivedDate = new Date().toISOString();
    } else {
      updates.dispatchStatus = "DISPATCHED";
      updates.dispatchedAt = new Date().toISOString();
      updates.dispatchedByName = "Test User";
    }

    store[idx] = { ...prev, ...updates };
    return NextResponse.json(store[idx]);
  }

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: BigInt(user.sub) } });
    if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const row = await prisma.requisition.findUnique({ where: { id: BigInt(id) } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const meta = JSON.parse(row.cardSubtitleInfo || "{}");
    
    if (isDeliver) {
      meta.deliveryStatus = "DELIVERED";
      meta.receivedBy = body.receivedBy || meta.receivedBy || "";
      meta.receivedDate = new Date().toISOString();
    } else {
      meta.dispatchSite = body.dispatchSite || meta.dispatchSite || "";
      meta.dispatchByName = body.dispatchByName || meta.dispatchByName || "";
      meta.dispatchStatus = "DISPATCHED";
      meta.dispatchDate = new Date().toISOString();
    }

    const updated = await prisma.requisition.update({
      where: { id: BigInt(id) },
      data: {
        dispatchStatus: isDeliver ? "DELIVERED" : "DISPATCHED",
        dispatchedAt: isDeliver ? undefined : new Date(),
        dispatchedById: isDeliver ? undefined : dbUser.id,
        materialReceived: isDeliver ? true : undefined,
        cardSubtitleInfo: JSON.stringify(meta),
      }
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Repair dispatch error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
