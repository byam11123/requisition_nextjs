import { createClient } from '@/lib/supabase/client';

export class DesignationRepository {
  private supabase = createClient();

  async getDesignations(organizationId: string) {
    const { data, error } = await this.supabase
      .from('designations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (error) throw error;
    return data;
  }

  async saveDesignation(organizationId: string, designation: any) {
    const { data, error } = await this.supabase
      .from('designations')
      .upsert({ ...designation, organization_id: organizationId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteDesignation(id: string) {
    const { error } = await this.supabase
      .from('designations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
