import { createClient } from '@/lib/supabase/client';

export class ConfigRepository {
  private supabase = createClient();

  async getCustomRoles(organizationId: string) {
    const { data, error } = await this.supabase
      .from('custom_roles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async saveRole(organizationId: string, role: any) {
    const { data, error } = await this.supabase
      .from('custom_roles')
      .upsert({ ...role, organization_id: organizationId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRole(id: string) {
    const { error } = await this.supabase
      .from('custom_roles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
