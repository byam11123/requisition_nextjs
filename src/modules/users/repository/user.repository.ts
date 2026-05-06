import { createClient } from '@/lib/supabase/client';

export class UserRepository {
  private supabase = createClient();

  async getUsers(organizationId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        *,
        custom_role:custom_roles(id, key, name, base_role, page_access)
      `)
      .eq('organization_id', organizationId)
      .order('fullName', { ascending: true });

    if (error) throw error;
    return data;
  }

  async createUser(userData: any) {
    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUser(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteUser(userId: string) {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  }
}
