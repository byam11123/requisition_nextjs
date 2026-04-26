"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { Loader2, MapPinned, Plus, Trash2, Warehouse } from "lucide-react";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import PageHeader from "@/app/dashboard/components/page-header";
import { formatDate } from "@/utils/format";

export default function StoreLocationsPage() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "OFFICE", address: "", contactPerson: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch("/api/store/locations", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setLocations(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      await fetch("/api/store/locations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      window.location.reload();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/5 bg-slate-900 px-4 py-3 text-sm";

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader title="Store Locations" subtitle="Manage sites, warehouses, and storage yards." />

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
        <h2 className="font-semibold mb-4">Add New Location</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Location Name" className={inputCls} />
          <input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="Code (e.g. WH1)" className={inputCls} />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={inputCls}>
             <option value="OFFICE">Office</option>
             <option value="WAREHOUSE">Warehouse</option>
             <option value="SITE">Site</option>
          </select>
          <button onClick={handleCreate} disabled={saving} className="bg-indigo-600 rounded-xl font-medium">
             {saving ? 'Creating...' : 'Add Location'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(l => (
          <div key={l.key} className="rounded-3xl border border-white/5 bg-slate-900 p-6 flex items-start gap-4">
             <div className="p-3 bg-white/5 rounded-2xl text-indigo-400">
                {l.type === 'WAREHOUSE' ? <Warehouse size={20}/> : <MapPinned size={20}/>}
             </div>
             <div>
                <h3 className="font-bold text-lg">{l.name}</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest">{l.code}</p>
                <p className="mt-2 text-sm text-slate-400">{l.address}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}

