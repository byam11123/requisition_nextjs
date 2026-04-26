"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Send,
  Upload,
  X,
} from "lucide-react";

type SalaryAdvanceFormState = {
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  currentSalary: string;
  totalAdvanceRequest: string;
  repaymentSchedule: string;
  totalAdditionalAdvances: string;
  remarks: string;
};

export default function CreateSalaryAdvancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialSlipPhoto, setInitialSlipPhoto] = useState<File | null>(null);
  const [initialSlipPreview, setInitialSlipPreview] = useState<string | null>(null);
  const [entryTimestamp] = useState(() =>
    new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );
  const [form, setForm] = useState<SalaryAdvanceFormState>({
    employeeName: "",
    employeeCode: "",
    designation: "",
    department: "",
    currentSalary: "0",
    totalAdvanceRequest: "0",
    repaymentSchedule: "",
    totalAdditionalAdvances: "0",
    remarks: "",
  });

  const inputCls =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50";
  const disabledCls = `${inputCls} cursor-not-allowed opacity-70`;
  const labelCls =
    "mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400";

  const setField =
    (key: keyof SalaryAdvanceFormState) =>
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >,
    ) => {
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const uploadInitialSlipPhoto = async (file: File, requisitionId: string) => {
    const token = useAuthStore.getState().token;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("requisitionId", requisitionId);
    formData.append("category", "SALARY_ADVANCE_SLIP");

    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Initial slip photo upload failed");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.employeeName.trim()) {
      setError("Employee name is required.");
      return;
    }
    if (!form.employeeCode.trim()) {
      setError("Employee code is required.");
      return;
    }
    if (!form.designation.trim()) {
      setError("Designation is required.");
      return;
    }
    if (!form.department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!form.repaymentSchedule.trim()) {
      setError("Repayment schedule is required.");
      return;
    }
    if (!initialSlipPhoto) {
      setError("Initial slip photo is required.");
      return;
    }

    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch("/api/salary-advance", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeName: form.employeeName.trim(),
          employeeCode: form.employeeCode.trim(),
          designation: form.designation.trim(),
          department: form.department.trim(),
          currentSalary: Number(form.currentSalary || 0),
          totalAdvanceRequest: Number(form.totalAdvanceRequest || 0),
          repaymentSchedule: form.repaymentSchedule.trim(),
          totalAdditionalAdvances: Number(form.totalAdditionalAdvances || 0),
          remarks: form.remarks.trim(),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create salary advance request");
      }

      const created = await response.json();
      await uploadInitialSlipPhoto(initialSlipPhoto, String(created.id));
      router.push(`/dashboard/salary-advance/${created.id}`);
    } catch (submitError: unknown) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Unable to create salary advance request.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in-up">
      <Link
        href="/dashboard/salary-advance"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 transition-colors hover:text-indigo-300"
      >
        <ArrowLeft size={16} /> Back to Salary Advance
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="mb-1 text-2xl font-bold text-slate-100">
          New Salary Advance Request
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          Create the initial salary advance request first. Deduction history will
          appear only after this request is created.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-400">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Entry Timestamp</label>
              <input value={entryTimestamp} disabled className={disabledCls} />
            </div>
            <div>
              <label className={labelCls}>Request ID</label>
              <input value="Auto Generated on Submit" disabled className={disabledCls} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Employee Name *</label>
              <input
                value={form.employeeName}
                onChange={setField("employeeName")}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Employee Code *</label>
              <input
                value={form.employeeCode}
                onChange={setField("employeeCode")}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Designation *</label>
              <input
                value={form.designation}
                onChange={setField("designation")}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Department *</label>
              <input
                value={form.department}
                onChange={setField("department")}
                className={inputCls}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Current Salary</label>
              <input
                type="number"
                min="0"
                value={form.currentSalary}
                onChange={setField("currentSalary")}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Total Advance Request</label>
              <input
                type="number"
                min="0"
                value={form.totalAdvanceRequest}
                onChange={setField("totalAdvanceRequest")}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Repayment Schedule *</label>
              <input
                value={form.repaymentSchedule}
                onChange={setField("repaymentSchedule")}
                placeholder="Deduct from Feb'26 salary"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Total Additional Advances</label>
              <input
                type="number"
                min="0"
                value={form.totalAdditionalAdvances}
                onChange={setField("totalAdditionalAdvances")}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Remarks</label>
            <textarea
              value={form.remarks}
              onChange={setField("remarks")}
              rows={4}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Initial Slip Photo
            </p>
            <div className="rounded-2xl border border-dashed border-white/10 p-4">
              {initialSlipPreview ? (
                <div className="relative">
                  <Image
                    src={initialSlipPreview}
                    alt="Initial slip preview"
                    width={1200}
                    height={720}
                    className="h-60 w-full rounded-xl object-contain"
                    unoptimized
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setInitialSlipPhoto(null);
                      setInitialSlipPreview(null);
                    }}
                    className="absolute right-2 top-2 rounded-full bg-slate-800 p-1.5 text-slate-300 transition-colors hover:text-rose-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-2 text-sm text-slate-400">
                    Upload the initial salary advance slip photo
                  </p>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5">
                    <Upload size={14} /> Choose File
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        setInitialSlipPhoto(file);
                        setInitialSlipPreview(file ? URL.createObjectURL(file) : null);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-white/5 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              Submit Salary Advance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}





