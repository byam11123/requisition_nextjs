import { createClient } from '@/lib/supabase/client';
import { Requisition } from '@/types';

export class RequisitionRepository {
  private supabase = createClient();

  async findAll(organizationId: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select('*, createdBy:users!created_by(full_name)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('requisitions')
      .select(`
        *,
        createdBy:users!created_by(full_name, email),
        approvedBy:users!approved_by(full_name),
        paidBy:users!paid_by(full_name),
        dispatchedBy:users!dispatched_by(full_name),
        attachments:attachments(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async create(data: Partial<Requisition>) {
    const { data: result, error } = await this.supabase
      .from('requisitions')
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  async update(id: string, data: Partial<Requisition>) {
    const { data: result, error } = await this.supabase
      .from('requisitions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return result;
  }

  async deleteBulk(ids: string[]) {
    const { error } = await this.supabase
      .from('requisitions')
      .delete()
      .in('id', ids);

    if (error) throw new Error(error.message);
  }
}
