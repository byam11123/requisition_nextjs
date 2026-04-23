"use client";

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle, Flag, Package, IndianRupee, Upload,
  Loader2, X, ZoomIn, FileCheck, FileImage, Receipt, Building2
} from 'lucide-react';

// ─── Attachment preview with local blob fallback ─────────────────────────────
function AttachmentCard({
  title, url, localUrl, onUpload, canUpload,
}: {
  title: string;
  url?: string | null;
  localUrl?: string | null;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  canUpload?: boolean;
}) {
  const displayUrl = localUrl || url;
  return (
    <div className="border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
      <p className="text-xs text-slate-500 font-medium text-center">{title}</p>
      {displayUrl ? (
        <div
          className="relative h-24 bg-slate-950/50 rounded-xl overflow-hidden cursor-pointer group"
          onClick={() => window.open(displayUrl, '_blank')}
        >
          <img
            src={displayUrl}
            alt={title}
            className="w-full h-full object-contain transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-xl">
            <ZoomIn size={20} className="text-white" />
          </div>
        </div>
      ) : (
        <div className="h-24 flex items-center justify-center bg-slate-950/30 rounded-xl text-slate-600 text-xs">
          No file
        </div>
      )}
      {canUpload && (
        <label className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors">
          <Upload size={12} /> {displayUrl ? 'Replace' : 'Upload'}
          <input type="file" className="hidden" accept="image/*,application/pdf" onChange={onUpload} />
        </label>
      )}
    </div>
  );
}

// ─── Approval Modal ───────────────────────────────────────────────────────────
function ApprovalModal({ open, onClose, onSubmit, loading }: any) {
  const [status, setStatus] = useState('APPROVED');
  const [notes, setNotes] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Process Approval</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X size={20} /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Decision</label>
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50">
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="HOLD">Hold</option>
              <option value="TO_REVIEW">To Review</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Notes / Comments</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Optional comments..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 resize-none text-sm" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
          <button onClick={() => onSubmit(status, notes.trim())}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-colors ${
              status === 'REJECTED' ? 'bg-rose-600 hover:bg-rose-500' :
              status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-500' :
              'bg-indigo-600 hover:bg-indigo-500'
            }`}>
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : status}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Payment Modal ────────────────────────────────────────────────────────────
function PaymentModal({ open, onClose, onSubmit, loading, amount }: any) {
  const [paymentStatus, setPaymentStatus] = useState('DONE');
  const [utrNo, setUtrNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paidAmount, setPaidAmount] = useState(amount);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (f) setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = () => {
    if (!utrNo) { setError('UTR number is required'); return; }
    if (!paidAmount) { setError('Amount is required'); return; }
    onSubmit({ paymentStatus, utrNo, paymentMode, paymentDate: new Date(paymentDate).toISOString(), amount: paidAmount }, file);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Update Payment</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X size={20} /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Payment Status</label>
            <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm">
              <option value="DONE">Done</option>
              <option value="PARTIAL">Partial</option>
              <option value="NOT_DONE">Not Done</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">UTR Number *</label>
              <input value={utrNo} onChange={e => setUtrNo(e.target.value)} placeholder="e.g. UTR1234567890"
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Mode</label>
              <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm">
                <option value="UPI">UPI</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Payment Date</label>
              <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Amount Paid (₹)</label>
              <input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))}
                className="w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm" />
            </div>
          </div>
          {/* Payment proof upload with preview */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 block">Payment Proof</label>
            <div className="border border-dashed border-white/10 rounded-xl p-4">
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="proof" className="w-full h-32 object-contain rounded-lg" />
                  <button onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-1 right-1 p-1 bg-slate-800 rounded-full text-slate-400 hover:text-rose-400">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-slate-500 text-sm mb-2">Screenshot / Bank slip</p>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">
                    <Upload size={14} /> Choose File
                    <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
          <button onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">
            {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

const InfoField = ({ label, value }: { label: string; value?: any }) => (
  <div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-slate-200">{value || '—'}</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ViewRequisitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<any>(null);
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  // Local preview URLs for just-uploaded files (before API returns updated URLs)
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const loadReq = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/requisitions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setReq(await res.json());
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    loadReq();
  }, [id]);

  // ── RBAC flags (mirrors Spring Boot service exactly) ──────────────────────
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isAccountant = role === 'ACCOUNTANT';
  const isPurchaser = role === 'PURCHASER';

  // Approval: MANAGER or ADMIN, only when approvalStatus is PENDING
  const canApprove = (isManager || isAdmin) && req?.approvalStatus === 'PENDING';

  // Payment: ACCOUNTANT or ADMIN, only when APPROVED and payment not DONE
  const canPay = (isAccountant || isAdmin) && req?.approvalStatus === 'APPROVED' && req?.paymentStatus !== 'DONE';

  // Dispatch: PURCHASER only, when APPROVED and not yet DISPATCHED
  const canDispatch = isPurchaser && req?.approvalStatus === 'APPROVED' && req?.dispatchStatus === 'NOT_DISPATCHED';

  // Upload - Bill/Invoice: PURCHASER, only if not yet APPROVED or REJECTED
  const canUploadBill = isPurchaser &&
    req?.approvalStatus !== 'APPROVED' && req?.approvalStatus !== 'REJECTED';

  // Upload - Material proof: PURCHASER, only if not yet APPROVED or REJECTED
  const canUploadMaterial = isPurchaser &&
    req?.approvalStatus !== 'APPROVED' && req?.approvalStatus !== 'REJECTED';

  // Upload - Vendor Payment Details: PURCHASER, payment not DONE and not REJECTED
  const canUploadVendorPayment = isPurchaser &&
    req?.paymentStatus !== 'DONE' && req?.approvalStatus !== 'REJECTED';

  const hasActions = canApprove || canPay || canDispatch;

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleApproval = async (status: string, notes: string) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/requisitions/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: status, notes }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Approval failed');
      }
      await loadReq();
      setApprovalOpen(false);
    } catch (e: any) { alert(e.message || 'Approval failed'); }
    finally { setModalLoading(false); }
  };

  const handlePayment = async (data: any, file: File | null) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem('token');
      // 1. Save payment data
      const res = await fetch(`/api/requisitions/${id}/payment`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Payment update failed');
      }
      const updated = await res.json();
      
      // Update state with new data including user info
      await loadReq();

      // 2. Upload payment proof if provided
      if (file) {
        const blobUrl = URL.createObjectURL(file);
        setLocalPreviews(prev => ({ ...prev, paymentPhotoUrl: blobUrl }));
        const fd = new FormData();
        fd.append('file', file);
        fd.append('category', 'PAYMENT');
        fd.append('requisitionId', id);
        const upRes = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (upRes.ok) {
          const { url } = await upRes.json();
          setLocalPreviews(prev => ({ ...prev, paymentPhotoUrl: url }));
          setReq((prev: any) => ({ ...prev, paymentPhotoUrl: url }));
        }
      }

      setPaymentOpen(false);
    } catch (e: any) { alert(e.message || 'Payment update failed'); }
    finally { setModalLoading(false); }
  };

  const handleDispatch = async () => {
    if (!confirm('Mark this requisition as dispatched?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/requisitions/${id}/dispatch`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Dispatch failed');
      }
      await loadReq();
    } catch (e: any) { alert(e.message || 'Dispatch failed'); }
  };

  // File upload — shows blob preview instantly, replaces with persistent URL on success.
  // Only patches the one changed field in req state — no full page re-fetch.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'bill' | 'material' | 'vendor_payment') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const urlKey   = type === 'bill' ? 'billPhotoUrl' : type === 'material' ? 'materialPhotoUrl' : 'vendorPaymentDetailsUrl';
    const category = type === 'vendor_payment' ? 'VENDOR_PAYMENT' : type.toUpperCase();

    // Instant blob preview
    const blobUrl = URL.createObjectURL(file);
    setLocalPreviews(prev => ({ ...prev, [urlKey]: blobUrl }));

    try {
      const token = localStorage.getItem('token');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('requisitionId', id);
      const res = await fetch('/api/uploads', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        const { url } = await res.json();
        // 1. Clear the localPreview for this key (req now has the real URL)
        setLocalPreviews(prev => { const n = { ...prev }; delete n[urlKey]; return n; });
        // 2. Patch ONLY this one URL field in req — no full page reload
        setReq((prev: any) => ({ ...prev, [urlKey]: url }));
      }
    } catch {
      alert('Upload failed');
      // Keep blob preview on failure so user sees something
    }
    e.target.value = '';
  };

  // ── Timeline ──────────────────────────────────────────────────────────────
  const getActiveStep = () => {
    if (req?.dispatchStatus === 'DISPATCHED') return 3;
    if (req?.paymentStatus === 'DONE') return 2;
    if (req?.approvalStatus === 'APPROVED') return 1;
    if (req?.approvalStatus === 'REJECTED') return 1;
    return 0;
  };

  const formatDate = (v?: string) => {
    if (!v) return '';
    const d = new Date(v.endsWith('Z') ? v : v + 'Z');
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );
  if (!req) return <p className="text-slate-400 text-center py-12">Requisition not found</p>;

  const activeStep = getActiveStep();

  const statusColor = (s: string) => {
    const m: Record<string, string> = {
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      HOLD: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      TO_REVIEW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      SUBMITTED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      DRAFT: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      DONE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      NOT_DONE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      DISPATCHED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      NOT_DISPATCHED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      COMPLETED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return `inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full border ${m[s] || m.DRAFT}`;
  };

  const timelineSteps = [
    { label: 'Submitted', date: req.createdAt, by: req.createdByName || req.createdBy?.fullName, note: null, icon: Flag, color: 'bg-indigo-500' },
    {
      label: req.approvalStatus === 'REJECTED' ? 'Rejected' : req.approvalStatus === 'HOLD' ? 'On Hold' : 'Approved',
      date: req.approvedAt, by: req.approvedByName || req.approvedBy?.fullName, note: req.approvalNotes, icon: CheckCircle,
      color: req.approvalStatus === 'REJECTED' ? 'bg-rose-500' : req.approvalStatus === 'HOLD' ? 'bg-amber-500' : 'bg-emerald-500',
    },
    { label: 'Payment Processed', date: req.paidAt, by: req.paidByName || req.paidBy?.fullName, note: req.paymentUtrNo ? `UTR: ${req.paymentUtrNo} • ${req.paymentMode || ''}` : null, icon: IndianRupee, color: 'bg-purple-500' },
    { label: 'Dispatched & Completed', date: req.dispatchedAt, by: req.dispatchedByName || req.dispatchedBy?.fullName, note: null, icon: Package, color: 'bg-blue-500' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left: Main Details ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Header card */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Requisition ID</p>
                <h1 className="text-2xl font-bold text-slate-100">{req.requestId}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={statusColor(req.approvalStatus)}>{req.approvalStatus}</span>
                <span className={statusColor(req.paymentStatus)}>{req.paymentStatus}</span>
                <span className={statusColor(req.dispatchStatus)}>{req.dispatchStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <InfoField label="Material Description" value={req.materialDescription} />
              <InfoField label="Quantity" value={req.quantity} />
              <InfoField label="Priority" value={req.priority} />
              <InfoField label="Site Address" value={req.siteAddress} />
              <InfoField label="Amount" value={req.amount != null ? `₹${Number(req.amount).toLocaleString('en-IN')}` : null} />
              <InfoField label="Created By" value={req.createdByName || req.createdBy?.fullName} />
              <InfoField label="Required For" value={req.requiredFor} />
              <InfoField label="Vendor" value={req.vendorName} />
              <InfoField label="PO Details" value={req.poDetails} />
              <InfoField label="Indent No" value={req.indentNo} />
              {(req.approvedByName || req.approvedBy?.fullName) && <InfoField label="Approved By" value={req.approvedByName || req.approvedBy?.fullName} />}
              {(req.paidByName || req.paidBy?.fullName) && <InfoField label="Paid By" value={req.paidByName || req.paidBy?.fullName} />}
              {(req.dispatchedByName || req.dispatchedBy?.fullName) && <InfoField label="Dispatched By" value={req.dispatchedByName || req.dispatchedBy?.fullName} />}
              {req.paymentUtrNo && <InfoField label="UTR No" value={req.paymentUtrNo} />}
              {req.paymentMode && <InfoField label="Payment Mode" value={req.paymentMode} />}
              {req.approvalNotes && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Approval Notes</p>
                  <p className="text-slate-300 italic">&quot;{req.approvalNotes}&quot;</p>
                </div>
              )}
              {req.description && (
                <div className="col-span-full">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Additional Notes</p>
                  <p className="text-slate-200 whitespace-pre-wrap">{req.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Attachments</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AttachmentCard
                title="Bill / Invoice"
                url={req.billPhotoUrl}
                localUrl={localPreviews.billPhotoUrl}
                canUpload={canUploadBill}
                onUpload={e => handleFileUpload(e, 'bill')}
              />
              <AttachmentCard
                title="Vendor Payment"
                url={req.vendorPaymentDetailsUrl}
                localUrl={localPreviews.vendorPaymentDetailsUrl}
                canUpload={canUploadVendorPayment}
                onUpload={e => handleFileUpload(e, 'vendor_payment')}
              />
              <AttachmentCard
                title="Payment Proof"
                url={req.paymentPhotoUrl}
                localUrl={localPreviews.paymentPhotoUrl}
                canUpload={false} // payment proof is uploaded during payment modal
              />
              <AttachmentCard
                title="Material Proof"
                url={req.materialPhotoUrl}
                localUrl={localPreviews.materialPhotoUrl}
                canUpload={canUploadMaterial}
                onUpload={e => handleFileUpload(e, 'material')}
              />
            </div>
            {/* Explain which uploads PURCHASER can do based on status */}
            {isPurchaser && (
              <p className="text-xs text-slate-600 mt-4">
                {canUploadBill
                  ? 'You can upload Bill/Invoice, Material Proof, and Vendor Payment Details before approval.'
                  : req.approvalStatus === 'APPROVED'
                    ? 'Requisition is approved — you can now upload Vendor Payment Details and mark as Dispatched.'
                    : 'Uploads are locked after rejection.'}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: Actions + Timeline ────────────────────────────────────── */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Actions Card */}
          {hasActions && (
            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-3">
              <h3 className="text-base font-semibold text-slate-100 mb-2">Actions</h3>

              {/* MANAGER / ADMIN */}
              {canApprove && (
                <button id="btn-process-approval" onClick={() => setApprovalOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <CheckCircle size={16} /> Process Approval
                </button>
              )}

              {/* ACCOUNTANT / ADMIN */}
              {canPay && (
                <button id="btn-update-payment" onClick={() => setPaymentOpen(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <IndianRupee size={16} /> Update Payment
                </button>
              )}

              {/* PURCHASER – Dispatch */}
              {canDispatch && (
                <button id="btn-dispatch" onClick={handleDispatch}
                  className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2">
                  <Package size={16} /> Mark as Dispatched
                </button>
              )}
            </div>
          )}

          {/* Status Timeline */}
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-6">Status Timeline</h3>
            <div className="ml-3">
              {timelineSteps.map((step, i) => {
                const done = i <= activeStep;
                return (
                  <div key={step.label}
                    className={`relative pl-8 pb-8 border-l last:pb-0 ${done ? 'border-white/10' : 'border-white/5'}`}>
                    <div className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-slate-950 flex items-center justify-center
                      ${done ? step.color : 'bg-slate-800'}`}>
                      <step.icon size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${done ? 'text-slate-200' : 'text-slate-600'}`}>{step.label}</h4>
                      {step.date && <p className="text-xs text-slate-400 mt-0.5">{formatDate(step.date)}</p>}
                      {step.by && <p className="text-xs text-slate-500">By {step.by}</p>}
                      {step.note && <p className="text-xs text-slate-500 mt-0.5 italic">{step.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ApprovalModal open={approvalOpen} onClose={() => setApprovalOpen(false)} onSubmit={handleApproval} loading={modalLoading} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSubmit={handlePayment} loading={modalLoading} amount={req.amount} />
    </div>
  );
}
