"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Send, Upload, X } from "lucide-react";

export default function CreateVehicleFuelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    vehicleType: "",
    rcNo: "",
    lastPurchaseDate: new Date().toISOString().split('T')[0],
    lastIssuedQtyLitres: "0",
    lastReading: "0",
    currentReading: "0",
    currentRequirementLitres: "0",
  });

  const totalRunning = useMemo(() => 
    Math.max(0, Number(form.currentReading || 0) - Number(form.lastReading || 0)), 
  [form.currentReading, form.lastReading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/vehicle-fuel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, totalRunning }),
      });
      const data = await res.json();
      router.push(`/dashboard/vehicle-fuel/${data.id}`);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors border-indigo-500/50";
  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/vehicle-fuel" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Vehicle Daily Fuel
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <h1 className="text-2xl font-bold mb-6">New Vehicle Fuel Request</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Vehicle Type *</label>
              <input value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>RC No. *</label>
              <input value={form.rcNo} onChange={e => setForm({...form, rcNo: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Current Requirement (Litres) *</label>
              <input type="number" value={form.currentRequirementLitres} onChange={e => setForm({...form, currentRequirementLitres: e.target.value})} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Total Running (Auto)</label>
              <input value={`${totalRunning} KM/Hrs`} disabled className={`${inputCls} opacity-60`} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl font-medium ml-auto">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}





