"use client";

import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, Send, Upload, X, AlertCircle } from "lucide-react";

type FuelFormState = {
  requestedByName: string;
  fuelType: "DIESEL" | "PETROL";
  vehicleType: string;
  rcNo: string;
  lastPurchaseDate: string;
  lastIssuedQtyLitres: string;
  lastReading: string;
  currentReading: string;
  currentRequirementLitres: string;
};

export default function CreateVehicleFuelPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [readingFile, setReadingFile] = useState<File | null>(null);
  const [readingPreview, setReadingPreview] = useState<string | null>(null);
  const [logbookFile, setLogbookFile] = useState<File | null>(null);
  const [logbookPreview, setLogbookPreview] = useState<string | null>(null);

  const [form, setForm] = useState<FuelFormState>({
    requestedByName: "",
    fuelType: "DIESEL",
    vehicleType: "",
    rcNo: "",
    lastPurchaseDate: new Date().toISOString().split('T')[0],
    lastIssuedQtyLitres: "0",
    lastReading: "0",
    currentReading: "0",
    currentRequirementLitres: "0",
  });

  const [users, setUsers] = useState<any[]>([]);
  const [approverId, setApproverId] = useState("");

  useEffect(() => {
    if (user?.fullName) {
      setForm(f => ({ ...f, requestedByName: user.fullName || "" }));
    }
  }, [user]);

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const token = useAuthStore.getState().token;
        const [usersRes, defaultsRes] = await Promise.all([
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/workflow-defaults?module=VEHICLE_FUEL", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (defaultsRes.ok) {
          const defaults = await defaultsRes.json();
          if (defaults?.defaultApproverId) setApproverId(defaults.defaultApproverId);
        }
      } catch (err) {
        console.error("Failed to load defaults", err);
      }
    };
    loadDefaults();
  }, []);

  const totalRunning = useMemo(() => 
    Math.max(0, Number(form.currentReading || 0) - Number(form.lastReading || 0)), 
  [form.currentReading, form.lastReading]);

  const uploadPhoto = async (file: File, id: string, category: "FUEL_READING" | "FUEL_LOGBOOK") => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('requisitionId', id);
    const res = await fetch('/api/uploads', {
      method: 'POST',
      headers: { Authorization: `Bearer ${useAuthStore.getState().token}` },
      body: fd
    });
    if (!res.ok) throw new Error(`${category} upload failed`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readingFile) {
      setError("Reading photo is required.");
      return;
    }
    
    setLoading(true);
    setError("");
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch("/api/vehicle-fuel", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ...form, 
          totalRunning,
          approverId: approverId || null
        }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create request");
      }
      
      const data = await res.json();
      
      // Upload photos (Logbook is optional)
      await uploadPhoto(readingFile, data.id, "FUEL_READING");
      if (logbookFile) {
        await uploadPhoto(logbookFile, data.id, "FUEL_LOGBOOK");
      }
      
      router.push(`/dashboard/vehicle-fuel/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50";
  const labelCls = "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/vehicle-fuel" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Register
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100">New Vehicle Fuel Request</h1>
          <p className="text-sm text-slate-500 mt-2">Log daily fuel consumption and vehicle usage metrics.</p>
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Vehicle & Requester */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_var(--app-accent)]" />
              General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Requested By *</label>
                <input value={form.requestedByName} onChange={e => setForm({...form, requestedByName: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Fuel Type *</label>
                <select value={form.fuelType} onChange={e => setForm({...form, fuelType: e.target.value as any})} className={inputCls}>
                  <option value="DIESEL">Diesel</option>
                  <option value="PETROL">Petrol</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Vehicle Type *</label>
                <input placeholder="E.g. Tipper, JCB, Car" value={form.vehicleType} onChange={e => setForm({...form, vehicleType: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>RC No. *</label>
                <input placeholder="E.g. KA-01-AB-1234" value={form.rcNo} onChange={e => setForm({...form, rcNo: e.target.value})} className={inputCls} required />
              </div>
            </div>
          </div>

          {/* Section 2: Fuel Details */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_var(--app-accent)]" />
              Fuel & Meter Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Requirement (Litres) *</label>
                <input type="number" value={form.currentRequirementLitres} onChange={e => setForm({...form, currentRequirementLitres: e.target.value})} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Last Purchase Date</label>
                <input type="date" value={form.lastPurchaseDate} onChange={e => setForm({...form, lastPurchaseDate: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Issued Qty (L)</label>
                <input type="number" value={form.lastIssuedQtyLitres} onChange={e => setForm({...form, lastIssuedQtyLitres: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Last Meter Reading</label>
                <input type="number" value={form.lastReading} onChange={e => setForm({...form, lastReading: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Current Meter Reading</label>
                <input type="number" value={form.currentReading} onChange={e => setForm({...form, currentReading: e.target.value})} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Total Running (Auto)</label>
                <div className={`${inputCls} bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold flex items-center`}>
                  {totalRunning} KM/Hrs
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Evidence (Photos) */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_var(--app-accent)]" />
              Required Evidence Photos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelCls}>Last Meter Reading Photo *</label>
                <div className="relative group rounded-2xl border-2 border-dashed border-white/10 p-2 transition-colors hover:border-indigo-500/30">
                  {readingPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                      <Image src={readingPreview} alt="Reading" fill className="object-cover" />
                      <button type="button" onClick={() => {setReadingFile(null); setReadingPreview(null);}} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3 text-indigo-400 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm text-slate-400 font-medium">Click to upload Odometer</span>
                      <span className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">PNG, JPG, HEIC up to 10MB</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { setReadingFile(f); setReadingPreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Logbook Entry Photo (Optional)</label>
                <div className="relative group rounded-2xl border-2 border-dashed border-white/10 p-2 transition-colors hover:border-indigo-500/30">
                  {logbookPreview ? (
                    <div className="relative aspect-video rounded-xl overflow-hidden shadow-lg">
                      <Image src={logbookPreview} alt="Logbook" fill className="object-cover" />
                      <button type="button" onClick={() => {setLogbookFile(null); setLogbookPreview(null);}} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-rose-600 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center py-8 cursor-pointer">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 text-emerald-400 group-hover:scale-110 transition-transform">
                        <Upload size={20} />
                      </div>
                      <span className="text-sm text-slate-400 font-medium">Click to upload Logbook</span>
                      <span className="text-[10px] text-slate-600 mt-1 uppercase tracking-wider">Ensure entries are clear</span>
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0];
                        if (f) { setLogbookFile(f); setLogbookPreview(URL.createObjectURL(f)); }
                      }} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Workflow Assignment */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h3 className="text-sm font-semibold text-indigo-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_var(--app-accent)]" />
              Workflow Assignment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-1 max-w-sm">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <label className={labelCls}>Assigned Approver *</label>
                <select value={approverId} onChange={e => setApproverId(e.target.value)} className={inputCls} required>
                  <option value="">Select Approver</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                </select>
                <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wider">Approval Step</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              Direct Submission enabled
            </p>
            <button type="submit" disabled={loading} className="flex items-center gap-3 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-xl shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} 
              {loading ? "Processing..." : "Submit Fuel Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





