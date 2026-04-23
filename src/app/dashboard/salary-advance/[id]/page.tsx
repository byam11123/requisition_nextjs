"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  Plus,
  ReceiptText,
  WalletCards,
  X,
} from "lucide-react";

import {
  SalaryAdvanceDeduction,
  SalaryAdvanceRecord,
  formatSalaryAdvanceDate,
  formatSalaryCurrency,
  getSalaryAdvanceStatusClasses,
} from "../salary-advance-data";

const labelCls =
  "text-xs font-semibold uppercase tracking-wider text-slate-500";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-6">
      <p className={labelCls}>{label}</p>
      <div className="text-slate-100">{value}</div>
    </div>
  );
}

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
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Add Deduction</h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deduction Date
            </label>
            <input
              type="date"
              value={deductionDate}
              onChange={(event) => setDeductionDate(event.target.value)}
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Deduction Amount
            </label>
            <input
              type="number"
              min="0"
              value={deductionAmount}
              onChange={(event) => setDeductionAmount(event.target.value)}
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Remark
            </label>
            <input
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors focus:border-indigo-500/50"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:bg-white/5"
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

export default function SalaryAdvanceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [record, setRecord] = useState<SalaryAdvanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/salary-advance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Salary Advance
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wider text-slate-500">
              Request ID
            </p>
            <h1 className="text-2xl font-bold text-slate-100">{record.requestId}</h1>
            <p className="mt-1 text-sm text-slate-400">
              Entry Timestamp: {formatSalaryAdvanceDate(record.entryTimestamp)}
            </p>
          </div>
          <span
            className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${getSalaryAdvanceStatusClasses(
              record.status,
            )}`}
          >
            {record.status}
          </span>
        </div>

        <div className="mb-8 rounded-2xl border border-white/5 bg-slate-950/30">
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
            <div className="flex items-center gap-2">
              <ReceiptText size={18} className="text-slate-300" />
              <h2 className="text-lg font-semibold text-slate-100">
                Deduction History
              </h2>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
                {record.deductionHistory.length}
              </span>
            </div>
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm">
              <thead className="border-b border-white/5 text-xs uppercase tracking-wider text-slate-500">
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
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No deduction entries yet. Add deductions only after the
                      request is created.
                    </td>
                  </tr>
                ) : (
                  record.deductionHistory.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 text-slate-300">
                        {formatSalaryAdvanceDate(entry.deductionDate)}
                      </td>
                      <td className="px-6 py-4 text-slate-100">
                        {formatSalaryCurrency(entry.deductionAmount)}
                      </td>
                      <td className="px-6 py-4 text-slate-300">{entry.remark}</td>
                      <td className="px-6 py-4 text-right text-slate-500">
                        <ChevronRight size={16} className="ml-auto" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <DetailRow
            label="Balance Advance"
            value={formatSalaryCurrency(record.balanceAdvance)}
          />
          <DetailRow
            label="Total Deducted"
            value={formatSalaryCurrency(record.totalDeducted)}
          />
          <DetailRow
            label="Total Advance Request"
            value={formatSalaryCurrency(record.totalAdvanceRequest)}
          />
          <DetailRow
            label="Total Additional Advances"
            value={formatSalaryCurrency(record.totalAdditionalAdvances)}
          />
          <DetailRow
            label="Initial Slip Photo"
            value={
              record.initialSlipPhotoUrl ? (
                <div className="rounded-xl border border-white/5 bg-white p-3 w-fit">
                  <Image
                    src={record.initialSlipPhotoUrl}
                    alt="Initial slip"
                    width={140}
                    height={180}
                    className="h-auto w-[120px] object-contain"
                    unoptimized
                  />
                </div>
              ) : (
                <span className="text-slate-500">Not uploaded</span>
              )
            }
          />
          <DetailRow label="Employee Name" value={record.employeeName} />
          <DetailRow label="Employee Code" value={record.employeeCode} />
          <DetailRow label="Designation" value={record.designation} />
          <DetailRow label="Department" value={record.department} />
          <DetailRow label="Current Salary" value={formatSalaryCurrency(record.currentSalary)} />
          <DetailRow label="Repayment Schedule" value={record.repaymentSchedule} />
          <DetailRow label="Remarks" value={record.remarks || "-"} />
          <DetailRow
            label="Request Summary"
            value={
              <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                <WalletCards size={14} />
                {record.requestId}
              </div>
            }
          />
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
