"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Trash2, Plus, Eye, Wrench, Truck,
  Clock, ReceiptText
} from 'lucide-react';
import FilterDropdown, {
  type FilterDropdownOption,
} from '@/app/dashboard/components/filter-dropdown';
import ActionIconButton from '@/app/dashboard/components/action-icon-button';
import ExportMenu from '@/app/dashboard/components/export-menu';
import {
  downloadRegisterCsv,
  openRegisterPdf,
} from '@/app/dashboard/components/export-utils';
import PageHeader from '@/app/dashboard/components/page-header';
import RegisterTableShell from '@/app/dashboard/components/register-table-shell';
import StatusChip, {
  type StatusChipTone,
} from '@/app/dashboard/components/status-chip';
import StatCard from '@/app/dashboard/components/stat-card';

type DashboardUser = {
  role?: string;
};

type RepairRow = {
  id: string | number;
  requestId?: string;
  warrantyStatus?: string;
  priority?: string;
  itemDescription?: string;
  siteAddress?: string;
  repairVendorName?: string;
  repairRequisitionByName?: string;
  approvalStatus?: string;
  paymentStatus?: string;
  dispatchStatus?: string;
  deliveryStatus?: string;
  timestamp?: string;
};

function getStoredUser(): DashboardUser | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem('user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as DashboardUser;
  } catch {
    return null;
  }
}

function isInWarrantyRepair(row: RepairRow) {
  return String(row.warrantyStatus || "OUT_OF_WARRANTY").toUpperCase().trim() === "IN_WARRANTY";
}

function getRepairApprovalDisplay(row: RepairRow) {
  return isInWarrantyRepair(row) ? "SKIPPED" : row.approvalStatus || "PENDING";
}

function getRepairPaymentDisplay(row: RepairRow) {
  return isInWarrantyRepair(row) ? "SKIPPED" : row.paymentStatus || "NOT_DONE";
}

export default function RepairDashboard() {
  const [user] = useState<DashboardUser | null>(() => getStoredUser());
  const [rows, setRows] = useState<RepairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeStatFilter, setActiveStatFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const loadRows = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/repair-maintainance', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const payload = (await res.json()) as RepairRow[];
          setRows(Array.isArray(payload) ? payload : []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadRows();
  }, []);

  const stats = useMemo(() => ({
    pending: rows.filter(r => !isInWarrantyRepair(r) && r.approvalStatus === 'PENDING').length,
    approved: rows.filter(r => (isInWarrantyRepair(r) || r.approvalStatus === 'APPROVED') && (r.dispatchStatus === 'NOT_DISPATCHED' || r.deliveryStatus === 'NOT_DELIVERED')).length,
    inTransit: rows.filter(r => r.dispatchStatus === 'DISPATCHED' && r.deliveryStatus === 'NOT_DELIVERED').length,
    total: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    let f = [...rows];
    // Shortcut filters from stat cards
    if (activeStatFilter === 'PENDING') f = f.filter(r => getRepairApprovalDisplay(r) === 'PENDING');
    else if (activeStatFilter === 'APPROVED') f = f.filter(r => getRepairApprovalDisplay(r) === 'APPROVED' || getRepairApprovalDisplay(r) === 'SKIPPED');
    else if (activeStatFilter === 'TRANSIT') f = f.filter(r => r.dispatchStatus === 'DISPATCHED' && r.deliveryStatus === 'NOT_DELIVERED');

    // Text search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r =>
        r.requestId?.toLowerCase().includes(q) ||
        r.itemDescription?.toLowerCase().includes(q) ||
        r.siteAddress?.toLowerCase().includes(q) ||
        r.repairVendorName?.toLowerCase().includes(q) ||
        r.repairRequisitionByName?.toLowerCase().includes(q)
      );
    }

    // Dropdown filters
    if (approvalFilter !== 'ALL') f = f.filter(r => getRepairApprovalDisplay(r) === approvalFilter);
    if (priorityFilter !== 'ALL') f = f.filter(r => r.priority === priorityFilter);

    return f;
  }, [rows, searchQuery, approvalFilter, priorityFilter, activeStatFilter]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const visibleIds = paginated.map((r) => String(r.id));
  const allVisible = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const someVisible = visibleIds.some(id => selectedIds.includes(id));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    allVisible
      ? setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
      : setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected repair requests?`)) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      // For now, we reuse the pattern but note that we might need a specific repair bulk delete endpoint if it differs
      await fetch('/api/repair-maintainance/bulk-delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      const res = await fetch('/api/repair-maintainance', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const payload = (await res.json()) as RepairRow[];
        setRows(Array.isArray(payload) ? payload : []);
      }
    } catch {
      alert('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const exportSource =
        selectedIds.length > 0
          ? filtered.filter((row) => selectedIds.includes(String(row.id)))
          : filtered;
      const exportConfig = {
        filename: format === 'csv' ? 'repair-register.csv' : 'repair-register.pdf',
        title: 'Repair & Maintenance Register',
        subtitle:
          'Breakdown requests, repair workflow status, payment progress, dispatch, and delivery tracking.',
        countLabel: 'repair cases',
        columns: [
          { label: 'Job ID' },
          { label: 'Priority' },
          { label: 'Item Description' },
          { label: 'Site Address' },
          { label: 'Requested By' },
          { label: 'Approval Status' },
          { label: 'Payment Status' },
          { label: 'Dispatch Status' },
          { label: 'Delivery Status' },
          { label: 'Timestamp' },
        ],
        rows: exportSource.map((row) => [
          row.requestId,
          row.priority,
          row.itemDescription || '',
          row.siteAddress || '',
          row.repairRequisitionByName || '',
          getRepairApprovalDisplay(row),
          getRepairPaymentDisplay(row),
          row.dispatchStatus || '',
          row.deliveryStatus || '',
          formatDate(row.timestamp),
        ]),
      };

      if (format === 'csv') {
        downloadRegisterCsv(exportConfig);
      } else {
        openRegisterPdf(exportConfig);
      }
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (val: string) => {
    if (!val) return '-';
    const d = new Date(val.endsWith('Z') ? val : val + 'Z');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const getPriorityTone = (priority: string): StatusChipTone => {
    if (priority === 'URGENT') return 'rose';
    if (priority === 'HIGH') return 'amber';
    if (priority === 'LOW') return 'sky';
    return 'slate';
  };

  const getStatusTone = (status: string): StatusChipTone => {
    if (status === 'SKIPPED') return 'slate';
    if (status === 'APPROVED') return 'emerald';
    if (status === 'PENDING') return 'amber';
    if (status === 'REJECTED') return 'rose';
    if (status === 'HOLD') return 'orange';
    if (status === 'DELIVERED') return 'indigo';
    if (status === 'DISPATCHED') return 'sky';
    return 'slate';
  };

  const statData = [
    { title: 'Pending Approval', value: stats.pending, icon: Clock, color: 'amber', filter: 'PENDING' as const },
    { title: 'Active Jobs', value: stats.approved, icon: Wrench, color: 'emerald', filter: 'APPROVED' as const },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, color: 'sky', filter: 'TRANSIT' as const },
    { title: 'Total Cases', value: stats.total, icon: ReceiptText, color: 'purple', filter: 'ALL' as const },
  ];

  const approvalOptions: FilterDropdownOption<string>[] = [
    { value: 'ALL', label: 'All Approval' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'SKIPPED', label: 'Skipped' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'HOLD', label: 'Hold' },
  ];

  const priorityOptions: FilterDropdownOption<string>[] = [
    { value: 'ALL', label: 'All Priority' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'HIGH', label: 'High' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'LOW', label: 'Low' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <PageHeader
        title="Repair & Maintenance"
        subtitle="Manage breakdown requests and equipment servicing."
        actions={
          <>
          {selectedIds.length > 0 && user?.role === 'ADMIN' && (
            <button onClick={handleBulkDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50">
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
            </button>
          )}
          <ExportMenu
            exporting={exporting}
            selectedCount={selectedIds.length}
            onExportCsv={() => handleExport('csv')}
            onExportPdf={() => handleExport('pdf')}
          />
          <Link href="/dashboard/repair-maintainance/create"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> New Request
          </Link>
          </>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statData.map(s => (
          <StatCard key={s.filter}
            title={s.title}
            value={s.value}
            icon={s.icon}
            tone={s.color}
            active={activeStatFilter === s.filter}
            onClick={() => setActiveStatFilter(s.filter)} />
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, item, site, vendor or person..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-200 placeholder:text-slate-600" />
          </div>
          <FilterDropdown
            label="Approval"
            value={approvalFilter}
            options={approvalOptions}
            onChange={setApprovalFilter}
          />
          <FilterDropdown
            label="Priority"
            value={priorityFilter}
            options={priorityOptions}
            onChange={setPriorityFilter}
          />
        </div>
      </div>

      {/* Table Section */}
      <RegisterTableShell
        title="Repair & Maintenance Register"
        totalCount={filtered.length}
        footer={
          filtered.length > rowsPerPage ? (
            <div className="flex justify-between items-center p-4 border-t border-white/5 text-sm text-slate-400 bg-slate-950/20">
              <span>Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length} requests</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(p => (p + 1) * rowsPerPage < filtered.length ? p + 1 : p)} disabled={(page + 1) * rowsPerPage >= filtered.length}
                  className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40">Next</button>
              </div>
            </div>
          ) : null
        }
      >
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allVisible} ref={el => { if (el) el.indeterminate = someVisible && !allVisible; }}
                    onChange={toggleAll} className="rounded border-white/10 bg-slate-800" />
                </th>
                <th className="px-4 py-3">Job ID</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Item & Site</th>
                <th className="px-4 py-3">Requested By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Dispatch</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-slate-500">Fetching repair cases...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 italic">No matching records found</td>
                </tr>
              ) : paginated.map((row) => {
                const id = String(row.id);
                const selected = selectedIds.includes(id);
                return (
                  <tr key={id} onClick={() => toggleSelect(id)}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selected ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected} onChange={() => toggleSelect(id)}
                        className="rounded border-white/10 bg-slate-800" />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Link href={`/dashboard/repair-maintainance/${id}`}
                        className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2 transition-colors">
                        {row.requestId}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusChip tone={getPriorityTone(row.priority)}>{row.priority}</StatusChip></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200 truncate max-w-48">{row.itemDescription || 'Untitled Item'}</p>
                      <p className="text-slate-500 text-xs">{row.siteAddress || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{row.repairRequisitionByName || '-'}</p>
                      <p className="text-slate-500 text-xs">{formatDate(row.timestamp)}</p>
                    </td>
                    <td className="px-4 py-3"><StatusChip tone={getStatusTone(getRepairApprovalDisplay(row))}>{getRepairApprovalDisplay(row)}</StatusChip></td>
                    <td className="px-4 py-3"><StatusChip tone={getStatusTone(getRepairPaymentDisplay(row))}>{getRepairPaymentDisplay(row)}</StatusChip></td>
                    <td className="px-4 py-3">
                      <StatusChip tone={getStatusTone(row.dispatchStatus || 'NOT_DISPATCHED')}>{row.dispatchStatus}</StatusChip>
                    </td>
                    <td className="px-4 py-3">
                      <StatusChip tone={getStatusTone(row.deliveryStatus || 'NOT_DELIVERED')}>{row.deliveryStatus}</StatusChip>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ActionIconButton
                          href={`/dashboard/repair-maintainance/${id}`}
                          icon={Eye}
                          label="View repair request"
                          tone="indigo"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </RegisterTableShell>
    </div>
  );
}
