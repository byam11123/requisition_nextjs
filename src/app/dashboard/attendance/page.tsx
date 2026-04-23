"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Download,
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
  getAttendanceStatusClasses,
} from "./attendance-data";

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

  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  };

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

  const exportRows = async () => {
    setExporting(true);
    try {
      const exportSource =
        selectedIds.length > 0
          ? filteredRows.filter((row) => selectedIds.includes(String(row.id)))
          : filteredRows;
      const csvRows = [
        [
          "Status",
          "Timestamp",
          "Slip ID",
          "Driver Name",
          "From Site",
          "To Site",
          "Vehicle Type",
          "Vehicle Name",
          "Vehicle Number",
          "Admin Name",
          "Father Name",
          "Geo Tag Photo",
        ],
        ...exportSource.map((row) => [
          row.status,
          formatAttendanceDate(row.timestamp),
          row.requestId,
          row.driverName,
          row.fromSiteName,
          row.toSiteName,
          row.vehicleType,
          row.vehicleName,
          row.vehicleNumber,
          row.adminName,
          row.fatherName,
          row.geoTagPhotoUrl || "",
        ]),
      ];

      const csvContent = csvRows
        .map((columns) =>
          columns
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "attendance-register.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Driver Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage movement slips, site routes, and geo-tag attendance records.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportRows}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            <Download size={16} />
            {selectedIds.length > 0
              ? `Export (${selectedIds.length})`
              : "Export All"}
          </button>
          <Link
            href="/dashboard/attendance/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <Plus size={16} />
            New Attendance
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => (
          <button
            key={card.title}
            onClick={() => setActiveStatFilter(card.filter)}
            className={`flex items-center justify-between rounded-xl border p-4 transition-all hover:scale-[1.01] ${
              activeStatFilter === card.filter
                ? colorMap[card.color]
                : "border-white/5 bg-slate-900/50 hover:border-white/10"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`inline-flex rounded-lg p-2 ${colorMap[card.color]}`}>
                <card.icon size={18} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {card.title}
              </p>
            </div>
            <p className="text-2xl font-bold text-slate-100">{card.value}</p>
          </button>
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
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "ALL" | DriverAttendanceRecord["status"],
              )
            }
            className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-300 outline-none transition-colors focus:border-indigo-500/50"
          >
            <option value="ALL">All Approval</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
          <select
            value={routeFilter}
            onChange={(event) =>
              setRouteFilter(
                event.target.value as "ALL" | "INTRA_CITY" | "INTER_SITE",
              )
            }
            className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-300 outline-none transition-colors focus:border-indigo-500/50"
          >
            <option value="ALL">All Routes</option>
            <option value="INTER_SITE">Inter Site</option>
            <option value="INTRA_CITY">Intra City</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between border-b border-white/5 p-5">
          <h2 className="text-lg font-semibold text-slate-100">
            Attendance Register
          </h2>
          <span className="text-xs text-slate-500">
            {filteredRows.length} total results
          </span>
        </div>
        <div className="overflow-x-auto">
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Slip ID</th>
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
                filteredRows.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => toggleSelect(String(record.id))}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.02] ${
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
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getAttendanceStatusClasses(
                          record.status,
                        )}`}
                      >
                        {record.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatAttendanceDate(record.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-indigo-400">
                        {record.requestId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">
                        {record.driverName}
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
                    <td className="px-4 py-3 text-slate-300">
                      {record.adminName}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {record.fatherName}
                    </td>
                    <td className="px-4 py-3">
                      {record.geoTagPhotoUrl ? (
                        <Link
                          href={record.geoTagPhotoUrl}
                          target="_blank"
                          className="inline-flex items-center gap-2 text-xs text-indigo-400 transition-colors hover:text-indigo-300"
                        >
                          <ImageIcon size={14} />
                          View Photo
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-500">Pending Upload</span>
                      )}
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        {record.geoTagPhotoUrl ? (
                          <Link
                            href={record.geoTagPhotoUrl}
                            target="_blank"
                            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-indigo-500/10 hover:text-indigo-400"
                          >
                            <Eye size={16} />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
