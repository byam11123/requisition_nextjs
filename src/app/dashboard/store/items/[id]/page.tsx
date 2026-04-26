"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Boxes, Copy, ExternalLink, MapPinned, QrCode, ZoomIn, Loader2 } from "lucide-react";
import ImagePreviewModal from "@/components/ui/image-preview-modal";
import StatusChip from "@/components/ui/status-chip";
import { formatDate } from "@/utils/format";

export default function StoreItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("token");
        const [iRes, lRes] = await Promise.all([
          fetch(`/api/store/items/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/store/locations", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setItem(await iRes.json());
        setLocations(await lRes.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!item) return <p className="py-12 text-center text-slate-400">Item not found</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/store" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Inventory
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 overflow-hidden">
             <div className="h-72 relative bg-slate-950 flex items-center justify-center border-b border-white/5">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                ) : <Boxes size={42} className="text-slate-700" />}
             </div>
             <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">{item.itemCode}</p>
                    <h1 className="text-2xl font-bold">{item.name}</h1>
                  </div>
                  <StatusChip tone="emerald">{item.category}</StatusChip>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Brand</span>
                    <span>{item.brand || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-500">Model</span>
                    <span>{item.model || '-'}</span>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2"><QrCode size={18}/> QR Identity</h3>
              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center">
                 {/* QR Rendering logic would go here */}
                 <p className="text-slate-400 text-[10px]">QR: {item.qrValue}</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
