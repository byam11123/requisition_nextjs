import { RepairRepository } from '../repository/repair.repository';

export class RepairService {
  private repository = new RepairRepository();

  private parseMeta(raw: string | null | undefined) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  async listRepairs(organizationId: string) {
    const rows = (await this.repository.getRepairs(organizationId)) as any[];
    return rows.map(row => ({
      ...row,
      meta: this.parseMeta(row.cardSubtitleInfo)
    }));
  }

  async getRepair(id: string) {
    const row = await this.repository.getRepairById(id) as any;
    return {
      ...row,
      meta: this.parseMeta(row.cardSubtitleInfo)
    };
  }

  async updateWorkflow(id: string, stage: string, data: any) {
    // Logic for updating specific workflow stages (Approval, Dispatch, Payment, Delivery)
    const updates: any = {};
    const meta = data.meta || {};

    if (stage === 'APPROVE') {
      updates.approvalStatus = 'APPROVED';
      updates.approvedAt = new Date().toISOString();
    } else if (stage === 'DISPATCH') {
      updates.dispatchStatus = 'DISPATCHED';
      updates.dispatchedAt = new Date().toISOString();
      meta.dispatchDate = new Date().toISOString();
    } else if (stage === 'DELIVER') {
      updates.dispatchStatus = 'DELIVERED';
      meta.dateOfReturn = new Date().toISOString();
    }

    if (Object.keys(meta).length > 0) {
      updates.cardSubtitleInfo = JSON.stringify(meta);
    }

    return await this.repository.updateRepair(id, updates);
  }
}
