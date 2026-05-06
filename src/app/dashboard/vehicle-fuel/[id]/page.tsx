"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, ReceiptText, Upload, AlertCircle } from "lucide-react";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { toast } from "sonner";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusTimeline, { type TimelineEvent } from "@/modules/common/components/status-timeline";
import StatusChip from "@/components/ui/status-chip";
import { formatDate } from "@/utils/format";
import { canPerformStep } from "@/lib/workflow-assignee-guard";

export default function VehicleFuelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const { token } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/vehicle-fuel/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load record");
        setRecord(await res.json());
      } catch (err) {
        setRecord({ error: true });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, token]);

  const handleAction = async (approvalStatus: string) => {
    setActionLoading(approvalStatus);
    try {
      const token = useAuthStore.getState().token;
      await fetch(`/api/vehicle-fuel/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      setRecord((r:any) => ({ ...r, approvalStatus: approvalStatus, status: approvalStatus }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpload = async (file: File, category: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('requisitionId', id);
    setActionLoading('uploading');
    try {
      const res = await fetch('/api/uploads', { 
        method: "POST", 
        body: fd, 
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } 
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setRecord((r: any) => ({ 
        ...r, 
        [category === 'FUEL_BILL' ? 'billPhotoUrl' : category === 'FUEL_LOGBOOK' ? 'logbookPhotoUrl' : 'lastReadingPhotoUrl']: data.url,
        ...(category === 'FUEL_BILL' ? { 
          billUploadedAt: new Date().toISOString(),
          billUploadedByName: useAuthStore.getState().user?.fullName || 'You'
        } : {})
      }));
    } finally {
      setActionLoading(null);
    }
  };

  const [billForm, setBillForm] = useState({ pump: '', amount: '' });
  
  useEffect(() => {
    if (record?.billAmount || record?.fuelPumpName) {
      setBillForm({ 
        pump: record.fuelPumpName || '', 
        amount: String(record.billAmount || '') 
      });
    }
  }, [record]);

  const handleSaveBill = async () => {
    setActionLoading('saving_bill');
    setShowConfirm(false);
    try {
      const res = await fetch(`/api/vehicle-fuel/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fuelPumpName: billForm.pump,
          billAmount: Number(billForm.amount)
        })
      });
      if (!res.ok) throw new Error("Failed to save bill details");
      const updated = await res.json();
      setRecord(updated);
      toast.success("Billing Data Saved Successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isBillSaved = !!(record?.billAmount && record?.billAmount > 0);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) return [];
    return [
      { key: "created", title: "Fuel Request Created", description: `Requested by ${record.requestedByName} for ${record.vehicleType}.`, timestamp: record.entryTimestamp, state: "done" },
      { key: "approval", title: `Approval: ${record.approvalStatus}`, description: record.approvedByName ? `Reviewed by ${record.approvedByName}` : `Awaiting review`, timestamp: record.approvedAt, state: record.approvalStatus === 'PENDING' ? 'current' : 'done' },
      { key: "billing", title: "Billing & Invoicing", description: record.billUploadedAt ? `Billing & Invoicing completed by ${record.billUploadedByName || 'Unknown'} at ${formatDate(record.billUploadedAt)}` : record.billPhotoUrl ? "Billing & Invoicing completed" : "Awaiting billing & invoicing", timestamp: record.billUploadedAt || (record.billPhotoUrl ? record.entryTimestamp : null), state: record.billPhotoUrl ? 'done' : record.approvalStatus === 'APPROVED' ? 'current' : 'pending' },
    ];
  }, [record]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!record) return <p className="py-12 text-center text-slate-400">Record not found</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/vehicle-fuel" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Fuel Register
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8 shadow-xl">
            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 font-bold">Vehicle Fuel Record</p>
                <h1 className="text-3xl font-black tracking-tight">{record.requestId}</h1>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusChip tone={record.approvalStatus === 'APPROVED' ? 'emerald' : record.approvalStatus === 'REJECTED' ? 'rose' : 'amber'}>
                  {record.approvalStatus}
                </StatusChip>
                {record.billPhotoUrl && <StatusChip tone="indigo">INVOICED</StatusChip>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Vehicle Info</h3>
                <DetailInfoRow label="RC No." value={record.rcNo} />
                <DetailInfoRow label="Vehicle Type" value={record.vehicleType} />
                <DetailInfoRow label="Fuel Type" value={record.fuelType} />
                <DetailInfoRow label="Requested By" value={record.requestedByName} />
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Consumption</h3>
                <DetailInfoRow label="Requirement" value={`${record.currentRequirementLitres} Litres`} />
                <DetailInfoRow label="Last Issued Qty" value={`${record.lastIssuedQtyLitres} L`} />
                <DetailInfoRow label="Last Purchase" value={record.lastPurchaseDate ? formatDate(record.lastPurchaseDate) : 'N/A'} />
                <DetailInfoRow label="Total Running" value={`${record.totalRunning} KM/Hrs`} />
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Meter Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                <DetailInfoRow label="Current Reading" value={`${record.currentReading} KM/Hrs`} />
                <DetailInfoRow label="Last Reading" value={`${record.lastReading} KM/Hrs`} />
              </div>
            </div>

            <div className="mt-12 space-y-6">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Evidence & Billing</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <AttachmentCard title="Meter Reading" url={record.lastReadingPhotoUrl} />
                <AttachmentCard title="Logbook Entry" url={record.logbookPhotoUrl} />
                {record.billPhotoUrl ? (
                  <AttachmentCard title="Final Invoice" url={record.billPhotoUrl} />
                ) : record.approvalStatus === 'APPROVED' ? (
                  <div className="relative group rounded-2xl border-2 border-dashed border-white/10 p-4 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 transition-colors">
                    <Upload size={20} className="text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase text-slate-500">Upload Invoice</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0], 'FUEL_BILL')} />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/5 bg-white/5 p-4 flex flex-col items-center justify-center gap-2 opacity-50">
                    <ReceiptText size={20} className="text-slate-600" />
                    <span className="text-[10px] font-bold uppercase text-slate-600">Invoice Pending</span>
                  </div>
                )}
              </div>
            </div>

            {record.billPhotoUrl && (
              <div className="mt-12 space-y-6 animate-fade-in">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">Billing Details</h3>
                
                {isBillSaved ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    <DetailInfoRow label="Fuel Pump Name" value={record.fuelPumpName} />
                    <DetailInfoRow label="Bill Amount" value={new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(record.billAmount)} />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-2xl border border-white/5">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">Fuel Pump Name</label>
                      <input 
                        placeholder="Enter Pump Name" 
                        value={billForm.pump} 
                        onChange={e => setBillForm({...billForm, pump: e.target.value})}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">Bill Amount (₹)</label>
                      <input 
                        type="number" 
                        placeholder="Enter Amount" 
                        value={billForm.amount} 
                        onChange={e => setBillForm({...billForm, amount: e.target.value})}
                        className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end pt-2">
                      <button 
                        onClick={() => setShowConfirm(true)} 
                        disabled={!!actionLoading || !billForm.amount || !billForm.pump} 
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                      >
                        {actionLoading === 'saving_bill' ? <Loader2 size={14} className="animate-spin" /> : <ReceiptText size={14} />}
                        Save Bill Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ConfirmationModal 
          open={showConfirm}
          onClose={() => setShowConfirm(false)}
          onConfirm={handleSaveBill}
          title="Finalize Billing Details?"
          message="Are you sure you want to save these billing details? Once saved, they will be finalized as a completed entry."
          confirmLabel="Yes, Finalize"
          confirmTone="emerald"
        />

        <div className="w-full lg:w-80 space-y-6">
          {!record.billPhotoUrl && (
            <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6 shadow-lg">
              <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Workflow Actions
              </h3>
              {record.approvalStatus === 'PENDING' ? (
                (useAuthStore.getState().user && canPerformStep('approve', record, { sub: useAuthStore.getState().user!.sub, role: useAuthStore.getState().user!.role })) ? (
                  <div className="space-y-3">
                    <button 
                       onClick={() => handleAction('APPROVED')} 
                       disabled={!!actionLoading} 
                       className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'APPROVED' ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      Approve Request
                    </button>
                    <button 
                      onClick={() => handleAction('REJECTED')} 
                      disabled={!!actionLoading} 
                      className="w-full py-3 bg-white/5 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 border border-white/10 rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === 'REJECTED' ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <p className="text-xs text-amber-500/80 font-medium italic">
                      Waiting for Manager review.
                    </p>
                  </div>
                )
              ) : (
                <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <p className="text-xs text-indigo-400 font-medium italic">
                    This request has been processed and is currently {record.approvalStatus?.toLowerCase() || 'processed'}.
                  </p>
                </div>
              )}
            </div>
          )}
          <StatusTimeline events={timelineEvents} />
        </div>
      </div>
    </div>
  );
}
