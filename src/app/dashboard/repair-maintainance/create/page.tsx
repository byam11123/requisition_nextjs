"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, AlertCircle, Loader2, Upload, X } from "lucide-react";
import FormSelect, {
  type FormSelectOption,
} from "@/components/ui/form-select";
import { type ContactDefinition } from "@/lib/stores/contact-store";

export default function CreateRepairMaintenancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    priority: "NORMAL",
    warrantyStatus: "OUT_OF_WARRANTY",
    repairRequisitionByName: "",
    siteAddress: "",
    itemDescription: "",
    quantity: "1",
    repairVendorName: "",
    expectedReturnDate: "",
    repairStatus: "NOT_REPAIRED",
  });
  const [repairBeforePhoto, setRepairBeforePhoto] = useState<File | null>(null);
  const [repairBeforePreview, setRepairBeforePreview] = useState<string | null>(null);

  const [contacts, setContacts] = useState<ContactDefinition[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const u = localStorage.getItem("user");
    if (!u) {
      return () => {
        cancelled = true;
      };
    }
    try {
      const parsed = JSON.parse(u);
      if (parsed?.fullName) {
        const timer = window.setTimeout(() => {
          if (!cancelled) {
            setForm((prev) => ({ ...prev, repairRequisitionByName: parsed.fullName }));
          }
        }, 0);

        return () => {
          cancelled = true;
          window.clearTimeout(timer);
        };
      }
    } catch {
      // ignore malformed storage value
    }

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/contacts", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load contacts");
        const data = await res.json();
        if (!cancelled) {
          setContacts(data);
          setLoadingContacts(false);
          if (data.length > 0) {
            setForm(prev => ({ ...prev, repairVendorName: data[0].name }));
          }
        }
      } catch (err) {
        console.error("Contact fetch error:", err);
        if (!cancelled) setLoadingContacts(false);
      }
    };
    fetchContacts();

    return () => {
      cancelled = true;
    };
  }, []);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const uploadFile = async (file: File, requisitionId: string, category: "MATERIAL") => {
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("requisitionId", requisitionId);
    fd.append("category", category);
    const res = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || "Photo upload failed");
    }
    const payload = await res.json();
    return payload.url as string;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.siteAddress) return setError("Site name & address is required");
    if (!form.itemDescription) return setError("Description of item is required");
    if (!form.repairVendorName) return setError("Name of repair vendor is required");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const createRes = await fetch("/api/repair-maintainance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!createRes.ok) {
        const payload = await createRes.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create repair requisition");
      }

      const created = await createRes.json();
      const reqId = String(created.id);

      if (repairBeforePhoto) await uploadFile(repairBeforePhoto, reqId, "MATERIAL");
      router.push(`/dashboard/repair-maintainance/${reqId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";
  const priorityOptions: FormSelectOption<string>[] = [
    { value: "LOW", label: "Low" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];
  const warrantyOptions: FormSelectOption<string>[] = [
    { value: "IN_WARRANTY", label: "In Warranty (No Payment Required)" },
    { value: "OUT_OF_WARRANTY", label: "Out of Warranty (Payment Required)" },
  ];
  const repairStatusOptions: FormSelectOption<string>[] = [
    { value: "NOT_REPAIRED", label: "Not Repaired" },
    { value: "REPAIRED", label: "Repaired" },
  ];

  const vendorOptions: FormSelectOption<string>[] = contacts.map(c => ({
    value: c.name,
    label: c.department ? `${c.name} (${c.department})` : c.name,
  }));
  if (vendorOptions.length === 0 && !loadingContacts) {
    vendorOptions.push({ value: "", label: "No contacts found - Go to Contact Manager" });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/repair-maintainance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
              <ArrowLeft size={16} /> Back to Repair & Maintenance
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold text-slate-100 mb-1">New Repair & Maintenance Request</h1>
        <p className="text-slate-400 text-sm mb-6">Submit initial request only. Repair return, payment, and dispatch updates happen from request detail page.</p>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Request ID</label>
              <input value="Auto Generated on Submit" disabled className={`${inputCls} opacity-70 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelCls}>Timestamp</label>
              <input value="Auto Generated on Submit" disabled className={`${inputCls} opacity-70 cursor-not-allowed`} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <FormSelect
                value={form.priority}
                options={priorityOptions}
                onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Repair Requisition By (Name)</label>
              <input
                value={form.repairRequisitionByName}
                onChange={set("repairRequisitionByName")}
                placeholder="Requester name"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Warranty Status</label>
              <FormSelect
                value={form.warrantyStatus}
                options={warrantyOptions}
                onChange={(value) => setForm((current) => ({ ...current, warrantyStatus: value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Site Name & Address *</label>
              <input value={form.siteAddress} onChange={set("siteAddress")} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Description of Item *</label>
              <input value={form.itemDescription} onChange={set("itemDescription")} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Qty</label>
              <input type="number" min="1" value={form.quantity} onChange={set("quantity")} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Name of Repair Vendor *</label>
              {loadingContacts ? (
                <div className="flex h-[46px] items-center px-4 rounded-xl border border-white/5 bg-slate-900/50 text-slate-400 text-sm">
                  <Loader2 size={16} className="animate-spin mr-2" /> Loading vendors...
                </div>
              ) : (
                <FormSelect
                  value={form.repairVendorName}
                  options={vendorOptions}
                  onChange={(value) => setForm((current) => ({ ...current, repairVendorName: value }))}
                />
              )}
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Repair Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Repair Status Before Photo</label>
                <div className="border border-dashed border-white/10 rounded-xl p-4">
                  {repairBeforePreview ? (
                    <div className="relative">
                      <img src={repairBeforePreview} alt="before" className="w-full h-32 object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={() => {
                          setRepairBeforePhoto(null);
                          setRepairBeforePreview(null);
                        }}
                        className="absolute top-1 right-1 p-1 bg-slate-800 rounded-full text-slate-400 hover:text-rose-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-slate-500 text-sm mb-2">Upload current condition photo</p>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                        <Upload size={14} /> Choose File
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setRepairBeforePhoto(file);
                            setRepairBeforePreview(file ? URL.createObjectURL(file) : null);
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className={labelCls}>Expected Return Date</label>
                <input type="date" value={form.expectedReturnDate} onChange={set("expectedReturnDate")} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Repair Status</label>
                <FormSelect
                  value={form.repairStatus}
                  options={repairStatusOptions}
                  onChange={(value) => setForm((current) => ({ ...current, repairStatus: value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Repair Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
