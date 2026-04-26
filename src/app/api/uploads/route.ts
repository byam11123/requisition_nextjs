import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { hydrateDemoModuleGlobals } from '@/lib/stores/demo-module-store';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

hydrateDemoModuleGlobals();

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

const CATEGORY_FIELD: Record<string, string> = {
  BILL:            'billPhotoUrl',
  MATERIAL:        'materialPhotoUrl',
  PAYMENT:         'paymentPhotoUrl',
  VENDOR_PAYMENT:  'vendorPaymentDetailsUrl',
  ATTENDANCE_GEOTAG: 'materialPhotoUrl',
  SALARY_ADVANCE_SLIP: 'materialPhotoUrl',
};

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

    // ── Supabase Storage Upload ───────────────────────────────────────────
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const ext      = file.name.split('.').pop() || 'bin';
    const filename = `${Date.now()}_${reqId}_${category.toLowerCase()}.${ext}`;
    const storagePath = `uploads/${filename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('requisition-attachments')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Upload to storage failed' }, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from('requisition-attachments')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

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

    // ── Update repair-maintenance dev store if applicable ────────────────
    const repairField = REPAIR_CATEGORY_FIELD[category];
    if (g.__devRepairStore && repairField) {
      const repairStore = g.__devRepairStore;
      const repairIdx = repairStore.findIndex(r => String(r.id) === String(reqId));
      if (repairIdx !== -1) {
        repairStore[repairIdx] = {
          ...repairStore[repairIdx],
          [repairField]: publicUrl,
          ...(field ? { [field]: publicUrl } : {}),
        };
      }
    }

    // ── Update database metadata ──────────────────────────────────────────
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
      } catch (dbError) {
        console.error('DB Metadata update error:', dbError);
      }
    }

    if (field && category !== 'REPAIR_AFTER' && category !== 'DISPATCH_ITEM') {
      try {
        await prisma.requisition.update({
          where: { id: BigInt(reqId) },
          data: { [field]: publicUrl },
        });
      } catch (dbError) {
        console.error('DB field update error:', dbError);
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: unknown) {
    console.error('Upload handler error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

