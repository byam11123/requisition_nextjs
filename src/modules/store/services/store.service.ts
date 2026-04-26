import { StoreRepository } from '../repository/store.repository';

export class StoreService {
  private repository = new StoreRepository();

  async getItem(organizationId: string, id: string) {
    return this.repository.getItemById(organizationId, id);
  }

  async listLocations(organizationId: string) {
    return this.repository.getLocations(organizationId);
  }

  async getInventorySummary(organizationId: string) {
    const items = await this.repository.getItems(organizationId);
    const locations = await this.repository.getLocations(organizationId);

    const stats = {
      totalItems: items.length,
      totalLocations: locations.length,
      lowStock: items.filter(i => this.isLowStock(i)).length,
      qrReady: items.filter(i => !!i.qrValue).length,
    };

    return { items, locations, stats };
  }

  isLowStock(item: any) {
    if (!Array.isArray(item.stockByLocation)) return false;
    return item.stockByLocation.some((entry: any) => entry.quantity <= (entry.minimumStock || 0));
  }

  getTotalQuantity(item: any) {
    if (!Array.isArray(item.stockByLocation)) return 0;
    return item.stockByLocation.reduce((acc: number, entry: any) => acc + (entry.quantity || 0), 0);
  }

  getItemStatus(item: any) {
    const total = this.getTotalQuantity(item);
    if (total === 0) return 'OUT_OF_STOCK';
    if (this.isLowStock(item)) return 'LOW_STOCK';
    return 'IN_STOCK';
  }
}
