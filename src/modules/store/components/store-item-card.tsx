import Link from 'next/link';
import Image from 'next/image';
import { Boxes, ArrowRight } from 'lucide-react';

export function StoreItemCard({ item }: { item: any }) {
  return (
    <Link href={`/dashboard/store/items/${item.id}`} className="group overflow-hidden rounded-3xl border border-white/5 bg-slate-900/50 hover:bg-white/[0.03] transition-all">
      <div className="relative h-48 overflow-hidden bg-slate-800">
        {item.imageUrl ? (
          <Image src={item.imageUrl} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-600"><Boxes size={34} /></div>
        )}
      </div>
      <div className="p-5 space-y-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.itemCode}</p>
          <h3 className="text-lg font-semibold text-slate-100 truncate">{item.name}</h3>
          <p className="text-sm text-slate-400">{item.category}</p>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">Stock Status</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">In Stock</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <span className="text-xs text-slate-500">View Details</span>
          <ArrowRight size={14} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
