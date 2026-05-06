"use client";

import { use, useEffect, useState } from "react";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
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
} from "lucide-react";

import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  canRunRequisitionWorkflowStep,
  getEnabledRequisitionWorkflowSteps,
  getRequisitionWorkflowStep,
  isRequisitionWorkflowStepComplete,
} from "@/lib/config/requisition-workflow-config";
import StatusTimeline, { type TimelineEvent } from "@/modules/common/components/status-timeline";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoField } from "@/app/dashboard/components/detail-info";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import FormSelect, {
  type FormSelectOption,
} from "@/components/ui/form-select";
import PaymentModal from "@/modules/common/components/payment-modal";
import WorkflowActionCard, { type WorkflowAction } from "@/modules/common/components/workflow-action-card";

type ApprovalModalProps = {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (status: string, notes: string) => void;
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

function ApprovalModal({ open, loading, onClose, onSubmit }: ApprovalModalProps) {
  const [status, setStatus] = useState("APPROVED");
  const [notes, setNotes] = useState("");
  const approvalOptions: FormSelectOption<string>[] = [
    { value: "APPROVED", label: "Approve" },
    { value: "REJECTED", label: "Reject" },
    { value: "HOLD", label: "Hold" },
    { value: "TO_REVIEW", label: "To Review" },
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:p-6 lg:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100 sm:text-xl">Process Approval</h2>
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
            <FormSelect
              value={status}
              options={approvalOptions}
              onChange={setStatus}
            />
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

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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



export default function ViewRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, token } = useAuthStore();
  const [req, setReq] = useState<RequisitionRecord | null>(null);
  const [workflowConfig, setWorkflowConfig] = useState(DEFAULT_REQUISITION_WORKFLOW_CONFIG);
  const [loading, setLoading] = useState(true);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);


  const loadReq = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
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
    if (!token) return;

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
  }, [id, token]);

  const role = user?.role;
  const actorRoleKey = user?.customRoleKey || role;
  const isPurchaser = role === "PURCHASER";
  const isAdmin = role === "ADMIN";
  const enabledWorkflowSteps = getEnabledRequisitionWorkflowSteps(workflowConfig);
  const paymentStep = getRequisitionWorkflowStep(workflowConfig, "payment");

  const approvalAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "approval",
        roleKey: actorRoleKey,
        userId: user?.id,
        record: req,
      })
    : { allowed: false, reason: null };
  const paymentAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "payment",
        roleKey: actorRoleKey,
        userId: user?.id,
        record: req,
      })
    : { allowed: false, reason: null };
  const dispatchAccess = req
    ? canRunRequisitionWorkflowStep({
        config: workflowConfig,
        key: "dispatch",
        roleKey: actorRoleKey,
        userId: user?.id,
        record: req,
      })
    : { allowed: false, reason: null };

  const isFinalized = req?.approvalStatus === "APPROVED" || req?.approvalStatus === "REJECTED";

  // Lock uploads after the request is finalized (Approved/Rejected)
  const canUploadBill = !isFinalized && (isAdmin || isPurchaser);
  const canUploadMaterial = !isFinalized && (isAdmin || isPurchaser);
  const canUploadVendorPayment = !isFinalized && (isAdmin || (isPurchaser && Boolean(paymentStep?.enabled) && req?.paymentStatus !== "DONE"));

  const workflowActions: WorkflowAction[] = [
    {
      label: getRequisitionWorkflowStep(workflowConfig, "approval")?.label || "Approval",
      icon: CheckCircle,
      onClick: () => setApprovalOpen(true),
      variant: 'purple',
      show: Boolean(approvalAccess.allowed)
    },
    {
      label: getRequisitionWorkflowStep(workflowConfig, "payment")?.label || "Payment",
      icon: IndianRupee,
      onClick: () => setPaymentOpen(true),
      variant: 'emerald',
      show: Boolean(paymentAccess.allowed)
    },
    {
      label: getRequisitionWorkflowStep(workflowConfig, "dispatch")?.label || "Dispatch",
      icon: Package,
      onClick: () => setDispatchModalOpen(true),
      variant: 'sky',
      show: Boolean(dispatchAccess.allowed)
    }
  ];

  const hasActions = approvalAccess.allowed || paymentAccess.allowed || dispatchAccess.allowed;

  const handleApproval = async (status: string, notes: string) => {
    setModalLoading(true);
    try {
      const token = useAuthStore.getState().token;
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
      const token = useAuthStore.getState().token;
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
          headers: { Authorization: `Bearer ${token || useAuthStore.getState().token}` },
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
    setModalLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/requisitions/${id}/dispatch`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error || "Dispatch failed");
      }
      await loadReq();
      setDispatchModalOpen(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Dispatch failed");
    } finally {
      setModalLoading(false);
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
      const token = useAuthStore.getState().token;
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

  const timelineEvents: TimelineEvent[] = timelineSteps.map((step, index) => {
    const isDone = Boolean(step.done);
    const state =
      req.approvalStatus === "REJECTED" && step.key === "approval"
        ? "blocked"
        : isDone
          ? "done"
          : index === timelineSteps.findIndex((item) => !item.done)
            ? "current"
            : "pending";

    return {
      key: step.key,
      title: step.label,
      description: [step.by ? `By ${step.by}` : null, step.note].filter(Boolean).join(" - ") || "Awaiting update",
      timestamp: step.date,
      state,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/requisition"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} />
        Back to Requisition
      </Link>

      <ConfirmationModal
        isOpen={dispatchModalOpen}
        onClose={() => setDispatchModalOpen(false)}
        onConfirm={handleDispatch}
        title="Dispatch Requisition"
        message="Are you sure you want to mark this requisition as dispatched? This will update the inventory and notify the requester."
        confirmLabel="Yes, Dispatch Now"
        tone="info"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
          <div className="min-w-0 flex-1 space-y-6">
           <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
                  Requisition ID
                </p>
                <h1 className="text-2xl font-bold text-slate-100">{req.requestId}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className={statusColor(req.approvalStatus || '')}>{req.approvalStatus}</span>
                <span className={statusColor(req.paymentStatus || '')}>{req.paymentStatus}</span>
                <span className={statusColor(req.dispatchStatus || '')}>{req.dispatchStatus}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
              <DetailInfoField label="Material Description" value={req.materialDescription} />
              <DetailInfoField label="Quantity" value={req.quantity} />
              <DetailInfoField label="Priority" value={req.priority} />
              <DetailInfoField label="Site Address" value={req.siteAddress} />
              <DetailInfoField
                label="Amount"
                value={
                  req.amount != null ? `INR ${Number(req.amount).toLocaleString("en-IN")}` : null
                }
              />
              <DetailInfoField label="Created By" value={req.createdByName || req.createdBy?.fullName} />
              <DetailInfoField label="Required For" value={req.requiredFor} />
              <DetailInfoField label="Vendor" value={req.vendorName} />
              <DetailInfoField label="PO Details" value={req.poDetails} />
              <DetailInfoField label="Indent No" value={req.indentNo} />
              {(req.approvedByName || req.approvedBy?.fullName) ? (
                <DetailInfoField label="Approved By" value={req.approvedByName || req.approvedBy?.fullName} />
              ) : null}
              {(req.paidByName || req.paidBy?.fullName) ? (
                <DetailInfoField label="Paid By" value={req.paidByName || req.paidBy?.fullName} />
              ) : null}
              {(req.dispatchedByName || req.dispatchedBy?.fullName) ? (
                <DetailInfoField
                  label="Dispatched By"
                  value={req.dispatchedByName || req.dispatchedBy?.fullName}
                />
              ) : null}
              {req.paymentUtrNo ? <DetailInfoField label="UTR No" value={req.paymentUtrNo} /> : null}
              {req.paymentMode ? <DetailInfoField label="Payment Mode" value={req.paymentMode} /> : null}
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

           <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-100">Attachments</h3>
             <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
             <AttachmentCard
                title="Material Proof"
                url={req.materialPhotoUrl}
                localUrl={localPreviews.materialPhotoUrl}
                canUpload={canUploadMaterial}
                onUpload={(event) => handleFileUpload(event, "material")}
              />
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
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <WorkflowActionCard actions={workflowActions} loading={modalLoading} />
          <StatusTimeline events={timelineEvents} />
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
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePayment}
        initialAmount={Number(req.amount || 0)}
      />
    </div>
  );
}
