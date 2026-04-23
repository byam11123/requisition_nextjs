"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  Fuel,
  Plus,
  ReceiptText,
  Search,
  XCircle,
} from "lucide-react";

import {
  formatFuelQuantity,
  formatVehicleFuelDate,
  formatVehicleFuelShortDate,
  getVehicleFuelBillStatus,
  getVehicleFuelStatusTone,
  VehicleFuelRecord,
} from "./vehicle-fuel-data";
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

export default function VehicleFuelPage() {
  const [rows, setRows] = useState<VehicleFuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | VehicleFuelRecord["status"]
  >("ALL");
  const [fuelTypeFilter, setFuelTypeFilter] = useState<
    "ALL" | VehicleFuelRecord["fuelType"]
  >("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeStatFilter, setActiveStatFilter] = useState<
    "ALL" | VehicleFuelRecord["status"]
  >("ALL");

  useEffect(() => {
    const fetchRows = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("/api/vehicle-fuel", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch vehicle fuel records");
        }

        const payload = (await response.json()) as VehicleFuelRecord[];
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
      completed: rows.filter((row) => row.status === "COMPLETED").length,
      rejected: rows.filter((row) => row.status === "REJECTED").length,
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

      if (fuelTypeFilter !== "ALL" && row.fuelType !== fuelTypeFilter) {
        return false;
      }

      const query = searchQuery.trim().toLowerCase();
      if (!query) {
        return true;
      }

      return (
        row.requestId.toLowerCase().includes(query) ||
        row.vehicleType.toLowerCase().includes(query) ||
        row.rcNo.toLowerCase().includes(query) ||
        row.requestedByName.toLowerCase().includes(query) ||
        row.fuelType.toLowerCase().includes(query)
      );
    });
  }, [activeStatFilter, fuelTypeFilter, rows, searchQuery, statusFilter]);

  const statCards = [
    {
      title: "Pending Approval",
      value: stats.pending,
      icon: ReceiptText,
      color: "amber",
      filter: "PENDING" as const,
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: CheckCircle2,
      color: "sky",
      filter: "APPROVED" as const,
    },
    {
      title: "Completed",
      value: stats.completed,
      icon: Fuel,
      color: "emerald",
      filter: "COMPLETED" as const,
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: XCircle,
      color: "rose",
      filter: "REJECTED" as const,
    },
  ];

  const statusOptions: FilterDropdownOption<
    "ALL" | VehicleFuelRecord["status"]
  >[] = [
    { value: "ALL", label: "All Status" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "COMPLETED", label: "Completed" },
    { value: "REJECTED", label: "Rejected" },
  ];

  const fuelTypeOptions: FilterDropdownOption<
    "ALL" | VehicleFuelRecord["fuelType"]
  >[] = [
    { value: "ALL", label: "All Fuel Types" },
    { value: "PETROL", label: "Petrol" },
    { value: "DIESEL", label: "Diesel" },
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
            ? "vehicle-fuel-register.csv"
            : "vehicle-fuel-register.pdf",
        title: "Vehicle Daily Fuel Register",
        subtitle:
          "Daily diesel and petrol requests, meter readings, approval status, and bill completion.",
        countLabel: "fuel requests",
        columns: [
          { label: "Request ID" },
          { label: "Vehicle Type" },
          { label: "Fuel Type" },
          { label: "RC No" },
          { label: "Last Purchase Date" },
          { label: "Last Issued Qty", align: "right" as const },
          { label: "Last Reading", align: "right" as const },
          { label: "Current Reading", align: "right" as const },
          { label: "Total Running", align: "right" as const },
          { label: "Current Requirement", align: "right" as const },
          { label: "Status" },
          { label: "Bill Status" },
        ],
        rows: exportSource.map((row) => [
          row.requestId,
          row.vehicleType,
          row.fuelType,
          row.rcNo,
          formatVehicleFuelShortDate(row.lastPurchaseDate),
          formatFuelQuantity(row.lastIssuedQtyLitres),
          row.lastReading,
          row.currentReading,
          row.totalRunning,
          formatFuelQuantity(row.currentRequirementLitres),
          row.status,
          getVehicleFuelBillStatus(row),
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
        title="Vehicle Daily Fuel"
        subtitle="Track daily diesel and petrol requests, reading slips, approvals, and bill uploads."
        actions={
          <>
          <ExportMenu
            exporting={exporting}
            selectedCount={selectedIds.length}
            onExportCsv={() => runExport("csv")}
            onExportPdf={() => runExport("pdf")}
          />
          <Link
            href="/dashboard/vehicle-fuel/create"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500"
          >
            <Plus size={16} />
            New Vehicle Fuel
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
              placeholder="Search by request ID, vehicle, RC number, requester or fuel type..."
              className="w-full rounded-xl border border-white/5 bg-slate-950/50 py-2.5 pl-9 pr-4 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 focus:border-indigo-500/50"
            />
          </div>
          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={setStatusFilter}
          />
          <FilterDropdown
            label="Fuel Type"
            value={fuelTypeFilter}
            options={fuelTypeOptions}
            onChange={setFuelTypeFilter}
          />
        </div>
      </div>

      <RegisterTableShell
        title="Vehicle Fuel Register"
        totalCount={filteredRows.length}
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
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">RC No</th>
                <th className="px-4 py-3">Last Purchase</th>
                <th className="px-4 py-3">Running</th>
                <th className="px-4 py-3">Requirement</th>
                <th className="px-4 py-3">Bill</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    Fetching vehicle fuel records...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center italic text-slate-500">
                    No vehicle fuel requests found
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
                        className="rounded border-white/10 bg-slate-800"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/vehicle-fuel/${row.id}`}
                        className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
                      >
                        {row.requestId}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200">{row.vehicleType}</p>
                      <p className="text-xs text-slate-500">{row.fuelType}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{row.rcNo}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatVehicleFuelShortDate(row.lastPurchaseDate)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-100">{row.totalRunning} KM/Hrs</p>
                      <p className="text-xs text-slate-500">
                        {row.lastReading} to {row.currentReading}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {formatFuelQuantity(row.currentRequirementLitres)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={row.billPhotoUrl ? "emerald" : "amber"}>
                        {getVehicleFuelBillStatus(row)}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={getVehicleFuelStatusTone(row.status)}>
                        {row.status}
                      </StatusChip>
                    </td>
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-slate-500">
                          {formatVehicleFuelDate(row.entryTimestamp)}
                        </span>
                        <ActionIconButton
                          href={`/dashboard/vehicle-fuel/${row.id}`}
                          icon={Eye}
                          label="View vehicle fuel request"
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
