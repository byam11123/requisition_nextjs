import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { generateToken } from "@/lib/auth";
import { createDevSignupAccount, findDevUserByEmail } from "@/lib/stores/dev-auth-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { prisma } from "@/lib/prisma";

function buildOrganizationPrefix(name: string) {
  const prefix = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 4);

  return prefix || "REQ";
}

export async function POST(req: NextRequest) {
  try {
    const {
      organizationName,
      fullName,
      email,
      password,
      contactPhone,
      address,
    } = (await req.json()) as {
      organizationName?: string;
      fullName?: string;
      email?: string;
      password?: string;
      contactPhone?: string;
      address?: string;
    };

    const normalizedOrganizationName = organizationName?.trim() || "";
    const normalizedFullName = fullName?.trim() || "";
    const normalizedEmail = email?.trim().toLowerCase() || "";

    if (!normalizedOrganizationName || !normalizedFullName || !normalizedEmail || !password) {
      return NextResponse.json(
        { error: "Organization name, full name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 },
      );
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const createdOrganization = await prisma.organization.create({
        data: {
          name: normalizedOrganizationName,
          requisitionPrefix: buildOrganizationPrefix(normalizedOrganizationName),
          contactEmail: normalizedEmail,
          contactPhone: contactPhone?.trim() || null,
          address: address?.trim() || null,
          users: {
            create: {
              email: normalizedEmail,
              fullName: normalizedFullName,
              passwordHash,
              role: "ADMIN",
              designation: "Administrator",
              department: "Administration",
              isActive: true,
              lastLogin: new Date(),
            },
          },
        },
        include: {
          users: true,
        },
      });

      const adminUser = createdOrganization.users[0];
      const token = generateToken(adminUser.id.toString(), adminUser.role);
      const roleContext = await getEffectiveRoleContext({
        userId: adminUser.id.toString(),
        baseRole: adminUser.role,
        organizationId: createdOrganization.id,
      });

      return NextResponse.json({
        token,
        user: {
          id: adminUser.id.toString(),
          email: adminUser.email,
          fullName: adminUser.fullName,
          role: adminUser.role,
          organizationId: createdOrganization.id.toString(),
          department: adminUser.department,
          designation: adminUser.designation,
          pageAccess: null,
          baseRole: adminUser.role,
          customRoleKey: roleContext?.roleKey || adminUser.role,
          customRoleName: roleContext?.roleName || adminUser.role,
          rolePageAccess: roleContext?.rolePageAccess || null,
        },
      });
    } catch (dbError) {
      console.error("Signup database fallback:", dbError);

      if (findDevUserByEmail(normalizedEmail)) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 },
        );
      }

      const created = await createDevSignupAccount({
        organizationName: normalizedOrganizationName,
        fullName: normalizedFullName,
        email: normalizedEmail,
        password,
        contactPhone,
        address,
      });

      const token = generateToken(created.user.id, created.user.role);
      const roleContext = await getEffectiveRoleContext({
        userId: created.user.id,
        baseRole: created.user.role,
        organizationId: created.organization.id,
      });

      return NextResponse.json({
        token,
        user: {
          id: created.user.id,
          email: created.user.email,
          fullName: created.user.fullName,
          role: created.user.role,
          organizationId: created.organization.id,
          department: created.user.department,
          designation: created.user.designation,
          pageAccess: null,
          baseRole: created.user.role,
          customRoleKey: roleContext?.roleKey || created.user.role,
          customRoleName: roleContext?.roleName || created.user.role,
          rolePageAccess: roleContext?.rolePageAccess || null,
        },
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

