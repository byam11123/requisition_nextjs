import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { findDevUserById, getDevUsersForOrganization } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { getUserPageAccessMap } from "@/lib/user-page-access-store";

const DEV_USERS = [
  {
    id: "9998",
    email: "manager@example.com",
    fullName: "Mike Manager",
    role: "MANAGER",
    designation: "Senior Manager",
    department: "Operations",
    isActive: true,
    lastLogin: null,
  },
  {
    id: "9997",
    email: "purchaser@example.com",
    fullName: "Paul Purchaser",
    role: "PURCHASER",
    designation: "Purchase Officer",
    department: "Procurement",
    isActive: true,
    lastLogin: null,
  },
  {
    id: "9996",
    email: "accountant@example.com",
    fullName: "Alice Accountant",
    role: "ACCOUNTANT",
    designation: "Finance Exec",
    department: "Finance",
    isActive: true,
    lastLogin: null,
  },
  {
    id: "9995",
    email: "inactive@example.com",
    fullName: "Jack Old",
    role: "PURCHASER",
    designation: "-",
    department: "-",
    isActive: false,
    lastLogin: null,
  },
];

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.sub) },
    });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const users = await prisma.user.findMany({
      where: { organizationId: dbUser.organizationId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        designation: true,
        isActive: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const pageAccessMap = await getUserPageAccessMap(users.map((entry) => entry.id));

    return NextResponse.json(
      users.map((entry) => ({
        ...entry,
        id: entry.id.toString(),
        pageAccess: pageAccessMap.get(entry.id.toString()) || null,
      })),
    );
  } catch (error) {
    console.error("Users GET error:", error);

    const devAdminUser = findDevUserById(user.sub);
    if (devAdminUser && devAdminUser.role === "ADMIN") {
      const orgUsers = getDevUsersForOrganization(devAdminUser.organizationId);
      const pageAccessMap = await getUserPageAccessMap(orgUsers.map((entry) => entry.id));
      return NextResponse.json(
        orgUsers.map((entry) => ({
          id: entry.id,
          email: entry.email,
          fullName: entry.fullName,
          role: entry.role,
          department: entry.department,
          designation: entry.designation,
          isActive: entry.isActive,
          lastLogin: entry.lastLogin,
          pageAccess: pageAccessMap.get(entry.id) || null,
        })),
      );
    }

    const pageAccessMap = await getUserPageAccessMap(DEV_USERS.map((entry) => entry.id));
    return NextResponse.json(
      DEV_USERS.map((entry) => ({
        ...entry,
        pageAccess: pageAccessMap.get(entry.id) || null,
      })),
    );
  }
}
