import { AttendanceRepository } from '../repository/attendance.repository';

export class AttendanceService {
  private repository = new AttendanceRepository();

  async listAttendance(organizationId: string) {
    const rows = (await this.repository.getAttendanceRecords(organizationId)) as any[];
    return rows.map(row => this.mapRowToAttendanceRecord(row));
  }
  async getRecord(id: string) {
    const row = await this.repository.getAttendanceById(id) as any;
    return this.mapRowToAttendanceRecord(row);
  }

  async updateStatus(id: string, status: string, approverName: string) {
    // Logic for database update via repository
  }

  private mapRowToAttendanceRecord(row: any) {
    const meta = this.parseMeta(row.card_subtitle_info);
    return {
      id: row.id,
      requestId: row.request_id,
      status: row.approval_status,
      timestamp: row.created_at,
      driverName: row.item_description, // Reused
      fromSiteName: row.site_address, // Reused
      toSiteName: meta.toSiteName,
      vehicleType: meta.vehicleType,
      vehicleName: meta.vehicleName,
      vehicleNumber: row.po_details, // Reused
      adminName: meta.adminName,
      fatherName: meta.fatherName,
      geoTagPhotoUrl: row.bill_photo_url,
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
