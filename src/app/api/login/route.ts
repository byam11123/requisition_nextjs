import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { generateToken } from "@/lib/auth";
import {
  findDevUserByEmail,
  updateDevUserLastLogin,
  verifyDevUserPassword,
} from "@/lib/stores/dev-auth-store";
import { getEffectiveRoleContext } from "@/lib/effective-role-context";
import { prisma } from "@/lib/prisma";
import { getUserPageAccess } from "@/lib/stores/user-page-access-store";

const DEV_USERS: Record<string, { id: string; fullName: string; role: string }> = {
  "admin@example.com": { id: "9999", fullName: "Test Admin", role: "ADMIN" },
  "manager@example.com": { id: "9998", fullName: "Test Manager", role: "MANAGER" },
  "purchaser@example.com": {
    id: "9997",
    fullName: "Test Purchaser",
    role: "PURCHASER",
  },
  "accountant@example.com": {
    id: "9996",
    fullName: "Test Accountant",
    role: "ACCOUNTANT",
  },
};

export async function POST(req: NextRequest) {
  try {
    const { email, password } = (await req.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password === "password123" && DEV_USERS[normalizedEmail]) {
      const devUser = DEV_USERS[normalizedEmail];
      const token = generateToken(devUser.id, devUser.role);
      const pageAccess = await getUserPageAccess(devUser.id);
      const roleContext = await getEffectiveRoleContext({
        userId: devUser.id,
        baseRole: devUser.role,
        organizationId: "demo",
      });
      return NextResponse.json({
        token,
        user: {
          ...devUser,
          email: normalizedEmail,
          organizationId: "1",
          pageAccess,
          baseRole: devUser.role,
          customRoleKey: roleContext?.roleKey || devUser.role,
          customRoleName: roleContext?.roleName || devUser.role,
          rolePageAccess: roleContext?.rolePageAccess || null,
        },
      });
    }

    const signedUpDevUser = findDevUserByEmail(normalizedEmail);
    if (signedUpDevUser) {
      const verifiedUser = await verifyDevUserPassword(signedUpDevUser.id, password);
      if (!verifiedUser) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      updateDevUserLastLogin(verifiedUser.id);
      const token = generateToken(verifiedUser.id, verifiedUser.role);
      const pageAccess = await getUserPageAccess(verifiedUser.id);
      const roleContext = await getEffectiveRoleContext({
        userId: verifiedUser.id,
        baseRole: verifiedUser.role,
        organizationId: verifiedUser.organizationId,
      });

      return NextResponse.json({
        token,
        user: {
          id: verifiedUser.id,
          email: verifiedUser.email,
          fullName: verifiedUser.fullName,
          role: verifiedUser.role,
          organizationId: verifiedUser.organizationId,
          department: verifiedUser.department,
          designation: verifiedUser.designation,
          pageAccess,
          baseRole: verifiedUser.role,
          customRoleKey: roleContext?.roleKey || verifiedUser.role,
          customRoleName: roleContext?.roleName || verifiedUser.role,
          rolePageAccess: roleContext?.rolePageAccess || null,
        },
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { organization: true },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (!user.isActive || !user.organization.isActive) {
        return NextResponse.json(
          { error: "Account or Organization is inactive" },
          { status: 403 },
        );
      }

      const token = generateToken(user.id.toString(), user.role);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      const pageAccess = await getUserPageAccess(user.id);
      const roleContext = await getEffectiveRoleContext({
        userId: user.id.toString(),
        baseRole: user.role,
        organizationId: user.organizationId,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId.toString(),
          department: user.department,
          designation: user.designation,
          pageAccess,
          baseRole: user.role,
          customRoleKey: roleContext?.roleKey || user.role,
          customRoleName: roleContext?.roleName || user.role,
          rolePageAccess: roleContext?.rolePageAccess || null,
        },
      });
    } catch (dbError) {
      console.warn("Login database fallback:", dbError);
      return NextResponse.json(
        {
          error:
            "Database login is unavailable and this account is not stored locally yet. Please sign up again once to create the offline admin account.",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

