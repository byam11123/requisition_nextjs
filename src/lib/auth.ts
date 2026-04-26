import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const generateToken = (userId: string, role: string, organizationId: string) => {
  return jwt.sign({ sub: userId, role, organizationId }, JWT_SECRET, { expiresIn: '1d' });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string; role: string; organizationId: string; iat: number; exp: number };
  } catch (error) {
    return null;
  }
};

export const getUserFromRequest = (req: NextRequest) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
};
