import { createClient } from '@/lib/supabase/client';

export class ContactRepository {
  private supabase = createClient();

  async getContacts(organizationId: string) {
    // Current implementation uses organization-level JSON or table for contacts
    const { data, error } = await this.supabase
      .from('contacts')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true }) as any;

    if (error) throw error;
    return data;
  }

  async saveContacts(organizationId: string, contacts: any[]) {
    // Simplified: Delete and re-insert or bulk upsert
    // If it's a fixed list stored in a JSON column of organization
    const { data, error } = await this.supabase
      .from('organizations')
      .update({ contact_directory: contacts })
      .eq('id', organizationId)
      .select()
      .single() as any;

    if (error) throw error;
    return data.contact_directory;
  }
}
