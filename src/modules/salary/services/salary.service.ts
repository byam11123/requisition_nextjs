import { SalaryRepository } from '../repository/salary.repository';

export class SalaryService {
  private repository = new SalaryRepository();

  async listAdvances(organizationId: string) {
    const rows = (await this.repository.getSalaryAdvances(organizationId)) as any[];
    return rows.map(row => this.mapRowToSalaryRecord(row));
  }
  async getRecord(id: string) {
    const row = await this.repository.getSalaryAdvanceById(id) as any;
    return this.mapRowToSalaryRecord(row);
  }

  private mapRowToSalaryRecord(row: any) {
    const meta = this.parseMeta(row.card_subtitle_info);
    const totalAdvance = row.quantity || 0;
    const totalDeducted = meta.totalDeducted || 0;
    
    return {
      id: row.id,
      requestId: row.request_id,
      employeeName: row.item_description, // Reused
      employeeCode: meta.employeeCode,
      designation: meta.designation,
      department: row.site_address, // Reused
      totalAdvanceRequest: totalAdvance,
      totalDeducted: totalDeducted,
      balanceAdvance: totalAdvance - totalDeducted,
      status: row.approval_status,
      entryTimestamp: row.created_at,
    };
  }

  private parseMeta(raw: string | null | undefined) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
