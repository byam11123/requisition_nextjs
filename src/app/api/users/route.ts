import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { getUserFromRequest } from "@/lib/auth";
import { getCustomRolesForOrganization } from "@/lib/custom-role-store";
import { findDesignationForOrganization } from "@/lib/designation-store";
import { createDevOrganizationUser, findDevUserById, getDevUsersForOrganization } from "@/lib/dev-auth-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { prisma } from "@/lib/prisma";
import { saveUserCustomRoleKey } from "@/lib/user-custom-role-store";
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
        organizationId: true,
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
    const effectiveRoles = await Promise.all(
      users.map((entry) =>
        getEffectiveRoleContext({
          userId: entry.id.toString(),
          baseRole: entry.role,
          organizationId: entry.organizationId,
        }),
      ),
    );

    return NextResponse.json(
      users.map((entry, index) => ({
        ...entry,
        id: entry.id.toString(),
        pageAccess: pageAccessMap.get(entry.id.toString()) || null,
        baseRole: entry.role,
        customRoleKey: effectiveRoles[index]?.roleKey || entry.role,
        customRoleName: effectiveRoles[index]?.roleName || entry.role,
        rolePageAccess: effectiveRoles[index]?.rolePageAccess || null,
      })),
    );
  } catch (error) {
    console.error("Users GET error:", error);

    const devAdminUser = findDevUserById(user.sub);
    if (devAdminUser && devAdminUser.role === "ADMIN") {
      const orgUsers = getDevUsersForOrganization(devAdminUser.organizationId);
      const pageAccessMap = await getUserPageAccessMap(orgUsers.map((entry) => entry.id));
      const effectiveRoles = await Promise.all(
        orgUsers.map((entry) =>
          getEffectiveRoleContext({
            userId: entry.id,
            baseRole: entry.role,
            organizationId: entry.organizationId,
          }),
        ),
      );
      return NextResponse.json(
        orgUsers.map((entry, index) => ({
          id: entry.id,
          email: entry.email,
          fullName: entry.fullName,
          role: entry.role,
          department: entry.department,
          designation: entry.designation,
          isActive: entry.isActive,
          lastLogin: entry.lastLogin,
          pageAccess: pageAccessMap.get(entry.id) || null,
          baseRole: entry.role,
          customRoleKey: effectiveRoles[index]?.roleKey || entry.role,
          customRoleName: effectiveRoles[index]?.roleName || entry.role,
          rolePageAccess: effectiveRoles[index]?.rolePageAccess || null,
        })),
      );
    }

    if (user.sub === "9999") {
      const demoOrgUsers = getDevUsersForOrganization("demo");
      const mergedUsers = [
        ...DEV_USERS,
        ...demoOrgUsers
          .filter((entry) => !DEV_USERS.some((demoUser) => demoUser.email === entry.email))
          .map((entry) => ({
            id: entry.id,
            email: entry.email,
            fullName: entry.fullName,
            role: entry.role,
            designation: entry.designation,
            department: entry.department,
            isActive: entry.isActive,
            lastLogin: entry.lastLogin,
          })),
      ];
      const pageAccessMap = await getUserPageAccessMap(mergedUsers.map((entry) => entry.id));
      const effectiveRoles = await Promise.all(
        mergedUsers.map((entry) =>
          getEffectiveRoleContext({
            userId: entry.id,
            baseRole: entry.role,
            organizationId: "demo",
          }),
        ),
      );
      return NextResponse.json(
        mergedUsers.map((entry, index) => ({
          ...entry,
          pageAccess: pageAccessMap.get(entry.id) || null,
          baseRole: entry.role,
          customRoleKey: effectiveRoles[index]?.roleKey || entry.role,
          customRoleName: effectiveRoles[index]?.roleName || entry.role,
          rolePageAccess: effectiveRoles[index]?.rolePageAccess || null,
        })),
      );
    }

    const pageAccessMap = await getUserPageAccessMap(DEV_USERS.map((entry) => entry.id));
    const effectiveRoles = await Promise.all(
      DEV_USERS.map((entry) =>
        getEffectiveRoleContext({
          userId: entry.id,
          baseRole: entry.role,
          organizationId: "demo",
        }),
      ),
    );
    return NextResponse.json(
      DEV_USERS.map((entry, index) => ({
        ...entry,
        pageAccess: pageAccessMap.get(entry.id) || null,
        baseRole: entry.role,
        customRoleKey: effectiveRoles[index]?.roleKey || entry.role,
        customRoleName: effectiveRoles[index]?.roleName || entry.role,
        rolePageAccess: effectiveRoles[index]?.rolePageAccess || null,
      })),
    );
  }
}

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleContext = await getEffectiveRoleContext({ userId: user.sub, baseRole: user.role });
  if (!roleContext) {
    return NextResponse.json({ error: "Role context unavailable" }, { status: 404 });
  }

  const body = (await req.json()) as {
    fullName?: string;
    email?: string;
    password?: string;
    designationKey?: string;
    designation?: string;
    department?: string;
    customRoleKey?: string;
  };

  if (!body.fullName?.trim() || !body.email?.trim() || !body.password) {
    return NextResponse.json({ error: "Full name, email, password, and role are required" }, { status: 400 });
  }

  const selectedDesignation = body.designationKey
    ? await findDesignationForOrganization(roleContext.organizationId, body.designationKey)
    : null;
  if (body.designationKey && !selectedDesignation) {
    return NextResponse.json({ error: "Selected designation not found" }, { status: 404 });
  }

  const roles = await getCustomRolesForOrganization(roleContext.organizationId);
  const resolvedRoleKey =
    body.customRoleKey?.trim().toUpperCase() || selectedDesignation?.defaultCustomRoleKey || "";
  if (!resolvedRoleKey) {
    return NextResponse.json({ error: "A custom role is required or must be mapped from the designation" }, { status: 400 });
  }

  const selectedRole = roles.find((entry) => entry.key === resolvedRoleKey);
  if (!selectedRole) {
    return NextResponse.json({ error: "Selected role not found" }, { status: 404 });
  }

  const normalizedEmail = body.email.trim().toLowerCase();
  const finalDesignation = selectedDesignation?.name || body.designation?.trim() || null;
  const finalDepartment =
    body.department?.trim() || selectedDesignation?.department || null;

  if (typeof roleContext.organizationId === "string") {
    const createdUser = await createDevOrganizationUser({
      organizationId: roleContext.organizationId,
      email: normalizedEmail,
      fullName: body.fullName,
      password: body.password,
      role: selectedRole.baseRole,
      designation: finalDesignation,
      department: finalDepartment,
    });

    await saveUserCustomRoleKey(createdUser.id, selectedRole.key);

    return NextResponse.json({
      id: createdUser.id,
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role,
      baseRole: createdUser.role,
      customRoleKey: selectedRole.key,
      customRoleName: selectedRole.name,
      rolePageAccess: selectedRole.pageAccess,
      designation: createdUser.designation,
      department: createdUser.department,
      isActive: createdUser.isActive,
      lastLogin: createdUser.lastLogin,
      pageAccess: null,
    });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const createdUser = await prisma.user.create({
      data: {
        organizationId: roleContext.organizationId,
        email: normalizedEmail,
        fullName: body.fullName.trim(),
        passwordHash,
        role: selectedRole.baseRole,
        designation: finalDesignation,
        department: finalDepartment,
        isActive: true,
      },
    });

    await saveUserCustomRoleKey(createdUser.id, selectedRole.key);

    return NextResponse.json({
      id: createdUser.id.toString(),
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role,
      baseRole: createdUser.role,
      customRoleKey: selectedRole.key,
      customRoleName: selectedRole.name,
      rolePageAccess: selectedRole.pageAccess,
      designation: createdUser.designation,
      department: createdUser.department,
      isActive: createdUser.isActive,
      lastLogin: createdUser.lastLogin,
      pageAccess: null,
    });
  } catch (error) {
    console.error("Users POST error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
