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
      meta: this.parseMeta(row.card_subtitle_info)
    }));
  }

  async getRepair(id: string) {
    const row = await this.repository.getRepairById(id) as any;
    return {
      ...row,
      meta: this.parseMeta(row.card_subtitle_info)
    };
  }

  async updateWorkflow(id: string, stage: string, data: any) {
    // Logic for updating specific workflow stages (Approval, Dispatch, Payment, Delivery)
    const updates: any = {};
    const meta = data.meta || {};

    if (stage === 'APPROVE') {
      updates.approval_status = 'APPROVED';
      updates.approved_at = new Date().toISOString();
    } else if (stage === 'DISPATCH') {
      updates.dispatch_status = 'DISPATCHED';
      updates.dispatched_at = new Date().toISOString();
      meta.dispatchDate = new Date().toISOString();
    } else if (stage === 'DELIVER') {
      updates.dispatch_status = 'DELIVERED';
      meta.dateOfReturn = new Date().toISOString();
    }

    if (Object.keys(meta).length > 0) {
      updates.card_subtitle_info = JSON.stringify(meta);
    }

    return await this.repository.updateRepair(id, updates);
  }
}
