"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  requestedAmount: string;
  requestType: "Initial" | "Additional";
  repaymentSchedule: string;
  remarks: string;
};

export default function CreateSalaryAdvancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [initialSlipPhoto, setInitialSlipPhoto] = useState<File | null>(null);
  const [initialSlipPreview, setInitialSlipPreview] = useState<string | null>(null);
  const [form, setForm] = useState<SalaryAdvanceFormState>({
    employeeName: "",
    employeeCode: "",
    designation: "",
    department: "",
    currentSalary: "0",
    requestedAmount: "0",
    requestType: "Initial",
    repaymentSchedule: "",
    remarks: "",
  });
  const [users, setUsers] = useState<any[]>([]);
  const [approverId, setApproverId] = useState("");
  const [payerId, setPayerId] = useState("");

  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const token = useAuthStore.getState().token;
        const [usersRes, defaultsRes] = await Promise.all([
          fetch("/api/users", { headers: { Authorization: `Bearer ${token}` } }),
          fetch("/api/workflow-defaults?module=SALARY_ADVANCE", { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (usersRes.ok) setUsers(await usersRes.json());
        if (defaultsRes.ok) {
          const defaults = await defaultsRes.json();
          if (defaults?.defaultApproverId) setApproverId(defaults.defaultApproverId);
          if (defaults?.defaultPayerId) setPayerId(defaults.defaultPayerId);
        }
      } catch (err) {
        console.error("Failed to load defaults", err);
      }
    };
    loadDefaults();
  }, []);

  // Auto-detect request type based on employee code
  useEffect(() => {
    if (form.employeeCode.length >= 3) {
      const checkHistory = async () => {
        try {
          const token = useAuthStore.getState().token;
          const res = await fetch(`/api/salary-advance/history?employeeCode=${form.employeeCode}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const history = await res.json();
            if (history && history.length > 0) {
              const last = history[0];
              setForm(prev => ({ 
                ...prev, 
                requestType: "Additional",
                employeeName: last.employee_name || prev.employeeName,
                designation: last.designation || prev.designation,
                department: last.department || prev.department,
                currentSalary: String(last.current_salary || prev.currentSalary)
              }));
            } else {
              setForm(prev => ({ ...prev, requestType: "Initial" }));
            }
          }
        } catch (err) {
          console.error("Failed to check history", err);
        }
      };
      const timer = setTimeout(checkHistory, 500);
      return () => clearTimeout(timer);
    }
  }, [form.employeeCode]);

  const inputCls =
    "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50";
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

  const uploadSlipPhoto = async (file: File, requisitionId: string) => {
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
      const response = await fetch("/api/salary-advance/requests", {
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
          requestedAmount: Number(form.requestedAmount || 0),
          requestType: form.requestType,
          repaymentSchedule: form.repaymentSchedule.trim(),
          remarks: form.remarks.trim(),
          approverId: approverId || null,
          payerId: payerId || null,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create salary advance request");
      }

      const created = await response.json();
      await uploadSlipPhoto(initialSlipPhoto, String(created.id));
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
              <label className={labelCls}>Requested Amount *</label>
              <input
                type="number"
                min="0"
                value={form.requestedAmount}
                onChange={setField("requestedAmount")}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Request Type *</label>
              <select
                value={form.requestType}
                onChange={(e) => setForm(prev => ({ ...prev, requestType: e.target.value as any }))}
                className={inputCls}
                required
              >
                <option value="Initial">Initial Request (First Time)</option>
                <option value="Additional">Additional Request (Top-up)</option>
              </select>
              <p className="mt-1.5 text-[10px] text-slate-500 uppercase tracking-wider">
                {form.requestType === 'Initial' ? 'New employee advance account' : 'Adding to existing balance'}
              </p>
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
              <label className={labelCls}>Current Salary</label>
              <input
                type="number"
                min="0"
                value={form.currentSalary}
                onChange={setField("currentSalary")}
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

          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Workflow Assignment
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <label className={labelCls}>Assigned Approver *</label>
                <select value={approverId} onChange={e => setApproverId(e.target.value)} className={inputCls} required>
                  <option value="">Select Approver</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                </select>
                <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wider">Approval Step</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/50 border border-white/5">
                <label className={labelCls}>Assigned Payer *</label>
                <select value={payerId} onChange={e => setPayerId(e.target.value)} className={inputCls} required>
                  <option value="">Select Payer</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>)}
                </select>
                <p className="mt-2 text-[10px] text-slate-500 uppercase tracking-wider">Payment Step</p>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Slip Photo
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
                    Upload the salary advance slip photo
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
