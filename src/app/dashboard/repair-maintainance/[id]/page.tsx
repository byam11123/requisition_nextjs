// file rewritten below
"use client";

import { startTransition, useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, X, CheckCircle, IndianRupee, Package, Phone, User, Flag, Truck, Plus } from "lucide-react";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import StatusTimeline, { type TimelineEvent } from "@/app/dashboard/status-timeline";
import FormSelect, {
  type FormSelectOption,
} from "@/components/ui/form-select";
import StatusChip, {
  type StatusChipTone,
} from "@/components/ui/status-chip";

import ActionToast from "@/app/dashboard/action-toast";
import { type ContactDefinition } from "@/lib/stores/contact-store";

const inputCls = "w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-[var(--app-text)] outline-none focus:border-[var(--app-accent-border)] text-sm";
const labelCls = "block text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-2";

type RepairContact = { name: string; phone: string; role: string };

type UserSession = {
  role?: string;
};

type PaymentPayload = {
  paymentStatus: string;
  utrNo: string;
  paymentMode: string;
  paymentDate: string;
  amount: number;
};

type RepairRequest = {
  requestId?: string;
  timestamp?: string;
  priority?: string;
  approvalStatus?: string;
  approvalNotes?: string;
  approvedAt?: string;
  approvedByName?: string;
  paymentStatus?: string;
  paidAt?: string;
  paidByName?: string;
  paymentUtrNo?: string;
  warrantyStatus?: string;
  repairRequisitionByName?: string;
  siteAddress?: string;
  itemDescription?: string;
  quantity?: number;
  repairVendorName?: string;
  expectedReturnDate?: string;
  repairStatus?: string;
  returnedByName?: string;
  dateOfReturn?: string;
  dispatchStatus?: string;
  dispatchSite?: string;
  dispatchByName?: string;
  dispatchDate?: string;
  dispatchedAt?: string;
  dispatchedByName?: string;
  deliveryStatus?: string;
  receivedBy?: string;
  receivedDate?: string;
  deliveredAt?: string;
  deliveredByName?: string;
  contacts?: RepairContact[];
  repairStatusBeforePhoto?: string;
  repairStatusAfterPhoto?: string;
  billInvoicePhoto?: string;
  paymentProofPhoto?: string;
  dispatchItemPhoto?: string;
  vendorPaymentDetailsUrl?: string;
};

type PaymentModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: PaymentPayload, file: File | null) => void;
  loading: boolean;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function PaymentModal({ open, onClose, onSubmit, loading }: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState("DONE");
  const [utrNo, setUtrNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const paymentStatusOptions: FormSelectOption<string>[] = [
    { value: "DONE", label: "Done" },
    { value: "PARTIAL", label: "Partial" },
    { value: "NOT_DONE", label: "Not Done" },
  ];
  const paymentModeOptions: FormSelectOption<string>[] = [
    { value: "UPI", label: "UPI" },
    { value: "NEFT", label: "NEFT" },
    { value: "RTGS", label: "RTGS" },
    { value: "CASH", label: "Cash" },
    { value: "CHEQUE", label: "Cheque" },
  ];
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4"><h2 className="text-lg font-semibold text-[var(--app-text)] sm:text-xl">Update Payment</h2><button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--app-accent-soft)] text-[var(--app-muted)]"><X size={20} /></button></div>
        <div className="space-y-4">
          <div><label className={labelCls}>Payment Status</label><FormSelect value={paymentStatus} options={paymentStatusOptions} onChange={setPaymentStatus} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>UTR Number *</label><input value={utrNo} onChange={(e) => setUtrNo(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Mode</label><FormSelect value={paymentMode} options={paymentModeOptions} onChange={setPaymentMode} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div><label className={labelCls}>Payment Date</label><input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Amount Paid</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Payment Proof</label><input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className={inputCls} /></div>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)]">Cancel</button>
          <button onClick={() => onSubmit({ paymentStatus, utrNo, paymentMode, paymentDate: new Date(paymentDate).toISOString(), amount: Number(amount || 0) }, file)} className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save Payment"}</button>
        </div>
      </div>
    </div>
  );
}

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<UserSession | null>(null);
  const [req, setReq] = useState<RepairRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [contacts, setContacts] = useState<RepairContact[]>([]);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [initialDispatchStatus, setInitialDispatchStatus] = useState<string | null>(null);
  const [initialDeliveryStatus, setInitialDeliveryStatus] = useState<string | null>(null);
  const [globalContacts, setGlobalContacts] = useState<ContactDefinition[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

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
        setContacts(Array.isArray(data.contacts) ? (data.contacts as RepairContact[]) : []);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateReq = (patch: Partial<RepairRequest>) => {
    setReq((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    const u = localStorage.getItem("user");
    if (u) {
      startTransition(() => {
        setUser(JSON.parse(u) as UserSession);
      });
    }
    const run = async () => {
      await loadReq();
    };
    void run();
    
    let cancelled = false;
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/contacts", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to load contacts");
        const data = await res.json();
        if (!cancelled) {
          setGlobalContacts(data);
          setLoadingContacts(false);
        }
      } catch (err) {
        if (!cancelled) setLoadingContacts(false);
      }
    };
    fetchContacts();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const saveWorkflow = async () => {
    if (!req) return;
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
          dispatchStatus: req.dispatchStatus,
          dispatchSite: req.dispatchSite,
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
    // Validate all contacts have 10-digit phones (stripping +91 for check)
    for (const c of contacts) {
      const digits = c.phone.replace("+91 ", "").replace(/\D/g, "");
      if (digits.length !== 10) {
        setToast({ type: "error", message: `Phone number for ${c.name || 'contact'} must be exactly 10 digits.` });
        return;
      }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      // Ensure all phones have the +91 prefix before saving
      const normalizedContacts = contacts.map(c => {
        const digits = c.phone.replace("+91 ", "").replace(/\D/g, "");
        return { ...c, phone: `+91 ${digits}` };
      });

      await fetch(`/api/repair-maintainance/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: normalizedContacts }),
      });
      await loadReq();
      setToast({ type: "success", message: "Contacts updated successfully." });
    } catch {
      setToast({ type: "error", message: "Failed to update guidance contacts." });
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
      updateReq({ [urlKey]: uploadedUrl } as Partial<RepairRequest>);
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
    } catch (error: unknown) {
      setToast({ type: "error", message: getErrorMessage(error, "Approval failed") });
    }
  };

  const processPayment = async () => {
    setPaymentOpen(true);
  };

  const handlePaymentSubmit = async (data: PaymentPayload, file: File | null) => {
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
          updateReq({ paymentProofPhoto: url });
          setLocalPreviews((prev) => {
            const next = { ...prev };
            delete next.paymentProofPhoto;
            return next;
          });
        }
      }

      setToast({ type: "success", message: "Payment updated successfully." });
      setPaymentOpen(false);
    } catch (error: unknown) {
      setToast({ type: "error", message: getErrorMessage(error, "Payment update failed.") });
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (v?: string) => (v ? new Date(v).toLocaleString("en-IN") : "—");
  const getDetailChipTone = (type: "approval" | "payment" | "dispatch", value?: string): StatusChipTone => {
    if (value === "SKIPPED") return "slate";
    if (type === "approval") {
      if (value === "APPROVED") return "emerald";
      if (value === "REJECTED") return "rose";
      if (value === "HOLD") return "amber";
      return "indigo";
    }
    if (type === "payment") {
      if (value === "DONE") return "emerald";
      if (value === "PARTIAL") return "amber";
      return "slate";
    }
    if (value === "DELIVERED") return "emerald";
    if (value === "DISPATCHED") return "sky";
    return "slate";
  };

  const role = String(user?.role || "").toUpperCase().trim();
  const isPurchaser = role === "PURCHASER";
  const repairStatusNorm = String(req?.repairStatus || "NOT_REPAIRED").toUpperCase().trim();
  const approvalStatusNorm = String(req?.approvalStatus || "PENDING").toUpperCase().trim();
  const paymentStatusNorm = String(req?.paymentStatus || "NOT_DONE").toUpperCase().trim();
  const warrantyStatusNorm = String(req?.warrantyStatus || "OUT_OF_WARRANTY").toUpperCase().trim();
  const isOutOfWarranty = warrantyStatusNorm === "OUT_OF_WARRANTY";
  const isAdmin = role === "ADMIN";
  const dbDispatchStatus = String(initialDispatchStatus || "NOT_DISPATCHED").toUpperCase().trim();
  const dbDeliveryStatus = String(initialDeliveryStatus || "NOT_DELIVERED").toUpperCase().trim();
  const currentDispatchStatus = String(req?.dispatchStatus || "NOT_DISPATCHED").toUpperCase().trim();

  // Master Lock: Payment is DONE or Item is DELIVERED
  const isMasterLocked = (paymentStatusNorm === "DONE" || dbDeliveryStatus === "DELIVERED") && !isAdmin;

  const isDispatchMetaLocked = (dbDispatchStatus === "DISPATCHED" || isMasterLocked) && !isAdmin;
  const isDispatchStatusLocked = (dbDispatchStatus === "DISPATCHED" || isMasterLocked) && !isAdmin;

  const isRepaired = repairStatusNorm === "REPAIRED";
  const isDispatchSelected = currentDispatchStatus !== "NOT_DISPATCHED";
  const isDispatchSaved = dbDispatchStatus !== "NOT_DISPATCHED";
  const canApprove = isRepaired && isOutOfWarranty && (role === "MANAGER" || role === "ADMIN") && approvalStatusNorm === "PENDING";
  const canPay = isRepaired && isOutOfWarranty && (role === "ACCOUNTANT" || role === "ADMIN") && approvalStatusNorm === "APPROVED" && paymentStatusNorm !== "DONE";
  const canUploadBill = !isMasterLocked && isPurchaser && isOutOfWarranty && approvalStatusNorm !== "REJECTED";
  const canUploadVendorPayment = !isMasterLocked && isPurchaser && isOutOfWarranty && approvalStatusNorm !== "REJECTED";

  const showWorkflowSave = !isMasterLocked && (dbDispatchStatus === "NOT_DISPATCHED" || dbDeliveryStatus === "NOT_DELIVERED");
  const priorityOptions: FormSelectOption<string>[] = [
    { value: "LOW", label: "Low" },
    { value: "NORMAL", label: "Normal" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];
  const warrantyOptions: FormSelectOption<string>[] = [
    { value: "IN_WARRANTY", label: "In Warranty (No Payment)" },
    { value: "OUT_OF_WARRANTY", label: "Out of Warranty (Payment Required)" },
  ];
  const repairStatusOptions: FormSelectOption<string>[] = [
    { value: "NOT_REPAIRED", label: "Not Repaired" },
    { value: "REPAIRED", label: "Repaired" },
  ];
  const dispatchStatusOptions: FormSelectOption<string>[] = [
    { value: "NOT_DISPATCHED", label: "Not Dispatched" },
    { value: "DISPATCHED", label: "Dispatched" },
  ];
  const deliveryStatusOptions: FormSelectOption<string>[] = [
    { value: "NOT_DELIVERED", label: "Not Delivered" },
    { value: "DELIVERED", label: "Delivered" },
  ];

  const vendorOptions: FormSelectOption<string>[] = globalContacts.map(c => ({
    value: c.name,
    label: c.department ? `${c.name} (${c.department})` : c.name,
  }));
  if (vendorOptions.length === 0 && !loadingContacts) {
    vendorOptions.push({ value: "", label: "No contacts found" });
  }

  const getActiveStep = () => {
    if (dbDeliveryStatus === "DELIVERED") return 4;
    if (dbDispatchStatus === "DISPATCHED") return 3;
    if (isRepaired && !isOutOfWarranty) return 2;
    if (paymentStatusNorm === "DONE") return 2;
    if (approvalStatusNorm === "APPROVED") return 1;
    if (approvalStatusNorm === "REJECTED") return 1;
    return 0;
  };

  const activeStep = getActiveStep();

  const timelineSteps = [
    { label: "Submitted", date: req?.timestamp, by: req?.repairRequisitionByName, note: `Priority: ${req?.priority || "NORMAL"}`, icon: Flag, color: "bg-indigo-500" },
    ...(isOutOfWarranty
      ? [
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
            note: req?.paymentUtrNo ? `UTR: ${req.paymentUtrNo}` : null,
            icon: IndianRupee,
            color: "bg-purple-500",
          },
        ]
      : []),
    {
      label: "Dispatch",
      date: req?.dispatchedAt || req?.dispatchDate || null,
      by: req?.dispatchedByName || req?.dispatchByName,
      note: req?.dispatchSite ? `Site: ${req.dispatchSite}` : null,
      icon: Package,
      color: "bg-blue-500",
    },
    {
      label: "Delivery",
      date: req?.deliveredAt || req?.receivedDate || null,
      by: req?.deliveredByName || req?.receivedBy,
      note: req?.receivedBy ? `Material received by ${req.receivedBy}${req.receivedDate ? ` on ${formatDate(req.receivedDate).split(',')[0]}` : ""}` : null,
      icon: Truck,
      color: "bg-emerald-500",
    },
  ];

  const timelineEvents: TimelineEvent[] = timelineSteps.map((step, i) => {
    const isDone = i <= activeStep;
    const isCurrent = i === activeStep;
    return {
      key: `${step.label}-${i}`,
      title: step.label,
      description: [step.by ? `By ${step.by}` : null, step.note].filter(Boolean).join(" - ") || "Awaiting update",
      timestamp: step.date || null,
      state:
        approvalStatusNorm === "REJECTED" && i === 1
          ? "blocked"
          : isDone
            ? "done"
            : isCurrent
              ? "current"
              : "pending",
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[var(--app-accent)]" size={32} />
      </div>
    );
  }
  if (!req) return <p className="text-[var(--app-muted)] text-center py-10">Repair request not found</p>;

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
      <Link href="/dashboard/repair-maintainance" className="inline-flex items-center gap-2 text-sm text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] transition-colors">
        <ArrowLeft size={16} /> Back to Repair & Maintenance
      </Link>

      {isMasterLocked && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-3xl bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] text-[var(--app-accent-strong)] shadow-xl shadow-[var(--app-accent)]/5 animate-fade-in-up">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] border border-[var(--app-accent-border)] text-[var(--app-accent)]">
            <Package size={20} />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wider">Case Locked</p>
            <p className="text-xs opacity-70 mt-0.5">This repair request is in read-only mode because payment is completed or the item has been delivered.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6 animate-fade-in-up">
          <div className="flex-1 min-w-0 space-y-6">
           <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1 h-12 bg-[var(--app-accent)] rounded-full blur-sm -translate-x-1/2 mt-8" />
            <div className="flex flex-wrap justify-between gap-4 mb-6">
              <div>
                <p className="text-xs text-[var(--app-muted)] uppercase tracking-wider mb-1">Request ID</p>
                <h1 className="text-2xl font-bold text-[var(--app-text)]">{req.requestId}</h1>
                <p className="text-[var(--app-muted)] text-sm mt-1">Timestamp: {formatDate(req.timestamp)}</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs">
                {isOutOfWarranty && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--app-muted)]">Approval</span>
                    <StatusChip tone={getDetailChipTone("approval", req.approvalStatus)} size="sm">
                      {req.approvalStatus || "PENDING"}
                    </StatusChip>
                  </div>
                )}
                {isOutOfWarranty && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--app-muted)]">Payment</span>
                    <StatusChip tone={getDetailChipTone("payment", req.paymentStatus)} size="sm">
                      {req.paymentStatus || "NOT_DONE"}
                    </StatusChip>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[var(--app-muted)]">Dispatch</span>
                  <StatusChip tone={getDetailChipTone("dispatch", dbDispatchStatus === "NOT_DISPATCHED" ? "NOT_DISPATCHED" : "DISPATCHED")} size="sm">
                    {dbDispatchStatus === "NOT_DISPATCHED" ? "NOT_DISPATCHED" : "DISPATCHED"}
                  </StatusChip>
                </div>
                {dbDispatchStatus !== "NOT_DISPATCHED" && (
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--app-muted)]">Delivery</span>
                    <StatusChip tone={getDetailChipTone("dispatch", dbDeliveryStatus === "DELIVERED" ? "DELIVERED" : "PENDING")} size="sm">
                      {dbDeliveryStatus === "DELIVERED" ? "DELIVERED" : "PENDING"}
                    </StatusChip>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Priority</label>
                <FormSelect disabled={isMasterLocked} value={req.priority || "NORMAL"} options={priorityOptions} onChange={(value) => updateReq({ priority: value })} />
              </div>
              <div>
                <label className={labelCls}>Repair Requisition By (Name)</label>
                <input disabled={isMasterLocked} value={req.repairRequisitionByName || ""} onChange={(e) => updateReq({ repairRequisitionByName: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Warranty Status</label>
                <FormSelect disabled={isMasterLocked} value={req.warrantyStatus || "OUT_OF_WARRANTY"} options={warrantyOptions} onChange={(value) => updateReq({ warrantyStatus: value })} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div><label className={labelCls}>Site Name & Address</label><input disabled={isMasterLocked} value={req.siteAddress || ""} onChange={(e) => updateReq({ siteAddress: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Description of Item</label><input disabled={isMasterLocked} value={req.itemDescription || ""} onChange={(e) => updateReq({ itemDescription: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Qty</label><input disabled={isMasterLocked} type="number" min={1} value={req.quantity || 1} onChange={(e) => updateReq({ quantity: Number(e.target.value) })} className={inputCls} /></div>
              <div>
                <label className={labelCls}>Name of Repair Vendor</label>
                {loadingContacts ? (
                  <div className="flex items-center px-4 py-2.5 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] text-[var(--app-muted)] text-sm">
                    <Loader2 size={16} className="animate-spin mr-2" /> Loading vendors...
                  </div>
                ) : (
                  <FormSelect
                    disabled={isMasterLocked}
                    value={req.repairVendorName || ""}
                    options={vendorOptions}
                    onChange={(value) => updateReq({ repairVendorName: value })}
                  />
                )}
              </div>
              <div>
                <label className={labelCls}>Expected Return Date</label>
                <input disabled={isMasterLocked} type="date" value={req.expectedReturnDate?.slice(0, 10) || ""} onChange={(e) => updateReq({ expectedReturnDate: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Repair Status</label>
                <FormSelect
                  disabled={isMasterLocked}
                  value={req.repairStatus || "NOT_REPAIRED"}
                  options={repairStatusOptions}
                  onChange={(value) => updateReq({ repairStatus: value })}
                />
              </div>
              {isRepaired && (
                <>
                  <div><label className={labelCls}>Returned By (Name)</label><input disabled={isMasterLocked} value={req.returnedByName || ""} onChange={(e) => updateReq({ returnedByName: e.target.value })} className={inputCls} /></div>
                  <div><label className={labelCls}>Date of Return</label><input disabled={isMasterLocked} type="date" value={req.dateOfReturn?.slice(0, 10) || ""} onChange={(e) => updateReq({ dateOfReturn: e.target.value })} className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Dispatch Status</label>
                    <FormSelect disabled={isDispatchStatusLocked} value={req.dispatchStatus || "NOT_DISPATCHED"} options={dispatchStatusOptions} onChange={(value) => updateReq({ dispatchStatus: value })} />
                  </div>
                  {isDispatchSelected && (
                    <>
                      <div><label className={labelCls}>Dispatch Site</label><input disabled={isDispatchMetaLocked} value={req.dispatchSite || ""} onChange={(e) => updateReq({ dispatchSite: e.target.value })} className={inputCls} /></div>
                      <div><label className={labelCls}>Dispatch By (Name)</label><input disabled={isDispatchMetaLocked} value={req.dispatchByName || ""} onChange={(e) => updateReq({ dispatchByName: e.target.value })} className={inputCls} /></div>
                      <div><label className={labelCls}>Dispatch Date</label><input disabled={isDispatchMetaLocked} type="date" value={req.dispatchDate?.slice(0, 10) || ""} onChange={(e) => updateReq({ dispatchDate: e.target.value })} className={inputCls} /></div>
                    </>
                  )}
                </>
              )}
            </div>

            {isDispatchSaved && (
              <div className="mt-8 pt-8 border-t border-[var(--app-border)]">
                <h3 className="text-lg font-semibold text-[var(--app-text)] mb-4">Delivery Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}>Delivery Status</label>
                    <FormSelect disabled={isMasterLocked} value={req.deliveryStatus || "NOT_DELIVERED"} options={deliveryStatusOptions} onChange={(value) => updateReq({ deliveryStatus: value })} />
                  </div>
                  <div>
                    <label className={labelCls}>Received By (Name)</label>
                    <input disabled={isMasterLocked} value={req.receivedBy || ""} onChange={(e) => updateReq({ receivedBy: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Receiving Date</label>
                    <input disabled={isMasterLocked} type="date" value={req.receivedDate?.slice(0, 10) || ""} onChange={(e) => updateReq({ receivedDate: e.target.value })} className={inputCls} />
                  </div>
                </div>
              </div>
            )}

            {showWorkflowSave && (
              <div className="mt-5">
                <button onClick={saveWorkflow} disabled={saving} className="px-4 py-2 rounded-xl bg-[var(--app-accent)] hover:bg-[var(--app-accent-hover)] text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving..." : "Save Workflow Update"}
                </button>
              </div>
            )}
          </div>

           <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6 lg:p-8 relative overflow-hidden backdrop-blur-sm">
            <div className="absolute top-0 left-0 w-1 h-12 bg-[var(--app-accent)] rounded-full blur-sm -translate-x-1/2 mt-8" />
            <h3 className="text-lg font-semibold text-[var(--app-text)] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-[var(--app-border)]" />
              Attachments
            </h3>
            <p className="text-sm text-[var(--app-muted)] mb-4">Same working style as requisition attachments and proofs.</p>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                  {isOutOfWarranty ? (
                    <>
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
                    </>
                  ) : null}
                  {isDispatchSelected && (
                    <AttachmentCard
                      title="Dispatch Item Photo"
                      url={req.dispatchItemPhoto}
                      canUpload={!isDispatchMetaLocked}
                      localUrl={localPreviews.dispatchItemPhoto}
                      onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "DISPATCH_ITEM")}
                    />
                  )}
                  {isOutOfWarranty ? (
                    <AttachmentCard
                      title="Vendor Payment Attachment"
                      url={req.vendorPaymentDetailsUrl}
                      canUpload={canUploadVendorPayment}
                      localUrl={localPreviews.vendorPaymentDetailsUrl}
                      onUpload={(e: React.ChangeEvent<HTMLInputElement>) => e.target.files?.[0] && handleUpload(e.target.files[0], "VENDOR_PAYMENT")}
                    />
                  ) : null}
                </>
              )}
            </div>
            {!isOutOfWarranty && (
              <p className="text-xs text-[var(--app-muted)] mt-4">This item is in warranty. Payment-related attachments are not required.</p>
            )}
          </div>

        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
            <div className="space-y-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 sm:p-6">
            <h3 className="text-base font-semibold text-[var(--app-text)]">Actions</h3>
            {canApprove && (
              <button onClick={() => processApproval("APPROVED")} className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm inline-flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Manager Approve
              </button>
            )}
            {!canApprove && isOutOfWarranty && (role === "MANAGER" || role === "ADMIN") && approvalStatusNorm === "PENDING" && !isRepaired && (
              <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                Approval is hidden until `Repair Status` is set to `REPAIRED`.
              </p>
            )}
            {canPay && (
              <button onClick={processPayment} className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm inline-flex items-center justify-center gap-2">
                <IndianRupee size={16} /> Update Payment
              </button>
            )}
            {!isOutOfWarranty && (
              <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                In warranty item: approval and payment steps are skipped.
              </p>
            )}
          </div>

          <StatusTimeline events={timelineEvents} />

          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-3xl p-6 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--app-text)] italic">Guidance Contacts</h3>
              {!isMasterLocked && (
                <div className="flex gap-2">
                  <FormSelect
                    placeholder="Pick Contact"
                    value=""
                    options={[
                      { value: "", label: "Select existing..." },
                      ...globalContacts.map(c => ({
                        value: JSON.stringify({ name: c.name, phone: c.phones[0] || "", role: c.role }),
                        label: `${c.name} (${c.role})`
                      }))
                    ]}
                    onChange={(val) => {
                      if (!val) return;
                      const c = JSON.parse(val);
                      setContacts((p) => [...p, c]);
                    }}
                    className="min-w-[140px]"
                  />
                  <button onClick={() => setContacts((p) => [...p, { name: "", phone: "", role: "" }])}
                    className="p-2 rounded-xl border border-[var(--app-border)] text-[var(--app-muted)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)] transition-all">
                    <Plus size={18} />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-[var(--app-muted)] mb-6 leading-relaxed">Provide key contact persons for this repair case to ensure smooth operational follow-up.</p>
            
            <div className="space-y-4">
              {contacts.length === 0 && (
                <div className="py-8 text-center rounded-2xl border border-dashed border-[var(--app-border)] bg-[var(--app-panel)]/20">
                  <User className="mx-auto text-[var(--app-muted)]/30 mb-2" size={24} />
                  <p className="text-xs text-[var(--app-muted)]/40">No contacts added yet</p>
                </div>
              )}
              {contacts.map((c, idx) => (
                <div key={idx} className="group relative p-4 rounded-2xl bg-[var(--app-panel)]/40 border border-[var(--app-border)] hover:border-[var(--app-accent-border)] hover:bg-[var(--app-panel)]/60 transition-all">
                  {!isMasterLocked && (
                    <button
                      onClick={() => setContacts((p) => p.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500/20"
                    >
                      <X size={12} />
                    </button>
                  )}
                  <div className="space-y-3">
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-[var(--app-muted)]" />
                      <input placeholder="Full Name" disabled={isMasterLocked} value={c.name}
                        onChange={(e) => setContacts((p) => p.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row)))}
                        className="w-full bg-transparent border-none pl-9 py-1 text-sm text-[var(--app-text)] outline-none placeholder:text-[var(--app-muted)]/30 font-medium" />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative flex items-center bg-slate-950/20 rounded-xl px-3 border border-white/5 focus-within:border-indigo-500/50 transition-colors group">
                        <Phone size={14} className="text-[var(--app-muted)] mr-2 shrink-0" />
                        <span className="text-[var(--app-muted)] text-xs font-mono pr-1.5 border-r border-white/10">+91</span>
                        <input 
                          placeholder="9000000000" 
                          disabled={isMasterLocked} 
                          value={c.phone.replace(/^\+91\s?/, "")}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setContacts((p) => p.map((row, i) => (i === idx ? { ...row, phone: digits } : row)));
                          }}
                          className="w-full bg-transparent border-none py-2 pl-2 text-xs text-[var(--app-muted)] outline-none placeholder:text-[var(--app-muted)]/20 font-mono tracking-tight" 
                        />
                      </div>
                      <div className="flex-1">
                        <input placeholder="Role" disabled={isMasterLocked} value={c.role}
                          onChange={(e) => setContacts((p) => p.map((row, i) => (i === idx ? { ...row, role: e.target.value } : row)))}
                          className="w-full bg-transparent border-none py-1 text-[10px] uppercase font-bold text-indigo-400 outline-none placeholder:text-slate-700 tracking-wider" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {!isMasterLocked && contacts.length > 0 && (
              <button onClick={saveContacts} disabled={saving} 
                className="w-full mt-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50">
                {saving ? "Saving Contacts..." : "Update All Contacts"}
              </button>
            )}
          </div>
        </div>
      </div>
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSubmit={handlePaymentSubmit} loading={modalLoading} />
    </div>
  );
}
