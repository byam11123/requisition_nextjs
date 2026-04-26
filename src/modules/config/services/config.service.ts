import { ConfigRepository } from '../repository/config.repository';

export class ConfigService {
  private repository = new ConfigRepository();

  async listRoles(organizationId: string) {
    const roles = await this.repository.getCustomRoles(organizationId) as any[];
    return roles.map(r => ({
      key: r.id,
      name: r.name,
      description: r.description,
      baseRole: r.base_role,
      pageAccess: r.page_access || [],
      isSystem: r.is_system || false,
    }));
  }

  async createOrUpdateRole(organizationId: string, roleData: any) {
    return this.repository.saveRole(organizationId, {
      id: roleData.key,
      name: roleData.name,
      description: roleData.description,
      base_role: roleData.baseRole,
      page_access: roleData.pageAccess,
    });
  }

  async removeRole(id: string) {
    return this.repository.deleteRole(id);
  }
}
