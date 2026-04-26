"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, PackagePlus, Upload, X } from "lucide-react";

export default function CreateStoreItemPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    category: "",
    itemType: "ASSET",
    unit: "Nos",
    initialLocationKey: "",
    initialQuantity: "0",
    minimumStock: "0",
  });

  useEffect(() => {
    const load = async () => {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/store/locations", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setLocations(data);
      if (data[0]) setForm(f => ({ ...f, initialLocationKey: data[0].key }));
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/store/items", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      router.push(`/dashboard/store/items/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors border-indigo-500/50";
  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/store" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Store Management
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <h1 className="text-2xl font-bold mb-6">New Store Item</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Item Name *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Initial Location</label>
              <select value={form.initialLocationKey} onChange={e => setForm({...form, initialLocationKey: e.target.value})} className={inputCls}>
                 {locations.map(l => <option key={l.key} value={l.key}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Initial Quantity</label>
              <input type="number" value={form.initialQuantity} onChange={e => setForm({...form, initialQuantity: e.target.value})} className={inputCls} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl font-medium ml-auto">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <PackagePlus size={16} />} Create Item
          </button>
        </form>
      </div>
    </div>
  );
}





