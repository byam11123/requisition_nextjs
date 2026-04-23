import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

type RequisitionDevRecord = Record<string, unknown> & {
  id: string | number;
};

type RepairDevRecord = Record<string, unknown> & {
  id: string | number;
};

type AttendanceDevRecord = {
  id: string | number;
  geoTagPhotoUrl?: string | null;
};

type UploadGlobals = typeof globalThis & {
  __devReqStore?: RequisitionDevRecord[];
  __devRepairStore?: RepairDevRecord[];
  __devAttendanceStore?: AttendanceDevRecord[];
  __devSalaryAdvanceStore?: Array<{
    id: string | number;
    initialSlipPhotoUrl?: string | null;
  }>;
};

// Maps category -> field name on the requisition record
const CATEGORY_FIELD: Record<string, string> = {
  BILL:            'billPhotoUrl',
  MATERIAL:        'materialPhotoUrl',
  PAYMENT:         'paymentPhotoUrl',
  VENDOR_PAYMENT:  'vendorPaymentDetailsUrl',
  ATTENDANCE_GEOTAG: 'materialPhotoUrl',
  SALARY_ADVANCE_SLIP: 'materialPhotoUrl',
};

// Maps category -> field name on repair-maintainance dev records
const REPAIR_CATEGORY_FIELD: Record<string, string> = {
  BILL:            'billInvoicePhoto',
  MATERIAL:        'repairStatusBeforePhoto',
  PAYMENT:         'paymentProofPhoto',
  VENDOR_PAYMENT:  'vendorPaymentDetailsUrl',
  REPAIR_AFTER:    'repairStatusAfterPhoto',
  DISPATCH_ITEM:   'dispatchItemPhoto',
};

export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file        = formData.get('file') as File | null;
    const category    = (formData.get('category') as string | null)?.toUpperCase() || 'BILL';
    const reqId       = formData.get('requisitionId') as string | null;

    if (!file || !reqId) {
      return NextResponse.json({ error: 'file and requisitionId are required' }, { status: 400 });
    }

    // ── Save file to public/uploads/ ────────────────────────────────────────
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const ext      = file.name.split('.').pop() || 'bin';
    const filename = `${Date.now()}_${reqId}_${category.toLowerCase()}.${ext}`;
    const filepath = path.join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const publicUrl = `/uploads/${filename}`;

    // ── Update requisition dev store if applicable ────────────────────────
    const g = globalThis as UploadGlobals;
    const field = CATEGORY_FIELD[category];
    if (g.__devReqStore && field) {
      const store = g.__devReqStore;
      const idx = store.findIndex(r => String(r.id) === String(reqId));
      if (idx !== -1) {
        store[idx] = { ...store[idx], [field]: publicUrl };
      }
    }

    if (g.__devAttendanceStore && category === 'ATTENDANCE_GEOTAG') {
      const attendanceStore = g.__devAttendanceStore;
      const attendanceIdx = attendanceStore.findIndex(r => String(r.id) === String(reqId));
      if (attendanceIdx !== -1) {
        attendanceStore[attendanceIdx] = {
          ...attendanceStore[attendanceIdx],
          geoTagPhotoUrl: publicUrl,
        };
      }
    }

    if (g.__devSalaryAdvanceStore && category === 'SALARY_ADVANCE_SLIP') {
      const salaryAdvanceStore = g.__devSalaryAdvanceStore;
      const salaryAdvanceIdx = salaryAdvanceStore.findIndex(r => String(r.id) === String(reqId));
      if (salaryAdvanceIdx !== -1) {
        salaryAdvanceStore[salaryAdvanceIdx] = {
          ...salaryAdvanceStore[salaryAdvanceIdx],
          initialSlipPhotoUrl: publicUrl,
        };
      }
    }

    // ── Update repair-maintainance dev store if applicable ────────────────
    const repairField = REPAIR_CATEGORY_FIELD[category];
    if (g.__devRepairStore && repairField) {
      const repairStore = g.__devRepairStore;
      const repairIdx = repairStore.findIndex(r => String(r.id) === String(reqId));
      if (repairIdx !== -1) {
        // Keep both repair-specific and shared requisition-style keys in sync.
        repairStore[repairIdx] = {
          ...repairStore[repairIdx],
          [repairField]: publicUrl,
          ...(field ? { [field]: publicUrl } : {}),
        };
      }
    }

    // ── Update repair metadata in DB for custom repair-only categories ────
    if (category === 'REPAIR_AFTER' || category === 'DISPATCH_ITEM') {
      try {
        const requisition = await prisma.requisition.findUnique({ where: { id: BigInt(reqId) } });
        if (requisition) {
          let meta: Record<string, unknown> = {};
          if (requisition.cardSubtitleInfo) {
            try { meta = JSON.parse(requisition.cardSubtitleInfo); } catch { meta = {}; }
          }
          if (category === 'REPAIR_AFTER') meta.repairStatusAfterPhotoUrl = publicUrl;
          if (category === 'DISPATCH_ITEM') meta.dispatchItemPhotoUrl = publicUrl;
          await prisma.requisition.update({
            where: { id: BigInt(reqId) },
            data: { cardSubtitleInfo: JSON.stringify(meta) },
          });
        }
      } catch {
        // Keep upload successful even if metadata update fails.
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
