import { createClient } from '@/lib/supabase/client';

export class WorkflowRepository {
  private supabase = createClient();

  async getConfig(organizationId: string) {
    const { data, error } = await this.supabase
      .from('workflow_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is single row not found
    return data;
  }

  async saveConfig(organizationId: string, payload: any) {
    const { data, error } = await this.supabase
      .from('workflow_configs')
      .upsert({
        organization_id: organizationId,
        payload: JSON.stringify(payload),
        updated_at: new Date().toISOString()
      }, { onConflict: 'organization_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
