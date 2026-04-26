import { 
  listStoreItems, 
  listStoreLocations, 
  getStoreItem 
} from '@/lib/stores/store-management-store';

export class StoreRepository {
  async getItems(organizationId: string) {
    return listStoreItems(organizationId);
  }

  async getLocations(organizationId: string) {
    return listStoreLocations(organizationId);
  }

  async getItemById(organizationId: string, id: string) {
    return getStoreItem(organizationId, id);
  }

  async updateStock(itemId: string, locationKey: string, quantity: number) {
    // Placeholder as before
  }
}
