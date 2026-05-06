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
    const meta = this.parseMeta(row.cardSubtitleInfo);
    const totalAdvance = row.quantity || 0;
    const totalDeducted = meta.totalDeducted || 0;
    
    return {
      id: row.id,
      requestId: row.requestId,
      employeeName: row.materialDescription, // Reused field in DB
      employeeCode: meta.employeeCode,
      designation: meta.designation,
      department: row.siteAddress, // Reused field in DB
      totalAdvanceRequest: totalAdvance,
      totalDeducted: totalDeducted,
      balanceAdvance: totalAdvance - totalDeducted,
      status: row.approvalStatus,
      entryTimestamp: row.created_at || row.createdAt,
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
