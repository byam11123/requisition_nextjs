"use client";

export type SalaryAdvanceStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SalaryAdvanceDeduction = {
  id: string;
  deductionDate: string;
  deductionAmount: number;
  remark: string;
};

export type SalaryAdvanceRecord = {
  id: string;
  requestId: string;
  status: SalaryAdvanceStatus;
  entryTimestamp: string;
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  currentSalary: number;
  totalAdvanceRequest: number;
  repaymentSchedule: string;
  initialSlipPhotoUrl: string | null;
  totalAdditionalAdvances: number;
  remarks: string;
  deductionHistory: SalaryAdvanceDeduction[];
  totalDeducted: number;
  balanceAdvance: number;
  approvedAt?: string | null;
  approvedByName?: string | null;
};

export function formatSalaryAdvanceDate(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSalaryCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function getSalaryAdvanceStatusClasses(status: SalaryAdvanceStatus) {
  if (status === "APPROVED") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "REJECTED") {
    return "bg-rose-500/10 text-rose-400 border-rose-500/20";
  }
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}

export function getSalaryAdvanceStatusTone(status: SalaryAdvanceStatus) {
  if (status === "APPROVED") {
    return "emerald" as const;
  }
  if (status === "REJECTED") {
    return "rose" as const;
  }
  return "amber" as const;
}
