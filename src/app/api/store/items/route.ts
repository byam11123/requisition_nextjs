import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import {
  createStoreItem,
  listStoreItems,
  listStoreLocations,
} from "@/lib/stores/store-management-store";
import { resolveStoreOrganizationScope } from "@/lib/store-management-scope";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(await listStoreItems(scope.organizationId));
  } catch (error) {
    console.error("Store items GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scope = await resolveStoreOrganizationScope(user.sub);
    if (!scope) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const locations = await listStoreLocations(scope.organizationId);
    if (
      body.initialLocationKey &&
      !locations.some((location) => location.key === body.initialLocationKey)
    ) {
      return NextResponse.json(
        { error: "Selected location does not exist" },
        { status: 400 },
      );
    }

    const created = await createStoreItem(scope.organizationId, {
      name: body.name || "",
      category: body.category || "",
      subcategory: body.subcategory || "",
      itemType: body.itemType === "ASSET" ? "ASSET" : "STOCK",
      unit: body.unit || "Nos",
      brand: body.brand || "",
      model: body.model || "",
      serialNumber: body.serialNumber || "",
      description: body.description || "",
      isActive: body.isActive !== false,
      stockByLocation: [],
      initialLocationKey: body.initialLocationKey || "",
      initialQuantity: Number(body.initialQuantity || 0),
      minimumStock: Number(body.minimumStock || 0),
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Store items POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

