"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Flag,
  IndianRupee,
  Loader2,
  Package,
  Upload,
  X,
  ZoomIn,
} from "lucide-react";

import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  canRunRequisitionWorkflowStep,
  getEnabledRequisitionWorkflowSteps,
  getRequisitionWorkflowStep,
  isRequisitionWorkflowStepComplete,
} from "@/lib/requisition-workflow-config";

type ApprovalModalProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (status: string, notes: string) => void;
};

type PaymentModalProps = {
  open: boolean;
  loading: boolean;
  amount: number;
  onClose: () => void;
  onSubmit: (payload: Record<string, unknown>, file: File | null) => void;
};

type DashboardUser = {
  role?: string;
  customRoleKey?: string;
};

type RequisitionRecord = {
  id?: string | number;
  requestId?: string;
  createdAt?: string;
  createdByName?: string;
  approvedAt?: string;
  approvedByName?: string;
  paidAt?: string;
  paidByName?: string;
  dispatchedAt?: string;
  dispatchedByName?: string;
  createdBy?: { fullName?: string };
  approvedBy?: { fullName?: string };
  paidBy?: { fullName?: string };
  dispatchedBy?: { fullName?: string };
  approvalStatus?: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  approvalNotes?: string;
  paymentUtrNo?: string;
  paymentMode?: string;
  materialDescription?: string;
  quantity?: number | string;
  priority?: string;
  siteAddress?: string;
  amount?: number | string;
  requiredFor?: string;
  vendorName?: string;
  poDetails?: string;
  indentNo?: string;
  description?: string;
  billPhotoUrl?: string | null;
  vendorPaymentDetailsUrl?: string | null;
  paymentPhotoUrl?: string | null;
  materialPhotoUrl?: string | null;
  [key: string]: unknown;
};

function AttachmentCard({
  title,
  url,
  localUrl,
  onUpload,
  canUpload,
}: {
  title: string;
  url?: string | null;
  localUrl?: string | null;
  onUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  canUpload?: boolean;
}) {
  const displayUrl = localUrl || url;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-white/5 p-3">
      <p className="text-center text-xs font-medium text-slate-500">{title}</p>
      {displayUrl ? (
        <button
          type="button"
          className="group relative h-24 overflow-hidden rounded-xl bg-slate-950/50"
          onClick={() => window.open(displayUrl, "_blank")}
        >
          <Image
            src={displayUrl}
            alt={title}
            fill
            unoptimized
            className="object-contain transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <ZoomIn size={18} className="text-white" />
          </div>
        </button>
      ) : (
        <div className="flex h-24 items-center justify-center rounded-xl bg-slate-950/30 text-xs text-slate-600">
          No file
        </div>
      )}

      {canUpload ? (
        <label className="flex cursor-pointer items-center justify-center gap-1 text-xs text-slate-500 transition-colors hover:text-indigo-400">
          <Upload size={12} />
          {displayUrl ? "Replace" : "Upload"}
          <input
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={onUpload}
          />
        </label>
      ) : null}
    </div>
  );
}

function ApprovalModal({ open, loading, onClose, onSubmit }: ApprovalModalProps) {
  const [status, setStatus] = useState("APPROVED");
  const [notes, setNotes] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Process Approval</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Decision
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50"
            >
              <option value="APPROVED">Approve</option>
              <option value="REJECTED">Reject</option>
              <option value="HOLD">Hold</option>
              <option value="TO_REVIEW">To Review</option>
            </select>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Notes
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full resize-none rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
              placeholder="Optional comments..."
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-slate-400 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSubmit(status, notes.trim())}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-indigo-500"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : status}
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  open,
  loading,
  amount,
  onClose,
  onSubmit,
}: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState("DONE");
  const [utrNo, setUtrNo] = useState("");
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paidAmount, setPaidAmount] = useState(amount || 0);
  const [file, setFile] = useState<File | null>(null);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Update Payment</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Payment Status
            </label>
            <select
              value={paymentStatus}
              onChange={(event) => setPaymentStatus(event.target.value)}
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50"
            >
              <option value="DONE">Done</option>
              <option value="PARTIAL">Partial</option>
              <option value="NOT_DONE">Not Done</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              value={utrNo}
              onChange={(event) => setUtrNo(event.target.value)}
              placeholder="UTR Number"
              className="rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
            />
            <select
              value={paymentMode}
              onChange={(event) => setPaymentMode(event.target.value)}
              className="rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
            >
              <option value="UPI">UPI</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              className="rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
            />
            <input
              type="number"
              value={paidAmount}
              onChange={(event) => setPaidAmount(Number(event.target.value))}
              className="rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50"
              placeholder="Amount"
            />
          </div>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm text-slate-400 transition-colors hover:border-indigo-500/30 hover:text-slate-200">
            <Upload size={14} />
            {file ? file.name : "Upload Payment Proof"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-slate-400 transition-colors hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSubmit(
                {
                  paymentStatus,
                  utrNo,
                  paymentMode,
                  paymentDate: new Date(paymentDate).toISOString(),
                  amount: paidAmount,
                },
                file,
              )
            }
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-emerald-500"
          >
            {loading ? <Loader2 size={16} className="mx-auto animate-spin" /> : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="text-slate-200">{value || "-"}</p>
    </div>
  );
}

export default function ViewRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [user] = useState<DashboardUser | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as DashboardUser;
    } catch {
      return null;
    }
  });
  const [req, setReq] = useState<RequisitionRecord | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState(DEFAULT_REQUISITION_WORKFLOW_CONFIG);
  const [loading, setLoading] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const loadReq = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setReq(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem("token");

      void (async () => {
        setLoading(true);
        try {
          const [reqRes, workflowRes] = await Promise.all([
            fetch(`/api/requisitions/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch("/api/workflow-config/requisition", {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (reqRes.ok) {
            setReq(await reqRes.json());
          }

          if (workflowRes.ok) {
            setWorkflowConfig(await workflowRes.json());
          }
        } finally {
          setLoading(false);
        }
      })();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [id]);

  const role = user?.role;
  const actorRoleKey = user?.customRoleKey || role;
  const isPurchaser = role === "PURCHASER";
  const enabledWorkflowSteps = getEnabledRequisitionWorkflowSteps(workflowConfig);
  const paymentStep = getRequisitionWorkflowStep(workflowConfig, "payment");

  const approvalAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "approval",
        roleKey: actorRoleKey,
        record: req,
      })
    : { allowed: false, reason: null };
  const paymentAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "payment",
        roleKey: actorRoleKey,
        record: req,
      })
    : { allowed: false, reason: null };
  const dispatchAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "dispatch",
        roleKey: actorRoleKey,
        record: req,
      })
    : { allowed: false, reason: null };

  const canUploadBill =
    isPurchaser && req?.approvalStatus !== "APPROVED" && req?.approvalStatus !== "REJECTED";
  const canUploadMaterial =
    isPurchaser && req?.approvalStatus !== "APPROVED" && req?.approvalStatus !== "REJECTED";
  const canUploadVendorPayment =
    isPurchaser &&
    Boolean(paymentStep?.enabled) &&
    req?.paymentStatus !== "DONE" &&
    req?.approvalStatus !== "REJECTED";

  const hasActions =
    approvalAccess.allowed || paymentAccess.allowed || dispatchAccess.allowed;

  const handleApproval = async (status: string, notes: string) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approvalStatus: status, notes }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Approval failed");
      }
      await loadReq();
      setApprovalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Approval failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handlePayment = async (payload: Record<string, unknown>, file: File | null) => {
    setModalLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/payment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const response = await res.json();
        throw new Error(response.error || "Payment update failed");
      }

      await loadReq();

      if (file) {
        const blobUrl = URL.createObjectURL(file);
        setLocalPreviews((prev) => ({ ...prev, paymentPhotoUrl: blobUrl }));
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", "PAYMENT");
        formData.append("requisitionId", id);
        const uploadRes = await fetch("/api/uploads", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          setLocalPreviews((prev) => ({ ...prev, paymentPhotoUrl: url }));
          setReq((prev) => (prev ? { ...prev, paymentPhotoUrl: url } : prev));
        }
      }

      setPaymentOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Payment update failed");
    } finally {
      setModalLoading(false);
    }
  };

  const handleDispatch = async () => {
    if (!window.confirm("Mark this requisition as dispatched?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/requisitions/${id}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Dispatch failed");
      }
      await loadReq();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dispatch failed");
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "bill" | "material" | "vendor_payment",
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const urlKey =
      type === "bill"
        ? "billPhotoUrl"
        : type === "material"
          ? "materialPhotoUrl"
          : "vendorPaymentDetailsUrl";
    const category = type === "vendor_payment" ? "VENDOR_PAYMENT" : type.toUpperCase();
    const blobUrl = URL.createObjectURL(file);

    setLocalPreviews((prev) => ({ ...prev, [urlKey]: blobUrl }));

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);
      formData.append("requisitionId", id);
      const res = await fetch("/api/uploads", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) {
        const { url } = await res.json();
        setLocalPreviews((prev) => {
          const next = { ...prev };
          delete next[urlKey];
          return next;
        });
        setReq((prev) => (prev ? { ...prev, [urlKey]: url } : prev));
      }
    } catch {
      alert("Upload failed");
    }

    event.target.value = "";
  };

  const formatDate = (value?: string) => {
    if (!value) {
      return "";
    }

    const date = new Date(value.endsWith("Z") ? value : `${value}Z`);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!req) {
    return <p className="py-12 text-center text-slate-400">Requisition not found</p>;
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      APPROVED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      REJECTED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      HOLD: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      TO_REVIEW: "bg-sky-500/10 text-sky-400 border-sky-500/20",
      DONE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      NOT_DONE: "bg-slate-500/10 text-slate-400 border-slate-500/20",
      DISPATCHED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      NOT_DISPATCHED: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };

    return `inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${map[status] || "bg-slate-500/10 text-slate-400 border-slate-500/20"}`;
  };

  const timelineSteps = [
    {
      key: "create",
      label: "Created",
      date: req.createdAt,
      by: req.createdByName || req.createdBy?.fullName,
      note: null,
      icon: Flag,
      color: "bg-indigo-500",
      done: true,
    },
    ...enabledWorkflowSteps.map((step) => {
      if (step.key === "approval") {
        return {
          key: step.key,
          label: step.label,
          date: req.approvedAt,
          by: req.approvedByName || req.approvedBy?.fullName,
          note:
            req.approvalStatus && req.approvalStatus !== "PENDING"
              ? `${req.approvalStatus}${req.approvalNotes ? ` - ${req.approvalNotes}` : ""}`
              : step.description,
          icon: CheckCircle,
          color:
            req.approvalStatus === "REJECTED"
              ? "bg-rose-500"
              : req.approvalStatus === "HOLD"
                ? "bg-amber-500"
                : req.approvalStatus === "TO_REVIEW"
                  ? "bg-sky-500"
                  : "bg-emerald-500",
          done: req.approvalStatus && req.approvalStatus !== "PENDING",
        };
      }

      if (step.key === "payment") {
        return {
          key: step.key,
          label: step.label,
          date: req.paidAt,
          by: req.paidByName || req.paidBy?.fullName,
          note: req.paymentUtrNo
            ? `UTR: ${req.paymentUtrNo} - ${req.paymentMode || ""}`
            : step.description,
          icon: IndianRupee,
          color: "bg-purple-500",
          done: isRequisitionWorkflowStepComplete(req, "payment"),
        };
      }

      return {
        key: step.key,
        label: step.label,
        date: req.dispatchedAt,
        by: req.dispatchedByName || req.dispatchedBy?.fullName,
        note: step.description,
        icon: Package,
        color: "bg-blue-500",
        done: isRequisitionWorkflowStepComplete(req, "dispatch"),
      };
    }),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Requisition ID
                </p>
                <h1 className="text-2xl font-bold text-slate-100">{req.requestId}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={statusColor(req.approvalStatus)}>{req.approvalStatus}</span>
                <span className={statusColor(req.paymentStatus)}>{req.paymentStatus}</span>
                <span className={statusColor(req.dispatchStatus)}>{req.dispatchStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              <InfoField label="Material Description" value={req.materialDescription} />
              <InfoField label="Quantity" value={req.quantity} />
              <InfoField label="Priority" value={req.priority} />
              <InfoField label="Site Address" value={req.siteAddress} />
              <InfoField
                label="Amount"
                value={
                  req.amount != null ? `INR ${Number(req.amount).toLocaleString("en-IN")}` : null
                }
              />
              <InfoField label="Created By" value={req.createdByName || req.createdBy?.fullName} />
              <InfoField label="Required For" value={req.requiredFor} />
              <InfoField label="Vendor" value={req.vendorName} />
              <InfoField label="PO Details" value={req.poDetails} />
              <InfoField label="Indent No" value={req.indentNo} />
              {(req.approvedByName || req.approvedBy?.fullName) ? (
                <InfoField label="Approved By" value={req.approvedByName || req.approvedBy?.fullName} />
              ) : null}
              {(req.paidByName || req.paidBy?.fullName) ? (
                <InfoField label="Paid By" value={req.paidByName || req.paidBy?.fullName} />
              ) : null}
              {(req.dispatchedByName || req.dispatchedBy?.fullName) ? (
                <InfoField
                  label="Dispatched By"
                  value={req.dispatchedByName || req.dispatchedBy?.fullName}
                />
              ) : null}
              {req.paymentUtrNo ? <InfoField label="UTR No" value={req.paymentUtrNo} /> : null}
              {req.paymentMode ? <InfoField label="Payment Mode" value={req.paymentMode} /> : null}
              {req.description ? (
                <div className="col-span-full">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Additional Notes
                  </p>
                  <p className="whitespace-pre-wrap text-slate-200">{req.description}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Attachments</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <AttachmentCard
                title="Bill / Invoice"
                url={req.billPhotoUrl}
                localUrl={localPreviews.billPhotoUrl}
                canUpload={canUploadBill}
                onUpload={(event) => handleFileUpload(event, "bill")}
              />
              <AttachmentCard
                title="Vendor Payment"
                url={req.vendorPaymentDetailsUrl}
                localUrl={localPreviews.vendorPaymentDetailsUrl}
                canUpload={canUploadVendorPayment}
                onUpload={(event) => handleFileUpload(event, "vendor_payment")}
              />
              <AttachmentCard
                title="Payment Proof"
                url={req.paymentPhotoUrl}
                localUrl={localPreviews.paymentPhotoUrl}
              />
              <AttachmentCard
                title="Material Proof"
                url={req.materialPhotoUrl}
                localUrl={localPreviews.materialPhotoUrl}
                canUpload={canUploadMaterial}
                onUpload={(event) => handleFileUpload(event, "material")}
              />
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="mb-3 text-base font-semibold text-slate-100">Actions</h3>
            <div className="space-y-3">
              {approvalAccess.allowed ? (
                <button
                  type="button"
                  onClick={() => setApprovalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-500"
                >
                  <CheckCircle size={16} />
                  {getRequisitionWorkflowStep(workflowConfig, "approval")?.label || "Approval"}
                </button>
              ) : null}

              {paymentAccess.allowed ? (
                <button
                  type="button"
                  onClick={() => setPaymentOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  <IndianRupee size={16} />
                  {getRequisitionWorkflowStep(workflowConfig, "payment")?.label || "Payment"}
                </button>
              ) : null}

              {dispatchAccess.allowed ? (
                <button
                  type="button"
                  onClick={handleDispatch}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-500"
                >
                  <Package size={16} />
                  {getRequisitionWorkflowStep(workflowConfig, "dispatch")?.label || "Dispatch"}
                </button>
              ) : null}

              {!hasActions ? (
                <p className="text-sm text-slate-500">
                  This requisition has no pending actions for your role under the active workflow.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
            <h3 className="mb-6 text-base font-semibold text-slate-100">Status Timeline</h3>
            <div className="ml-3">
              {timelineSteps.map((step) => {
                const done = Boolean(step.done);
                return (
                  <div
                    key={step.key}
                    className={`relative border-l pb-8 pl-8 last:pb-0 ${
                      done ? "border-white/10" : "border-white/5"
                    }`}
                  >
                    <div
                      className={`absolute -left-[17px] top-0 flex h-8 w-8 items-center justify-center rounded-full border-4 border-slate-950 ${
                        done ? step.color : "bg-slate-800"
                      }`}
                    >
                      <step.icon size={14} className="text-white" />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${done ? "text-slate-200" : "text-slate-600"}`}>
                        {step.label}
                      </h4>
                      {step.date ? <p className="mt-0.5 text-xs text-slate-400">{formatDate(step.date)}</p> : null}
                      {step.by ? <p className="text-xs text-slate-500">By {step.by}</p> : null}
                      {step.note ? <p className="mt-0.5 text-xs text-slate-500">{step.note}</p> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <ApprovalModal
        open={approvalOpen}
        loading={modalLoading}
        onClose={() => setApprovalOpen(false)}
        onSubmit={handleApproval}
      />
      <PaymentModal
        open={paymentOpen}
        loading={modalLoading}
        amount={Number(req.amount || 0)}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePayment}
      />
    </div>
  );
}
