"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Download, Trash2, Plus, Eye, Wrench, Truck,
  Clock, ReceiptText
} from 'lucide-react';

type DashboardUser = {
  role?: string;
};

type RepairRow = {
  id: string | number;
  requestId?: string;
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
    pending: rows.filter(r => r.approvalStatus === 'PENDING').length,
    approved: rows.filter(r => r.approvalStatus === 'APPROVED' && (r.dispatchStatus === 'NOT_DISPATCHED' || r.deliveryStatus === 'NOT_DELIVERED')).length,
    inTransit: rows.filter(r => r.dispatchStatus === 'DISPATCHED' && r.deliveryStatus === 'NOT_DELIVERED').length,
    total: rows.length,
  }), [rows]);

  const filtered = useMemo(() => {
    let f = [...rows];
    // Shortcut filters from stat cards
    if (activeStatFilter === 'PENDING') f = f.filter(r => r.approvalStatus === 'PENDING');
    else if (activeStatFilter === 'APPROVED') f = f.filter(r => r.approvalStatus === 'APPROVED');
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
    if (approvalFilter !== 'ALL') f = f.filter(r => r.approvalStatus === approvalFilter);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportSource =
        selectedIds.length > 0
          ? filtered.filter((row) => selectedIds.includes(String(row.id)))
          : filtered;
      const csvRows = [
        [
          "Job ID",
          "Priority",
          "Item Description",
          "Site Address",
          "Requested By",
          "Approval Status",
          "Payment Status",
          "Dispatch Status",
          "Delivery Status",
          "Timestamp",
        ],
        ...exportSource.map((row) => [
          row.requestId,
          row.priority,
          row.itemDescription || "",
          row.siteAddress || "",
          row.repairRequisitionByName || "",
          row.approvalStatus || "",
          row.paymentStatus || "",
          row.dispatchStatus || "",
          row.deliveryStatus || "",
          formatDate(row.timestamp),
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
      link.download = "repair-register.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const formatDate = (val: string) => {
    if (!val) return '-';
    const d = new Date(val.endsWith('Z') ? val : val + 'Z');
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      NORMAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    };
    return `inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${map[p] || map.NORMAL}`;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      HOLD: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      DELIVERED: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      DISPATCHED: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    };
    return `inline-flex px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${map[s] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`;
  };

  const statData = [
    { title: 'Pending Approval', value: stats.pending, icon: Clock, color: 'amber', filter: 'PENDING' as const },
    { title: 'Active Jobs', value: stats.approved, icon: Wrench, color: 'emerald', filter: 'APPROVED' as const },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, color: 'sky', filter: 'TRANSIT' as const },
    { title: 'Total Cases', value: stats.total, icon: ReceiptText, color: 'purple', filter: 'ALL' as const },
  ];

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Repair & Maintenance</h1>
          <p className="text-slate-400 text-sm mt-1">Manage breakdown requests and equipment servicing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && user?.role === 'ADMIN' && (
            <button onClick={handleBulkDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50">
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
            </button>
          )}
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50">
            <Download size={16} />
            {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
          </button>
          <Link href="/dashboard/repair-maintainance/create"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> New Request
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statData.map(s => (
          <button key={s.filter}
            onClick={() => setActiveStatFilter(s.filter)}
            className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:scale-[1.01] ${activeStatFilter === s.filter
              ? colorMap[s.color]
              : 'bg-slate-900/50 border-white/5 hover:border-white/10'}`}>
            <div className="flex items-center gap-3">
              <div className={`inline-flex p-2 rounded-lg ${colorMap[s.color]}`}>
                <s.icon size={18} />
              </div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{s.title}</p>
            </div>
            <p className="text-2xl font-bold text-slate-100">{s.value}</p>
          </button>
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
          <select value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}
            className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-300">
            <option value="ALL">All Approval</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="HOLD">Hold</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-300">
            <option value="ALL">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-100">Repair Case Register</h2>
          <span className="text-xs text-slate-500">{filtered.length} total results</span>
        </div>
        <div className="overflow-x-auto">
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
                <th className="px-4 py-3">Logistics</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-slate-500">Fetching repair cases...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 italic">No matching records found</td>
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
                    <td className="px-4 py-3"><span className={priorityBadge(row.priority)}>{row.priority}</span></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200 truncate max-w-48">{row.itemDescription || 'Untitled Item'}</p>
                      <p className="text-slate-500 text-xs">{row.siteAddress || 'N/A'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{row.repairRequisitionByName || '-'}</p>
                      <p className="text-slate-500 text-xs">{formatDate(row.timestamp)}</p>
                    </td>
                    <td className="px-4 py-3"><span className={statusBadge(row.approvalStatus)}>{row.approvalStatus}</span></td>
                    <td className="px-4 py-3"><span className={statusBadge(row.paymentStatus === 'DONE' ? 'APPROVED' : '')}>{row.paymentStatus}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-0.5">
                        <span className={statusBadge(row.dispatchStatus === 'DISPATCHED' ? 'DISPATCHED' : '')}>{row.dispatchStatus}</span>
                        <span className={statusBadge(row.deliveryStatus === 'DELIVERED' ? 'DELIVERED' : '')}>{row.deliveryStatus}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <Link href={`/dashboard/repair-maintainance/${id}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Eye size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > rowsPerPage && (
          <div className="flex justify-between items-center p-4 border-t border-white/5 text-sm text-slate-400 bg-slate-950/20">
            <span>Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length} requests</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40">Previous</button>
              <button onClick={() => setPage(p => (p + 1) * rowsPerPage < filtered.length ? p + 1 : p)} disabled={(page + 1) * rowsPerPage >= filtered.length}
                className="px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
