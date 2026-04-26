import { DesignationRepository } from '../repository/designation.repository';

export class DesignationService {
  private repository = new DesignationRepository();

  async listDesignations(organizationId: string) {
    const data = await this.repository.getDesignations(organizationId) as any[];
    return data.map(d => ({
      key: d.id,
      name: d.name,
      description: d.description,
      department: d.department,
      defaultCustomRoleKey: d.default_role_id,
      isSystem: d.is_system || false
    }));
  }

  async createOrUpdateDesignation(organizationId: string, data: any) {
    return this.repository.saveDesignation(organizationId, {
      id: data.key,
      name: data.name,
      description: data.description,
      department: data.department,
      default_role_id: data.defaultCustomRoleKey
    });
  }

  async removeDesignation(id: string) {
    return this.repository.deleteDesignation(id);
  }
}
