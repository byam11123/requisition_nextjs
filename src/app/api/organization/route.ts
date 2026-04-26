import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const orgId = user.organizationId;

    if (orgId === "demo") {
      return NextResponse.json({
        name: "Demo Organization",
        requisitionPrefix: "DEMO",
        contactEmail: "admin@demo.com",
        contactPhone: "+1234567890",
        address: "123 Demo St, Virtual City",
      });
    }

    const org = await prisma.organization.findUnique({
      where: { id: BigInt(orgId) },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: org.name,
      requisitionPrefix: org.requisitionPrefix,
      contactEmail: org.contactEmail,
      contactPhone: org.contactPhone,
      address: org.address,
    });
  } catch (error) {
    console.error("Organization GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  try {
    const orgId = user.organizationId;
    if (orgId === "demo") {
      return NextResponse.json({ message: "Update successful (Demo)" });
    }

    await prisma.organization.update({
      where: { id: BigInt(orgId) },
      data: {
        name: body.name,
        requisitionPrefix: body.requisitionPrefix,
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone,
        address: body.address,
      },
    });

    return NextResponse.json({ message: "Update successful" });
  } catch (error) {
    console.error("Organization PUT error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
