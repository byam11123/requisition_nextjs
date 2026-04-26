import { createClient } from '@/lib/supabase/client';
import { User, UserRole } from '@/types';

export class AuthRepository {
  private supabase = createClient();

  async findUserByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*, organization:organizations(*)')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message);
    }

    return data;
  }

  async createOrganization(name: string, prefix: string, email: string, phone?: string, address?: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .insert({
        name,
        requisition_prefix: prefix,
        contact_email: email,
        contact_phone: phone,
        address,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async createUser(userData: {
    email: string;
    fullName: string;
    passwordHash: string;
    supabaseUid?: string;
    role: UserRole;
    organizationId: string;
    designation?: string;
    department?: string;
  }) {
    const { data, error } = await this.supabase
      .from('users')
      .insert({
        email: userData.email,
        fullName: userData.fullName,
        passwordHash: userData.passwordHash,
        supabase_uid: userData.supabaseUid,
        role: userData.role,
        organization_id: userData.organizationId,
        designation: userData.designation,
        department: userData.department,
        isActive: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
}
