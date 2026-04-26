import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/modules/auth/services/auth.service';

const authService = new AuthService();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await authService.signup(data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
