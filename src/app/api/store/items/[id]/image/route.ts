import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { updateStoreItemImage } from "@/lib/stores/store-management-store";
import { resolveStoreOrganizationScope } from "@/lib/store-management-scope";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "store");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const extension = file.name.split(".").pop() || "bin";
    const filename = `${Date.now()}_${id}_store.${extension}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/store/${filename}`;
    const updated = updateStoreItemImage(scope.organizationId, id, publicUrl);
    if (!updated) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Store item image upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
