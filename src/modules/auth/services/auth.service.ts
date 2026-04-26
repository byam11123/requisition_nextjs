import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthRepository } from '../repository/auth.repository';
import { UserRole } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export class AuthService {
  private repository = new AuthRepository();

  async signup(data: any) {
    const { organizationName, fullName, email, password, contactPhone, address } = data;

    // 1. Check if user exists
    const existingUser = await this.repository.findUserByEmail(email) as any;
    if (existingUser) {
      throw new Error('An account with this email already exists');
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Create organization
    const prefix = this.buildOrganizationPrefix(organizationName);
    const org = await this.repository.createOrganization(organizationName, prefix, email, contactPhone, address) as any;

    // 4. Create user
    const user = await this.repository.createUser({
      email,
      fullName,
      passwordHash,
      role: 'ADMIN',
      organizationId: org.id.toString(),
      designation: 'Administrator',
      department: 'Administration',
    }) as any;

    // 5. Generate token
    const orgId = user.organization_id || user.organizationId;
    const token = this.generateToken(user.id.toString(), user.role, orgId.toString());

    return { token, user };
  }

  async login(email: string, password: string) {
    const user = await this.repository.findUserByEmail(email) as any;
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const storedHash = user.password_hash || user.passwordHash || user.passwordhash;
    const isPasswordValid = await bcrypt.compare(password, storedHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const orgId = user.organization_id || user.organizationId;
    const token = this.generateToken(user.id.toString(), user.role, orgId.toString());

    return { token, user };
  }

  generateToken(userId: string, role: string, organizationId: string) {
    return jwt.sign({ sub: userId, role, organizationId }, JWT_SECRET, { expiresIn: '1d' });
  }

  private buildOrganizationPrefix(name: string) {
    const prefix = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('')
      .slice(0, 4);

    return prefix || 'REQ';
  }
}
