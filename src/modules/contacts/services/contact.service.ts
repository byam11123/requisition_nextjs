import { ContactRepository } from '../repository/contact.repository';

export class ContactService {
  private repository = new ContactRepository();

  async listContacts(organizationId: string) {
    const data = await this.repository.getContacts(organizationId);
    return data; // Assumes it returns clean directory objects
  }

  async updateDirectory(organizationId: string, updatedList: any[]) {
    return this.repository.saveContacts(organizationId, updatedList);
  }
}
