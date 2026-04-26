import { FuelRepository } from '../repository/fuel.repository';

export class FuelService {
  private repository = new FuelRepository();

  async listFuelRequests(organizationId: string) {
    const rows = (await this.repository.getFuelRecords(organizationId)) as any[];
    return rows.map(row => this.mapRowToFuelRecord(row));
  }
  async getRecord(id: string) {
    const row = await this.repository.getFuelById(id) as any;
    return this.mapRowToFuelRecord(row);
  }

  private mapRowToFuelRecord(row: any) {
    const meta = this.parseMeta(row.card_subtitle_info);
    return {
      id: row.id,
      requestId: row.request_id,
      vehicleType: row.site_address, // Reused field
      rcNo: row.po_details, // Reused field
      fuelType: meta.fuelType || 'DIESEL',
      lastPurchaseDate: meta.lastPurchaseDate,
      lastIssuedQtyLitres: meta.lastIssuedQtyLitres,
      lastReading: meta.lastReading,
      currentReading: meta.currentReading,
      totalRunning: meta.totalRunning,
      currentRequirementLitres: row.quantity,
      status: row.approval_status,
      entryTimestamp: row.created_at,
      billPhotoUrl: row.bill_photo_url,
    };
  }

  private parseMeta(raw: string | null | undefined) {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}
