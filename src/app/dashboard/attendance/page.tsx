"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Eye,
  Image as ImageIcon,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import {
  DriverAttendanceRecord,
  formatAttendanceDate,
  getAttendanceRouteType,
  getAttendanceStatusTone,
} from "./attendance-data";
import FilterDropdown, {
  type FilterDropdownOption,
} from "@/app/dashboard/components/filter-dropdown";
import ActionIconButton from "@/app/dashboard/components/action-icon-button";
import ExportMenu from "@/app/dashboard/components/export-menu";
import {
  downloadRegisterCsv,
  openRegisterPdf,
} from "@/app/dashboard/components/export-utils";
import PageHeader from "@/app/dashboard/components/page-header";
import RegisterTableShell from "@/app/dashboard/components/register-table-shell";
import StatusChip from "@/app/dashboard/components/status-chip";
import StatCard from "@/app/dashboard/components/stat-card";

export default function AttendancePage() {
  const [rows, setRows] = useState<DriverAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | DriverAttendanceRecord["status"]
  >("ALL");
  const [routeFilter, setRouteFilter] = useState<
    "ALL" | "INTRA_CITY" | "INTER_SITE"
  >("ALL");
  const [activeStatFilter, setActiveStatFilter] = useState<
    "ALL" | DriverAttendanceRecord["status"]
  >("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/attendance", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch attendance records");
        }

        const payload = (await response.json()) as DriverAttendanceRecord[];
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

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      if (activeStatFilter !== "ALL" && row.status !== activeStatFilter) {
        return false;
      }

      if (statusFilter !== "ALL" && row.status !== statusFilter) {
        return false;
      }

      const routeType = getAttendanceRouteType(row);
      if (routeFilter !== "ALL" && routeType !== routeFilter) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        row.requestId.toLowerCase().includes(query) ||
        row.driverName.toLowerCase().includes(query) ||
        row.adminName.toLowerCase().includes(query) ||
        row.vehicleName.toLowerCase().includes(query) ||
        row.vehicleNumber.toLowerCase().includes(query) ||
        row.fromSiteName.toLowerCase().includes(query) ||
        row.toSiteName.toLowerCase().includes(query)
      );
    });
  }, [activeStatFilter, routeFilter, rows, searchQuery, statusFilter]);

  const maxPage = Math.max(0, Math.ceil(filteredRows.length / rowsPerPage) - 1);
  const currentPage = Math.min(page, maxPage);
  const paginatedRows = filteredRows.slice(
    currentPage * rowsPerPage,
    (currentPage + 1) * rowsPerPage,
  );

  const statCards = [
    {
      title: "Pending Approval",
      value: stats.pending,
      icon: Clock3,
      color: "amber",
      filter: "PENDING" as const,
    },
    {
      title: "Approved Trips",
      value: stats.approved,
      icon: CheckCircle2,
      color: "emerald",
      filter: "APPROVED" as const,
    },
    {
      title: "Rejected Entries",
      value: stats.rejected,
      icon: XCircle,
      color: "rose",
      filter: "REJECTED" as const,
    },
    {
      title: "Total Slips",
      value: stats.total,
      icon: CalendarCheck2,
      color: "purple",
      filter: "ALL" as const,
    },
  ];

  const statusOptions: FilterDropdownOption<
    "ALL" | DriverAttendanceRecord["status"]
  >[] = [
    { value: "ALL", label: "All Approval" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const routeOptions: FilterDropdownOption<"ALL" | "INTRA_CITY" | "INTER_SITE">[] = [
    { value: "ALL", label: "All Routes" },
    { value: "INTER_SITE", label: "Inter Site" },
    { value: "INTRA_CITY", label: "Intra City" },
  ];

  const visibleIds = paginatedRows.map((row) => String(row.id));
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
        filename: format === "csv" ? "attendance-register.csv" : "attendance-register.pdf",
        title: "Driver Attendance Register",
        subtitle:
          "Driver movement slips, route details, geo-tag references, and review statuses.",
        countLabel: "attendance slips",
        columns: [
          { label: "Slip ID" },
          { label: "Status" },
          { label: "Timestamp" },
          { label: "Driver Name" },
          { label: "From Site" },
          { label: "To Site" },
          { label: "Vehicle Type" },
          { label: "Vehicle Name" },
          { label: "Vehicle Number" },
          { label: "Admin Name" },
          { label: "Father Name" },
          { label: "Geo Tag Photo" },
        ],
        rows: exportSource.map((row) => [
          row.requestId,
          row.status,
          formatAttendanceDate(row.timestamp),
          row.driverName,
          row.fromSiteName,
          row.toSiteName,
          row.vehicleType,
          row.vehicleName,
          row.vehicleNumber,
          row.adminName,
          row.fatherName,
          row.geoTagPhotoUrl ? "Attached" : "Pending",
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
        title="Driver Attendance"
        subtitle="Manage movement slips, site routes, and geo-tag attendance records."
        actions={
          <>
          <ExportMenu
            exporting={exporting}
            selectedCount={selectedIds.length}
            onExportCsv={() => runExport("csv")}
            onExportPdf={() => runExport("pdf")}
          />
          <Link
            href="/dashboard/attendance/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <Plus size={16} />
            New Attendance
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
            tone={card.color}
            active={activeStatFilter === card.filter}
            onClick={() => setActiveStatFilter(card.filter)}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900/50 p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by slip ID, driver, vehicle, admin or site..."
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>
          <FilterDropdown
            label="Approval"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Route"
            value={routeFilter}
            options={routeOptions}
            onChange={setRouteFilter}
          />
          <span className="hidden items-center whitespace-nowrap px-2 text-sm text-slate-500 md:flex">
            {filteredRows.length} results
          </span>
        </div>
      </div>

      <RegisterTableShell
        title="Driver Attendance Register"
        totalCount={filteredRows.length}
        footer={
          filteredRows.length > rowsPerPage ? (
            <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-sm text-slate-400">
              <span>
                Showing {currentPage * rowsPerPage + 1}-
                {Math.min((currentPage + 1) * rowsPerPage, filteredRows.length)} of{" "}
                {filteredRows.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={currentPage === 0}
                  className="rounded-lg border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPage((current) =>
                      (current + 1) * rowsPerPage < filteredRows.length
                        ? current + 1
                        : current,
                    )
                  }
                  disabled={(currentPage + 1) * rowsPerPage >= filteredRows.length}
                  className="rounded-lg border border-white/10 px-3 py-1.5 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null
        }
      >
          <table className="w-full whitespace-nowrap text-left text-sm">
            <thead className="bg-slate-950/50 text-xs uppercase tracking-wider text-slate-500">
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
                    className="rounded border-white/10 bg-slate-800"
                  />
                </th>
                <th className="px-4 py-3">Slip ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Father&apos;s Name</th>
                <th className="px-4 py-3">Geo Tag</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-500">
                    Fetching attendance records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center italic text-slate-500">
                    No matching attendance records found
                  </td>
                </tr>
              ) : (
                paginatedRows.map((record) => (
                  <tr
                    key={record.id}
                    className={`transition-colors hover:bg-white/[0.02] ${
                      selectedIds.includes(String(record.id))
                        ? "bg-indigo-500/5"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(String(record.id))}
                        onChange={() => toggleSelect(String(record.id))}
                        className="rounded border-white/10 bg-slate-800"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-indigo-400">
                        <Link
                          href={`/dashboard/attendance/${record.id}`}
                          className="transition-colors hover:text-indigo-300"
                        >
                          {record.requestId}
                        </Link>
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={getAttendanceStatusTone(record.status)}>
                        {record.status}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      <p className="text-slate-200">
                        {formatAttendanceDate(record.timestamp)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {getAttendanceRouteType(record) === "INTER_SITE"
                          ? "Inter site"
                          : "Intra city"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">
                        {record.driverName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {record.requestId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{record.fromSiteName}</p>
                      <p className="text-xs text-slate-500">
                        To {record.toSiteName}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{record.vehicleName}</p>
                      <p className="text-xs text-slate-500">
                        {record.vehicleType} - {record.vehicleNumber}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{record.adminName}</p>
                      <p className="text-xs text-slate-500">Slip admin</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-200">{record.fatherName}</p>
                      <p className="text-xs text-slate-500">Family record</p>
                    </td>
                    <td className="px-4 py-3">
                      {record.geoTagPhotoUrl ? (
                        <StatusChip tone="emerald">
                          <ImageIcon size={12} />
                          Uploaded
                        </StatusChip>
                      ) : (
                        <StatusChip tone="amber">
                          Pending
                        </StatusChip>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {record.geoTagPhotoUrl ? (
                          <ActionIconButton
                            href={record.geoTagPhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            icon={ImageIcon}
                            label="Open geo tag photo"
                            tone="emerald"
                          />
                        ) : null}
                        <ActionIconButton
                          href={`/dashboard/attendance/${record.id}`}
                          icon={Eye}
                          label="View attendance"
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
