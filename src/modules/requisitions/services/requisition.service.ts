import { RequisitionRepository } from '../repository/requisition.repository';
import { Requisition } from '@/types';

export class RequisitionService {
  private repository = new RequisitionRepository();

  async getOrganizationRequisitions(organizationId: string) {
    return this.repository.findAll(organizationId);
  }

  async getRequisitionDetails(id: string) {
    return this.repository.findById(id);
  }

  async createRequisition(data: any, userId: string, organizationId: string) {
    // Basic validation could go here
    return this.repository.create({
      ...data,
      createdById: userId,
      organizationId,
      status: 'SUBMITTED',
      approvalStatus: 'PENDING',
    });
  }

  async updateRequisition(id: string, data: any) {
    return this.repository.update(id, data);
  }

  async deleteRequisitions(ids: string[]) {
    return this.repository.deleteBulk(ids);
  }

  calculateStats(requisitions: any[]) {
    return {
      pending: requisitions.filter(r => (r.approvalStatus || r.approval_status) === 'PENDING').length,
      approved: requisitions.filter(r => (r.approvalStatus || r.approval_status) === 'APPROVED').length,
      toPay: requisitions.filter(r => (r.approvalStatus || r.approval_status) === 'APPROVED' && (r.paymentStatus || r.payment_status) !== 'DONE').length,
      total: requisitions.length,
    };
  }
}
