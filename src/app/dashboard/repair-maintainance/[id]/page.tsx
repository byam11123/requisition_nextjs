// file rewritten below
"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Upload, ZoomIn, X, CheckCircle, IndianRupee, Package, Phone, User, Flag, Truck } from "lucide-react";

const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2.5 text-slate-200 outline-none focus:border-indigo-500/50 text-sm";
const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

function AttachmentCard({ title, url, localUrl, onUpload, canUpload = true }: any) {
  const displayUrl = localUrl || url;
  return (
    <div className="border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
      <p className="text-xs text-slate-500 font-medium text-center">{title}</p>
      {displayUrl ? (
        <div className="relative h-24 bg-slate-950/50 rounded-xl overflow-hidden cursor-pointer group" onClick={() => window.open(displayUrl, "_blank")}>
          <img src={displayUrl} alt={title} className="w-full h-full object-contain transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity rounded-xl"><ZoomIn size={20} className="text-white" /></div>
        </div>
      ) : <div className="h-24 flex items-center justify-center bg-slate-950/30 rounded-xl text-slate-600 text-xs">No file</div>}
      {canUpload && <label className="flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-indigo-400 cursor-pointer transition-colors"><Upload size={12} /> {displayUrl ? "Replace" : "Upload"}<input type="file" className="hidden" accept="image/*,application/pdf" onChange={onUpload} /></label>}
    </div>
  );
}

function PaymentModal({ open, onClose, onSubmit, loading }: any) {
  const [paymentStatus, setPaymentStatus] = useState("DONE");
  const [utrNo, setUtrNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg">
        <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-semibold text-slate-100">Update Payment</h2><button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X size={20} /></button></div>
        <div className="space-y-4">
          <div><label className={labelCls}>Payment Status</label><select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className={inputCls}><option value="DONE">Done</option><option value="PARTIAL">Partial</option><option value="NOT_DONE">Not Done</option></select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>UTR Number *</label><input value={utrNo} onChange={(e) => setUtrNo(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Mode</label><select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className={inputCls}><option value="UPI">UPI</option><option value="NEFT">NEFT</option><option value="RTGS">RTGS</option><option value="CASH">Cash</option><option value="CHEQUE">Cheque</option></select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Payment Date</label><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Amount Paid</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Payment Proof</label><input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputCls} /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
          <button onClick={() => onSubmit({ paymentStatus, utrNo, paymentMode, paymentDate: new Date(paymentDate).toISOString(), amount: Number(amount || 0) }, file)} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<any>(null);
  const [req, setReq] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string; role: string }>>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [initialDispatchStatus, setInitialDispatchStatus] = useState<string | null>(null);
  const [initialDeliveryStatus, setInitialDeliveryStatus] = useState<string | null>(null);

  const loadReq = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/repair-maintainance/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReq(data);
        setInitialDispatchStatus(data.dispatchStatus || "NOT_DISPATCHED");
        setInitialDeliveryStatus(data.deliveryStatus || "NOT_DELIVERED");
        setContacts(Array.isArray(data.contacts) ? data.contacts : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) setUser(JSON.parse(u));
    loadReq();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/repair-maintainance/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          priority: req.priority,
          warrantyStatus: req.warrantyStatus,
          repairRequisitionByName: req.repairRequisitionByName,
          siteAddress: req.siteAddress,
          itemDescription: req.itemDescription,
          quantity: req.quantity,
          repairVendorName: req.repairVendorName,
          expectedReturnDate: req.expectedReturnDate,
          repairStatus: req.repairStatus,
          returnedByName: req.returnedByName,
          dateOfReturn: req.dateOfReturn,
          dispatchByName: req.dispatchByName,
          dispatchDate: req.dispatchDate,
          deliveryStatus: req.deliveryStatus,
          receivedBy: req.receivedBy,
          receivedDate: req.receivedDate,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReq(data);
        setInitialDispatchStatus(data.dispatchStatus || "NOT_DISPATCHED");
        setInitialDeliveryStatus(data.deliveryStatus || "NOT_DELIVERED");
        setToast({ type: "success", message: "Workflow updated successfully." });
      } else {
        setToast({ type: "error", message: "Failed to save workflow update." });
      }
    } catch {
      setToast({ type: "error", message: "Failed to save workflow update." });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const saveContacts = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/repair-maintainance/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contacts }),
      });
      await loadReq();
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (file: File, category: "MATERIAL" | "REPAIR_AFTER" | "BILL" | "PAYMENT" | "VENDOR_PAYMENT" | "DISPATCH_ITEM") => {
    const urlKey =
      category === "MATERIAL"
        ? "repairStatusBeforePhoto"
        : category === "REPAIR_AFTER"
          ? "repairStatusAfterPhoto"
          : category === "BILL"
            ? "billInvoicePhoto"
          : category === "PAYMENT"
            ? "paymentProofPhoto"
            : category === "DISPATCH_ITEM"
              ? "dispatchItemPhoto"
              : "vendorPaymentDetailsUrl";

    // Instant local preview, same behavior as requisition page.
    const blobUrl = URL.createObjectURL(file);
    setLocalPreviews((prev) => ({ ...prev, [urlKey]: blobUrl }));

    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category", category);
    fd.append("requisitionId", String(id));
    try {
      const res = await fetch("/api/uploads", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) throw new Error("Upload failed");
      const payload = await res.json();
      const uploadedUrl = payload.url as string;

      // Patch only the current card URL; no whole page refresh.
      setReq((prev: any) => ({ ...prev, [urlKey]: uploadedUrl }));
      setLocalPreviews((prev) => {
        const next = { ...prev };
        delete next[urlKey];
        return next;
      });
      setToast({ type: "success", message: "Attachment uploaded successfully." });
    } catch {
      setToast({ type: "error", message: "Attachment upload failed." });
    }
  };

  const processApproval = async (approvalStatus: "APPROVED" | "REJECTED" | "HOLD" | "TO_REVIEW") => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus, notes: `Repair request ${approvalStatus}` }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Approval failed");
      }
      await loadReq();
      setToast({ type: "success", message: `Repair request ${approvalStatus.toLowerCase()} successfully.` });
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Approval failed" });
    }
  };

  const processPayment = async () => {
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async (data: any, file: File | null) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/payment`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Payment update failed");
      }
      
      await loadReq();

      if (file) {
        const blobUrl = URL.createObjectURL(file);
        setLocalPreviews((prev) => ({ ...prev, paymentProofPhoto: blobUrl }));
        const fd = new FormData();
        fd.append("file", file);
        fd.append("category", "PAYMENT");
        fd.append("requisitionId", String(id));
        const upRes = await fetch("/api/uploads", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        if (upRes.ok) {
          const { url } = await upRes.json();
          setReq((prev: any) => ({ ...prev, paymentProofPhoto: url }));
          setLocalPreviews((prev) => {
            const next = { ...prev };
            delete next.paymentProofPhoto;
            return next;
          });
        }
      }

      setToast({ type: "success", message: "Payment updated successfully." });
      setPaymentOpen(false);
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Payment update failed." });
    } finally {
      setModalLoading(false);
    }
  };

  const markDispatch = async () => {
    if (!confirm("Mark this repair item as dispatched?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Dispatch failed");
      }
      await loadReq();
      setToast({ type: "success", message: "Item marked as dispatched." });
    } catch (e: any) {
      setToast({ type: "error", message: e.message || "Dispatch failed" });
    }
  };

  const formatDate = (v?: string) => (v ? new Date(v).toLocaleString("en-IN") : "—");
  const statusChipCls = (type: "approval" | "payment" | "dispatch", value?: string) => {
    const base = "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide";
    if (type === "approval") {
      if (value === "APPROVED") return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`;
      if (value === "REJECTED") return `${base} bg-rose-500/10 text-rose-300 border-rose-500/30`;
      if (value === "HOLD") return `${base} bg-amber-500/10 text-amber-300 border-amber-500/30`;
      return `${base} bg-indigo-500/10 text-indigo-300 border-indigo-500/30`;
    }
    if (type === "payment") {
      if (value === "DONE") return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`;
      if (value === "PARTIAL") return `${base} bg-amber-500/10 text-amber-300 border-amber-500/30`;
      return `${base} bg-slate-500/10 text-slate-300 border-slate-500/30`;
    }
    if (value === "DELIVERED") return `${base} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`;
    if (value === "DISPATCHED") return `${base} bg-sky-500/10 text-sky-300 border-sky-500/30`;
    return `${base} bg-slate-500/10 text-slate-300 border-slate-500/30`;
  };

  const role = String(user?.role || "").toUpperCase().trim();
  const isPurchaser = role === "PURCHASER";
  const repairStatusNorm = String(req?.repairStatus || "NOT_REPAIRED").toUpperCase().trim();
  const dispatchStatusNorm = String(req?.dispatchStatus || "NOT_DISPATCHED").toUpperCase().trim();
  const approvalStatusNorm = String(req?.approvalStatus || "PENDING").toUpperCase().trim();
  const paymentStatusNorm = String(req?.paymentStatus || "NOT_DONE").toUpperCase().trim();
  const warrantyStatusNorm = String(req?.warrantyStatus || "OUT_OF_WARRANTY").toUpperCase().trim();

  const isAdmin = role === "ADMIN";
  const dbDispatchStatus = String(initialDispatchStatus || "NOT_DISPATCHED").toUpperCase().trim();
  const dbDeliveryStatus = String(initialDeliveryStatus || "NOT_DELIVERED").toUpperCase().trim();
  const currentDispatchStatus = String(req?.dispatchStatus || "NOT_DISPATCHED").toUpperCase().trim();
  const currentDeliveryStatus = String(req?.deliveryStatus || "NOT_DELIVERED").toUpperCase().trim();

  // Master Lock: Payment is DONE or Item is DELIVERED
  const isMasterLocked = (paymentStatusNorm === "DONE" || dbDeliveryStatus === "DELIVERED") && !isAdmin;

  const isDispatchMetaLocked = (dbDispatchStatus === "DISPATCHED" || isMasterLocked) && !isAdmin;
  const isDeliveryLocked = (dbDeliveryStatus === "DELIVERED") && !isAdmin;
  const isDispatchStatusLocked = (dbDispatchStatus === "DISPATCHED" || isMasterLocked) && !isAdmin;

  const isRepaired = repairStatusNorm === "REPAIRED";
  const isDispatched = currentDispatchStatus !== "NOT_DISPATCHED";
  const canApprove = isRepaired && (role === "MANAGER" || role === "ADMIN") && approvalStatusNorm === "PENDING";
  const isOutOfWarranty = warrantyStatusNorm === "OUT_OF_WARRANTY";
  const canPay = isRepaired && isOutOfWarranty && (role === "ACCOUNTANT" || role === "ADMIN") && approvalStatusNorm === "APPROVED" && paymentStatusNorm !== "DONE";
  const canDispatch =
    isRepaired &&
    (role === "PURCHASER" || role === "ADMIN") &&
    approvalStatusNorm === "APPROVED" &&
    (isOutOfWarranty ? paymentStatusNorm === "DONE" : true) &&
    dbDispatchStatus === "NOT_DISPATCHED";
  const canUploadBill = !isMasterLocked && isPurchaser && isOutOfWarranty && approvalStatusNorm !== "REJECTED";
  const canUploadVendorPayment = !isMasterLocked && isPurchaser && isOutOfWarranty && approvalStatusNorm !== "REJECTED";

  const showWorkflowSave = !isMasterLocked && (dbDispatchStatus === "NOT_DISPATCHED" || dbDeliveryStatus === "NOT_DELIVERED");

  const getActiveStep = () => {
    if (dbDeliveryStatus === "DELIVERED") return 4;
    if (dbDispatchStatus === "DISPATCHED") return 3;
    if (paymentStatusNorm === "DONE") return 2;
    if (approvalStatusNorm === "APPROVED") return 1;
    if (approvalStatusNorm === "REJECTED") return 1;
    return 0;
  };

  const activeStep = getActiveStep();

  const timelineSteps = [
    { label: "Submitted", date: req?.timestamp, by: req?.repairRequisitionByName, note: `Priority: ${req?.priority || "NORMAL"}`, icon: Flag, color: "bg-indigo-500" },
    {
      label: approvalStatusNorm === "REJECTED" ? "Rejected" : approvalStatusNorm === "HOLD" ? "On Hold" : "Approved",
      date: req?.approvedAt,
      by: req?.approvedByName,
      note: req?.approvalNotes,
      icon: CheckCircle,
      color: approvalStatusNorm === "REJECTED" ? "bg-rose-500" : approvalStatusNorm === "HOLD" ? "bg-amber-500" : "bg-emerald-500",
    },
    {
      label: "Account Payment",
      date: req?.paidAt,
      by: req?.paidByName,
      note: isOutOfWarranty ? (req?.paymentUtrNo ? `UTR: ${req.paymentUtrNo}` : null) : "N/A (In Warranty)",
      icon: IndianRupee,
      color: isOutOfWarranty ? "bg-purple-500" : "bg-slate-700",
      skipped: !isOutOfWarranty,
    },
    {
      label: "Dispatch",
      date: req?.dispatchedAt,
      by: req?.dispatchedByName,
      note: req?.dispatchSite ? `Site: ${req.dispatchSite}` : null,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Delivery",
      date: req?.deliveredAt,
      by: req?.deliveredByName,
      note: req?.receivedBy ? `Material received by ${req.receivedBy}${req.receivedDate ? ` on ${formatDate(req.receivedDate).split(',')[0]}` : ""}` : null,
      icon: Truck,
      color: "bg-emerald-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }
  if (!req) return <p className="text-slate-400 text-center py-10">Repair request not found</p>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2.5 rounded-xl border text-sm shadow-lg ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {toast.message}
        </div>
      )}
      <Link href="/dashboard/repair-maintainance" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
        <ArrowLeft size={16} /> Back to Repair/Maintainance
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Request ID</p>
                <h1 className="text-2xl font-bold text-slate-100">{req.requestId}</h1>
                <p className="text-slate-500 text-sm mt-1">Timestamp: {formatDate(req.timestamp)}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className={statusChipCls("approval", req.approvalStatus)}>
                  <span className="text-slate-400">Approval</span>
                  <span>{req.approvalStatus || "PENDING"}</span>
                </span>
                <span className={statusChipCls("payment", req.paymentStatus)}>
                  <span className="text-slate-400">Payment</span>
                  <span>{req.paymentStatus || "NOT_DONE"}</span>
                </span>
                <span className={statusChipCls("dispatch", dbDispatchStatus === "NOT_DISPATCHED" ? "NOT_DISPATCHED" : "DISPATCHED")}>
                  <span className="text-slate-400">Dispatch</span>
                  <span>{dbDispatchStatus === "NOT_DISPATCHED" ? "NOT_DISPATCHED" : "DISPATCHED"}</span>
                </span>
                {dbDispatchStatus !== "NOT_DISPATCHED" && (
                  <span className={statusChipCls("dispatch", dbDeliveryStatus === "DELIVERED" ? "DELIVERED" : "PENDING")}>
                    <span className="text-slate-400">Delivery</span>
                    <span>{dbDeliveryStatus === "DELIVERED" ? "DELIVERED" : "PENDING"}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Priority</label>
                <select disabled={isMasterLocked} value={req.priority || "NORMAL"} onChange={(e) => setReq((p: any) => ({ ...p, priority: e.target.value }))} className={inputCls}>
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Repair Requisition By (Name)</label>
                <input disabled={isMasterLocked} value={req.repairRequisitionByName || ""} onChange={(e) => setReq((p: any) => ({ ...p, repairRequisitionByName: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Warranty Status</label>
                <select disabled={isMasterLocked} value={req.warrantyStatus || "OUT_OF_WARRANTY"} onChange={(e) => setReq((p: any) => ({ ...p, warrantyStatus: e.target.value }))} className={inputCls}>
                  <option value="IN_WARRANTY">In Warranty (No Payment)</option>
                  <option value="OUT_OF_WARRANTY">Out of Warranty (Payment Required)</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Expected Return Date</label>
                <input disabled={isMasterLocked} type="date" value={req.expectedReturnDate?.slice(0, 10) || ""} onChange={(e) => setReq((p: any) => ({ ...p, expectedReturnDate: e.target.value }))} className={inputCls} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div><label className={labelCls}>Site Name & Address</label><input disabled={isMasterLocked} value={req.siteAddress || ""} onChange={(e) => setReq((p: any) => ({ ...p, siteAddress: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Description of Item</label><input disabled={isMasterLocked} value={req.itemDescription || ""} onChange={(e) => setReq((p: any) => ({ ...p, itemDescription: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Qty</label><input disabled={isMasterLocked} type="number" min={1} value={req.quantity || 1} onChange={(e) => setReq((p: any) => ({ ...p, quantity: Number(e.target.value) }))} className={inputCls} /></div>
              <div><label className={labelCls}>Name of Repair Vendor</label><input disabled={isMasterLocked} value={req.repairVendorName || ""} onChange={(e) => setReq((p: any) => ({ ...p, repairVendorName: e.target.value }))} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Repair Status</label>
                <select
                  disabled={isMasterLocked}
                  value={req.repairStatus || "NOT_REPAIRED"}
                  onChange={(e) => setReq((p: any) => ({ ...p, repairStatus: e.target.value }))}
                  className={inputCls}
                >
                  <option value="NOT_REPAIRED">NOT REPAIRED</option>
                  <option value="REPAIRED">REPAIRED</option>
                </select>
              </div>
              {isRepaired && (
                <>
                  <div><label className={labelCls}>Returned By (Name)</label><input disabled={isMasterLocked} value={req.returnedByName || ""} onChange={(e) => setReq((p: any) => ({ ...p, returnedByName: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Date of Return</label><input disabled={isMasterLocked} type="date" value={req.dateOfReturn?.slice(0, 10) || ""} onChange={(e) => setReq((p: any) => ({ ...p, dateOfReturn: e.target.value }))} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Dispatch Status</label>
                    <select disabled={isDispatchStatusLocked} value={req.dispatchStatus || "NOT_DISPATCHED"} onChange={(e) => setReq((p: any) => ({ ...p, dispatchStatus: e.target.value }))} className={inputCls}>
                      <option value="NOT_DISPATCHED" disabled={dbDispatchStatus !== "NOT_DISPATCHED"}>Not Dispatched</option>
                      <option value="DISPATCHED">Dispatched</option>
                    </select>
                  </div>
                  {isDispatched && (
                    <>
                      <div><label className={labelCls}>Dispatch Site</label><input disabled={isDispatchMetaLocked} value={req.dispatchSite || ""} onChange={(e) => setReq((p: any) => ({ ...p, dispatchSite: e.target.value }))} className={inputCls} /></div>
                      <div><label className={labelCls}>Dispatch By (Name)</label><input disabled={isDispatchMetaLocked} value={req.dispatchByName || ""} onChange={(e) => setReq((p: any) => ({ ...p, dispatchByName: e.target.value }))} className={inputCls} /></div>
                      <div><label className={labelCls}>Dispatch Date</label><input disabled={isDispatchMetaLocked} type="date" value={req.dispatchDate?.slice(0, 10) || ""} onChange={(e) => setReq((p: any) => ({ ...p, dispatchDate: e.target.value }))} className={inputCls} /></div>
                    </>
                  )}
                </>
              )}
            </div>

            {isDispatched && (
              <div className="mt-8 pt-8 border-t border-white/5">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Delivery Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Delivery Status</label>
                    <select disabled={isMasterLocked} value={req.deliveryStatus || "NOT_DELIVERED"} onChange={(e) => setReq((p: any) => ({ ...p, deliveryStatus: e.target.value }))} className={inputCls}>
                      <option value="NOT_DELIVERED">Not Delivered</option>
                      <option value="DELIVERED">Delivered</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Received By (Name)</label>
                    <input disabled={isMasterLocked} value={req.receivedBy || ""} onChange={(e) => setReq((p: any) => ({ ...p, receivedBy: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Receiving Date</label>
                    <input disabled={isMasterLocked} type="date" value={req.receivedDate?.slice(0, 10) || ""} onChange={(e) => setReq((p: any) => ({ ...p, receivedDate: e.target.value }))} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {showWorkflowSave && (
              <div className="mt-5">
                <button onClick={saveWorkflow} disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : "Save Workflow Update"}
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Attachments</h3>
            <p className="text-sm text-slate-400 mb-4">Same working style as requisition attachments and proofs.</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <AttachmentCard
                title="Repair Status Before Photo"
                url={req.repairStatusBeforePhoto}
                canUpload={!isMasterLocked}
                localUrl={localPreviews.repairStatusBeforePhoto}
                onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "MATERIAL")}
              />
              {isRepaired && (
                <>
                  <AttachmentCard
                    title="Repair Status After Photo"
                    url={req.repairStatusAfterPhoto}
                    canUpload={!isMasterLocked}
                    localUrl={localPreviews.repairStatusAfterPhoto}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "REPAIR_AFTER")}
                  />
                  <AttachmentCard
                    title="Bill / Invoice"
                    url={req.billInvoicePhoto}
                    canUpload={canUploadBill}
                    localUrl={localPreviews.billInvoicePhoto}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "BILL")}
                  />
                  <AttachmentCard
                    title="Payment Proof"
                    url={req.paymentProofPhoto}
                    canUpload={!isMasterLocked}
                    localUrl={localPreviews.paymentProofPhoto}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "PAYMENT")}
                  />
                  {isDispatched && (
                    <AttachmentCard
                      title="Dispatch Item Photo"
                      url={req.dispatchItemPhoto}
                      canUpload={!isDispatchMetaLocked}
                      localUrl={localPreviews.dispatchItemPhoto}
                      onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "DISPATCH_ITEM")}
                    />
                  )}
                  <AttachmentCard
                    title="Vendor Payment Attachment"
                    url={req.vendorPaymentDetailsUrl}
                    canUpload={canUploadVendorPayment}
                    localUrl={localPreviews.vendorPaymentDetailsUrl}
                    onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "VENDOR_PAYMENT")}
                  />
                </>
              )}
            </div>
            {!isOutOfWarranty && (
              <p className="text-xs text-slate-500 mt-4">This item is in warranty. Payment-related attachments are not required.</p>
            )}
          </div>

        </div>

        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6 space-y-3">
            <h3 className="text-base font-semibold text-slate-100">Actions</h3>
            {canApprove && (
              <button onClick={() => processApproval("APPROVED")} className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm inline-flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Manager Approve
              </button>
            )}
            {!canApprove && (role === "MANAGER" || role === "ADMIN") && approvalStatusNorm === "PENDING" && !isRepaired && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                Approval is hidden until `Repair Status` is set to `REPAIRED`.
              </p>
            )}
            {canPay && (
              <button onClick={processPayment} className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm inline-flex items-center justify-center gap-2">
                <IndianRupee size={16} /> Update Payment
              </button>
            )}
            {canDispatch && (
              <button onClick={markDispatch} className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm inline-flex items-center justify-center gap-2">
                <Package size={16} /> Dispatch Item
              </button>
            )}
            {!isOutOfWarranty && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                In warranty item: payment approval step skipped.
              </p>
            )}
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-6">Status Timeline</h3>
            <div className="ml-3">
              {timelineSteps.map((step, i) => {
                // If skipped, we consider it done for the line drawing but visually different
                const isDone = i <= activeStep || step.skipped;
                const isStepActive = i === activeStep;

                return (
                  <div key={i} className={`relative pl-8 pb-8 border-l last:pb-0 ${isDone ? "border-indigo-500/30" : "border-white/5"}`}>
                    <div
                      className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full border-4 border-slate-950 flex items-center justify-center transition-all duration-300
                      ${isDone ? step.color : "bg-slate-800"} ${isStepActive ? "ring-2 ring-indigo-500/50 scale-110" : ""}`}
                    >
                      <step.icon size={14} className={isDone ? "text-white" : "text-slate-500"} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${isDone ? "text-slate-200" : "text-slate-600"}`}>{step.label}</h4>
                      {step.date && <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(step.date)}</p>}
                      {step.by && <p className="text-[10px] text-slate-500">By {step.by}</p>}
                      {step.note && <p className="text-[11px] text-indigo-400/70 mt-1 italic leading-relaxed">{step.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-6">
            <h3 className="text-base font-semibold text-slate-100 mb-4">Contacts</h3>
            <p className="text-sm text-slate-400 mb-4">Guidance contacts for this repair case.</p>
            {contacts.map((c, idx) => (
              <div key={idx} className="space-y-2 mb-3">
                <div className="relative">
                  <User size={14} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      placeholder="Name"
                      disabled={isMasterLocked}
                      value={c.name}
                      onChange={(e) => setContacts((p) => p.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row)))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-3 text-slate-500" />
                    <input
                      placeholder="Phone"
                      disabled={isMasterLocked}
                      value={c.phone}
                      onChange={(e) => setContacts((p) => p.map((row, i) => (i === idx ? { ...row, phone: e.target.value } : row)))}
                      className={`${inputCls} pl-9`}
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      placeholder="Role / Department"
                      disabled={isMasterLocked}
                      value={c.role}
                      onChange={(e) => setContacts((p) => p.map((row, i) => (i === idx ? { ...row, role: e.target.value } : row)))}
                      className={inputCls}
                    />
                    {!isMasterLocked && (
                      <button
                        onClick={() => setContacts((p) => p.filter((_, i) => i !== idx))}
                        className="px-3 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5"
                      >
                        -
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {!isMasterLocked && (
                <div className="flex gap-2">
                  <button onClick={() => setContacts((p) => [...p, { name: "", phone: "", role: "" }])} className="px-3 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm">Add</button>
                  <button onClick={saveContacts} disabled={saving} className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm">{saving ? "Saving..." : "Save"}</button>
                </div>
              )}
          </div>
        </div>
      </div>
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSubmit={handlePaymentSubmit} loading={modalLoading} />
    </div>
  );
}
