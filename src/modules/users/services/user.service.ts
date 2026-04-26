import { UserRepository } from '../repository/user.repository';

export class UserService {
  private repository = new UserRepository();

  async listUsers(organizationId: string) {
    return await this.repository.getUsers(organizationId);
  }

  async createUser(userData: any) {
    // Business logic: Hash password, initial setup, etc.
    // Assuming backend API handles password hashing, this is just a proxy for now
    return await this.repository.createUser(userData);
  }

  async activateUser(userId: string) {
    return await this.repository.updateUser(userId, { is_active: true });
  }

  async deactivateUser(userId: string) {
    return await this.repository.updateUser(userId, { is_active: false });
  }

  async updateCustomRole(userId: string, roleKey: string) {
    return await this.repository.updateUser(userId, { custom_role_key: roleKey });
  }
}
