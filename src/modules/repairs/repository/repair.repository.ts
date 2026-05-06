import { createClient } from '@/lib/supabase/client';

export class RepairRepository {
  private supabase = createClient();
  private MODULE_KEY = 'REPAIR_MAINTENANCE';

  async getRepairs(organizationId: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select(`
        *,
        createdBy:users!created_by(id, fullName)
      `)
      .eq('organization_id', organizationId)
      .eq('requiredFor', this.MODULE_KEY)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getRepairById(id: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select(`
        *,
        createdBy:users!created_by(id, fullName),
        approvedBy:users!approved_by(id, fullName),
        paidBy:users!paid_by(id, fullName),
        dispatchedBy:users!dispatched_by(id, fullName)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async saveRepair(repairData: any) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .insert({
        ...repairData,
        requiredFor: this.MODULE_KEY
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRepair(id: string, updates: any) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
