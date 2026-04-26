import { WorkflowRepository } from '../repository/workflow.repository';
import { DEFAULT_REQUISITION_WORKFLOW_CONFIG } from '@/lib/config/requisition-workflow-config';

export class WorkflowService {
  private repository = new WorkflowRepository();

  async getRequisitionConfig(organizationId: string) {
    const config = await this.repository.getConfig(organizationId) as any;
    if (!config) return DEFAULT_REQUISITION_WORKFLOW_CONFIG;
    
    try {
      return typeof config.payload === 'string' ? JSON.parse(config.payload) : config.payload;
    } catch {
      return DEFAULT_REQUISITION_WORKFLOW_CONFIG;
    }
  }

  async saveRequisitionConfig(organizationId: string, config: any) {
    return await this.repository.saveConfig(organizationId, config);
  }
}
