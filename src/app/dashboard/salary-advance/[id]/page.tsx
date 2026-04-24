"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  X,
  XCircle,
} from "lucide-react";

import StatusTimeline, { type TimelineEvent } from "@/app/dashboard/status-timeline";
import AttachmentCard from "@/app/dashboard/components/attachment-card";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";

import {
  SalaryAdvanceDeduction,
  SalaryAdvanceRecord,
  formatSalaryAdvanceDate,
  formatSalaryCurrency,
  getSalaryAdvanceStatusTone,
} from "../salary-advance-data";
import StatusChip from "@/components/ui/status-chip";

function AddDeductionModal({
  open,
  loading,
  onClose,
  onSubmit,
}: {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onSubmit: (entry: SalaryAdvanceDeduction) => Promise<void>;
}) {
  const [deductionDate, setDeductionDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [deductionAmount, setDeductionAmount] = useState("0");
  const [remark, setRemark] = useState("");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-5 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[var(--app-text)]">Add Deduction</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--app-muted)] transition-colors hover:bg-[var(--app-accent-soft)]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Deduction Date
            </label>
            <input
              type="date"
              value={deductionDate}
              onChange={(event) => setDeductionDate(event.target.value)}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-accent-border)]"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Deduction Amount
            </label>
            <input
              type="number"
              min="0"
              value={deductionAmount}
              onChange={(event) => setDeductionAmount(event.target.value)}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-accent-border)]"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
              Remark
            </label>
            <input
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 text-sm text-[var(--app-text)] outline-none transition-colors focus:border-[var(--app-accent-border)]"
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-[var(--app-border)] px-4 py-2.5 text-sm text-[var(--app-muted)] transition-colors hover:bg-[var(--app-accent-soft)]"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onSubmit({
                id: `DED-${Date.now()}`,
                deductionDate: new Date(deductionDate).toISOString(),
                deductionAmount: Number(deductionAmount || 0),
                remark: remark.trim(),
              })
            }
            disabled={loading}
            className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Deduction"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStoredRole() {
  if (typeof window === "undefined") return "";
  const rawUser = localStorage.getItem("user");
  if (!rawUser) return "";
  try {
    const parsed = JSON.parse(rawUser) as { role?: string };
    return String(parsed.role || "").toUpperCase().trim();
  } catch {
    return "";
  }
}

export default function SalaryAdvanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<SalaryAdvanceRecord | null>(null);
  const [userRole] = useState(() => getStoredRole());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleApproval = async (status: "APPROVED" | "REJECTED") => {
    setActionLoading(status);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/salary-advance/${id}/approve`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Salary advance approval failed");
      }

      const updated = (await response.json()) as Pick<
        SalaryAdvanceRecord,
        "status" | "approvedAt" | "approvedByName"
      >;
      setRecord((current) =>
        current
          ? {
              ...current,
              status: updated.status,
              approvedAt: updated.approvedAt || null,
              approvedByName: updated.approvedByName || null,
            }
          : current,
      );
      setToast({
        type: "success",
        message: status === "APPROVED" ? "Advance approved." : "Advance rejected.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error instanceof Error ? error.message : "Approval failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const fetchRecord = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/salary-advance/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch salary advance detail");
        }

        const payload = (await response.json()) as SalaryAdvanceRecord;
        setRecord(payload);
      } catch (error) {
        console.error(error);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  const addDeduction = async (entry: SalaryAdvanceDeduction) => {
    if (!record) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/salary-advance/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deductionHistory: [...record.deductionHistory, entry],
          totalAdvanceRequest: record.totalAdvanceRequest,
          totalAdditionalAdvances: record.totalAdditionalAdvances,
          repaymentSchedule: record.repaymentSchedule,
          remarks: record.remarks,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save deduction");
      }

      const payload = (await response.json()) as SalaryAdvanceRecord;
      setRecord(payload);
      setModalOpen(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!record) {
    return (
      <p className="py-12 text-center text-slate-400">
        Salary advance record not found
      </p>
    );
  }

  const timelineEvents: TimelineEvent[] = [
    {
      key: "created",
      title: "Advance Request Created",
      description: `${record.employeeName} raised a salary advance request for ${formatSalaryCurrency(record.totalAdvanceRequest)}.`,
      timestamp: record.entryTimestamp,
      state: "done",
    },
    {
      key: "approval",
      title:
        record.status === "APPROVED"
          ? "Advance Approved"
          : record.status === "REJECTED"
            ? "Advance Rejected"
            : "Awaiting Approval",
      description:
        record.status === "APPROVED"
          ? `Approved by ${record.approvedByName || "the reviewing team"}.`
          : record.status === "REJECTED"
            ? `Rejected by ${record.approvedByName || "the reviewing team"}.`
            : "This salary advance is still pending approval.",
      timestamp: record.approvedAt || null,
      state:
        record.status === "APPROVED"
          ? "done"
          : record.status === "REJECTED"
            ? "blocked"
            : "current",
    },
    {
      key: "deduction",
      title:
        record.deductionHistory.length > 0
          ? "Deduction Tracking Started"
          : "Deduction Not Started",
      description:
        record.deductionHistory.length > 0
          ? `${record.deductionHistory.length} deduction entries have been logged against this advance.`
          : "No deduction entries have been recorded yet.",
      timestamp:
        record.deductionHistory.length > 0
          ? record.deductionHistory[record.deductionHistory.length - 1]?.deductionDate
          : null,
      state: record.deductionHistory.length > 0 ? "done" : "pending",
    },
  ];

  const canReview = userRole === "MANAGER" && record.status === "PENDING";

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      {toast && (
        <div
          className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-2.5 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
        >
          {toast.message}
        </div>
      )}
      <Link
        href="/dashboard/salary-advance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Salary Advance
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-[var(--app-muted)]">
                  Request ID
                </p>
                <h1 className="text-2xl font-bold text-[var(--app-text)]">{record.requestId}</h1>
                <p className="mt-1 text-sm text-[var(--app-muted)]">
                  Entry Timestamp: {formatSalaryAdvanceDate(record.entryTimestamp)}
                </p>
              </div>
              <StatusChip tone={getSalaryAdvanceStatusTone(record.status)} size="sm">
                {record.status}
              </StatusChip>
            </div>

            <div className="space-y-6">
              <DetailInfoRow
                label="Balance Advance"
                value={formatSalaryCurrency(record.balanceAdvance)}
              />
              <DetailInfoRow
                label="Total Deducted"
                value={formatSalaryCurrency(record.totalDeducted)}
              />
              <DetailInfoRow
                label="Total Advance Request"
                value={formatSalaryCurrency(record.totalAdvanceRequest)}
              />
              <DetailInfoRow
                label="Total Additional Advances"
                value={formatSalaryCurrency(record.totalAdditionalAdvances)}
              />
              <DetailInfoRow
                label="Initial Slip Photo"
                value={
                  <div className="w-[150px]">
                    <AttachmentCard
                      title="Initial Slip"
                      url={record.initialSlipPhotoUrl}
                      emptyLabel="Not uploaded"
                      previewClassName="h-44"
                      imageClassName="object-contain bg-white"
                    />
                  </div>
                }
              />
              <DetailInfoRow label="Employee Name" value={record.employeeName} />
              <DetailInfoRow label="Employee Code" value={record.employeeCode} />
              <DetailInfoRow label="Designation" value={record.designation} />
              <DetailInfoRow label="Department" value={record.department} />
              <DetailInfoRow label="Current Salary" value={formatSalaryCurrency(record.currentSalary)} />
              <DetailInfoRow label="Repayment Schedule" value={record.repaymentSchedule} />
              <DetailInfoRow label="Remarks" value={record.remarks || "-"} />
              <DetailInfoRow label="Approved By" value={record.approvedByName || "-"} />
              <DetailInfoRow
                label="Approved At"
                value={record.approvedAt ? formatSalaryAdvanceDate(record.approvedAt) : "-"}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--app-border)] px-6 py-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={18} className="text-[var(--app-muted)]" />
                <h2 className="text-lg font-semibold text-[var(--app-text)]">
                  Deduction History
                </h2>
                <span className="rounded-full bg-[var(--app-accent-soft)] px-2 py-0.5 text-[10px] text-[var(--app-accent-strong)]">
                  {record.deductionHistory.length}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] px-3 py-2 text-sm text-[var(--app-muted)] transition-colors hover:bg-[var(--app-accent-soft)]"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-sm">
                <thead className="border-b border-[var(--app-border)] text-xs uppercase tracking-wider text-[var(--app-muted)]">
                  <tr>
                    <th className="px-6 py-3">Deduction Date</th>
                    <th className="px-6 py-3">Deduction Amount</th>
                    <th className="px-6 py-3">Remark</th>
                    <th className="px-6 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {record.deductionHistory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-[var(--app-muted)]">
                        No deduction entries yet. Add deductions only after the
                        request is created.
                      </td>
                    </tr>
                  ) : (
                    record.deductionHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[var(--app-panel)]/40 transition-colors">
                        <td className="px-6 py-4 text-[var(--app-muted)]">
                          {formatSalaryAdvanceDate(entry.deductionDate)}
                        </td>
                        <td className="px-6 py-4 text-[var(--app-text)] font-medium">
                          {formatSalaryCurrency(entry.deductionAmount)}
                        </td>
                        <td className="px-6 py-4 text-[var(--app-muted)]">{entry.remark}</td>
                        <td className="px-6 py-4 text-right text-[var(--app-muted)]">
                          <ChevronRight size={16} className="ml-auto" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full shrink-0 space-y-6 lg:w-80">
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
            <h3 className="mb-4 text-base font-semibold text-[var(--app-text)]">Actions</h3>
            {canReview ? (
              <div className="space-y-3">
                <button
                  onClick={() => handleApproval("APPROVED")}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CheckCircle2 size={16} />
                  {actionLoading === "APPROVED" ? "Approving..." : "Approve Advance"}
                </button>
                <button
                  onClick={() => handleApproval("REJECTED")}
                  disabled={actionLoading !== null}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <XCircle size={16} />
                  {actionLoading === "REJECTED" ? "Rejecting..." : "Reject Advance"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-[var(--app-muted)]">
                {record.status === "PENDING"
                  ? "Only managers can approve or reject salary advances."
                  : "Advance review has already been completed."}
              </p>
            )}
          </div>

          <StatusTimeline events={timelineEvents} />
        </div>
      </div>

      <AddDeductionModal
        open={modalOpen}
        loading={saving}
        onClose={() => setModalOpen(false)}
        onSubmit={addDeduction}
      />
    </div>
  );
}
