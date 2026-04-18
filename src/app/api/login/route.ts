import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // ── Dev bypass users (no database required) ──────────────────────────
    const DEV_USERS: Record<string, { id: string; fullName: string; role: string }> = {
      'admin@example.com':      { id: '9999', fullName: 'Test Admin',      role: 'ADMIN' },
      'manager@example.com':    { id: '9998', fullName: 'Test Manager',    role: 'MANAGER' },
      'purchaser@example.com':  { id: '9997', fullName: 'Test Purchaser',  role: 'PURCHASER' },
      'accountant@example.com': { id: '9996', fullName: 'Test Accountant', role: 'ACCOUNTANT' },
    };
    if (password === 'password123' && DEV_USERS[email]) {
      const u = DEV_USERS[email];
      const token = generateToken(u.id, u.role);
      return NextResponse.json({ token, user: { ...u, email, organizationId: '1' } });
    }
    // ─────────────────────────────────────────────────────────────────────

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Notice: if passwordHash isn't set, might be via SSO / not yet supported
    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive || !user.organization.isActive) {
      return NextResponse.json({ error: 'Account or Organization is inactive' }, { status: 403 });
    }

    const token = generateToken(user.id.toString(), user.role);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
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
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
