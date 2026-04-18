import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Maps category -> field name on the requisition record
const CATEGORY_FIELD: Record<string, string> = {
  BILL:            'billPhotoUrl',
  MATERIAL:        'materialPhotoUrl',
  PAYMENT:         'paymentPhotoUrl',
  VENDOR_PAYMENT:  'vendorPaymentDetailsUrl',
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

    // ── Update dev store if applicable ─────────────────────────────────────
    const g = globalThis as any;
    const field = CATEGORY_FIELD[category];
    if (g.__devReqStore && field) {
      const store: any[] = g.__devReqStore;
      const idx = store.findIndex(r => String(r.id) === String(reqId));
      if (idx !== -1) {
        store[idx] = { ...store[idx], [field]: publicUrl };
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
