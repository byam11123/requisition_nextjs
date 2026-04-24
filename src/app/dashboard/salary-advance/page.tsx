"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  Eye,
  Plus,
  Search,
  WalletCards,
  XCircle,
} from "lucide-react";

import {
  SalaryAdvanceRecord,
  formatSalaryAdvanceDate,
  formatSalaryCurrency,
  getSalaryAdvanceStatusTone,
} from "./salary-advance-data";
import FilterDropdown, {
  type FilterDropdownOption,
} from "@/components/ui/filter-dropdown";
import ActionIconButton from "@/components/ui/action-icon-button";
import ExportMenu from "@/app/dashboard/components/export-menu";
import {
  downloadRegisterCsv,
  openRegisterPdf,
} from "@/app/dashboard/components/export-utils";
import PageHeader from "@/app/dashboard/components/page-header";
import RegisterTableShell from "@/app/dashboard/components/register-table-shell";
import StatusChip from "@/components/ui/status-chip";
import StatCard from "@/components/ui/stat-card";

export default function SalaryAdvancePage() {
  const [rows, setRows] = useState<SalaryAdvanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | SalaryAdvanceRecord["status"]
  >("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [activeStatFilter, setActiveStatFilter] = useState<
    "ALL" | SalaryAdvanceRecord["status"]
  >("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/salary-advance", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch salary advance records");
        }
        const payload = (await response.json()) as SalaryAdvanceRecord[];
        setRows(Array.isArray(payload) ? payload : []);
      } catch (error) {
        console.error(error);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRows();
  }, []);

  const stats = useMemo(
    () => ({
      pending: rows.filter((row) => row.status === "PENDING").length,
      approved: rows.filter((row) => row.status === "APPROVED").length,
      rejected: rows.filter((row) => row.status === "REJECTED").length,
      total: rows.length,
    }),
    [rows],
  );

  const departments = useMemo(() => {
    return Array.from(
      new Set(rows.map((row) => row.department).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (activeStatFilter !== "ALL" && row.status !== activeStatFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      if (
        departmentFilter !== "ALL" &&
        row.department.toLowerCase() !== departmentFilter.toLowerCase()
      ) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        row.requestId.toLowerCase().includes(query) ||
        row.employeeName.toLowerCase().includes(query) ||
        row.employeeCode.toLowerCase().includes(query) ||
        row.designation.toLowerCase().includes(query) ||
        row.department.toLowerCase().includes(query)
      );
    });
  }, [activeStatFilter, departmentFilter, rows, searchQuery, statusFilter]);

  const statCards = [
    {
      title: "Pending Approval",
      value: stats.pending,
      icon: Clock3,
      color: "amber",
      filter: "PENDING" as const,
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "emerald",
      filter: "APPROVED" as const,
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "rose",
      filter: "REJECTED" as const,
    },
    {
      title: "Total Requests",
      value: stats.total,
      icon: WalletCards,
      color: "purple",
      filter: "ALL" as const,
    },
  ];

  const approvalOptions: FilterDropdownOption<
    "ALL" | SalaryAdvanceRecord["status"]
  >[] = [
    { value: "ALL", label: "All Approval" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const departmentOptions: FilterDropdownOption<string>[] = [
    { value: "ALL", label: "All Departments" },
    ...departments.map((department) => ({
      value: department,
      label: department,
    })),
  ];

  const visibleIds = filteredRows.map((row) => String(row.id));
  const allVisible =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisible = visibleIds.some((id) => selectedIds.includes(id));

  const toggleSelect = (id: string) =>
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  const toggleAll = () =>
    allVisible
      ? setSelectedIds((current) =>
          current.filter((id) => !visibleIds.includes(id)),
        )
      : setSelectedIds((current) =>
          Array.from(new Set([...current, ...visibleIds])),
        );

  const runExport = async (format: "csv" | "pdf") => {
    setExporting(true);
    try {
      const exportSource =
        selectedIds.length > 0
          ? filteredRows.filter((row) => selectedIds.includes(String(row.id)))
          : filteredRows;
      const exportConfig = {
        filename:
          format === "csv"
            ? "salary-advance-register.csv"
            : "salary-advance-register.pdf",
        title: "Salary Advance Register",
        subtitle:
          "Employee advance requests, repayment balances, deduction totals, and processing status.",
        countLabel: "advance requests",
        columns: [
          { label: "Request ID" },
          { label: "Employee Name" },
          { label: "Employee Code" },
          { label: "Designation" },
          { label: "Department" },
          { label: "Advance Amount", align: "right" as const },
          { label: "Total Deducted", align: "right" as const },
          { label: "Balance Advance", align: "right" as const },
          { label: "Status" },
          { label: "Entry Timestamp" },
        ],
        rows: exportSource.map((row) => [
          row.requestId,
          row.employeeName,
          row.employeeCode,
          row.designation,
          row.department,
          formatSalaryCurrency(row.totalAdvanceRequest),
          formatSalaryCurrency(row.totalDeducted),
          formatSalaryCurrency(row.balanceAdvance),
          row.status,
          formatSalaryAdvanceDate(row.entryTimestamp),
        ]),
      };

      if (format === "csv") {
        downloadRegisterCsv(exportConfig);
      } else {
        openRegisterPdf(exportConfig);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Salary Advance"
        subtitle="Manage employee advance requests, repayment plans, and deduction history."
        actions={
          <>
          <ExportMenu
            exporting={exporting}
            selectedCount={selectedIds.length}
            onExportCsv={() => runExport("csv")}
            onExportPdf={() => runExport("pdf")}
          />
          <Link
            href="/dashboard/salary-advance/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <Plus size={16} />
            New Advance Request
          </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <StatCard
            key={card.title}
            title={card.title}
            value={card.value}
            icon={card.icon}
            tone={card.color as any}
            active={activeStatFilter === card.filter}
            onClick={() => setActiveStatFilter(card.filter)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by request ID, employee, code, designation or department..."
              className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-2.5 pl-9 pr-4 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)]/50 focus:border-[var(--app-accent-border)]"
            />
          </div>
          <FilterDropdown
            label="Approval"
            value={statusFilter}
            options={approvalOptions}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Department"
            value={departmentFilter}
            options={departmentOptions}
            onChange={setDepartmentFilter}
            minWidthClassName="min-w-0 sm:min-w-[190px]"
          />
        </div>
      </div>

      <RegisterTableShell
        title="Salary Advance Register"
        totalCount={filteredRows.length}
      >
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-[var(--app-panel)]/80 text-xs uppercase tracking-wider text-[var(--app-muted)]">
              <tr>
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisible}
                    ref={(element) => {
                      if (element) {
                        element.indeterminate = someVisible && !allVisible;
                      }
                    }}
                    onChange={toggleAll}
                    className="rounded border-[var(--app-border-strong)] bg-[var(--app-bg-secondary)]"
                  />
                </th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Advance</th>
                <th className="px-4 py-3">Deducted</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    Fetching salary advance records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center italic text-slate-500">
                    No salary advance records found
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => toggleSelect(String(row.id))}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.02] ${
                      selectedIds.includes(String(row.id))
                        ? "bg-indigo-500/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(String(row.id))}
                        onChange={() => toggleSelect(String(row.id))}
                        className="rounded border-[var(--app-border)] bg-[var(--app-panel)]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/salary-advance/${row.id}`}
                        className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        {row.requestId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--app-text)]">{row.employeeName}</p>
                      <p className="text-xs text-[var(--app-muted)]">{row.employeeCode}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--app-text)]">{row.department}</p>
                      <p className="text-xs text-[var(--app-muted)]">{row.designation}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">
                      {formatSalaryCurrency(row.totalAdvanceRequest)}
                    </td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">
                      {formatSalaryCurrency(row.totalDeducted)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--app-text)]">
                      {formatSalaryCurrency(row.balanceAdvance)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={getSalaryAdvanceStatusTone(row.status)}>
                        {row.status}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3 text-[var(--app-muted)]">
                      {formatSalaryAdvanceDate(row.entryTimestamp)}
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ActionIconButton
                          href={`/dashboard/salary-advance/${row.id}`}
                          icon={Eye}
                          label="View salary advance"
                          tone="indigo"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
      </RegisterTableShell>
    </div>
  );
}
