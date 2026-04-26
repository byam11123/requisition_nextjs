import { createClient } from '@/lib/supabase/client';

export class FuelRepository {
  private supabase = createClient();
  private MODULE_KEY = 'VEHICLE_FUEL';

  async getFuelRecords(organizationId: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('required_for', this.MODULE_KEY)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getFuelById(id: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }
}
