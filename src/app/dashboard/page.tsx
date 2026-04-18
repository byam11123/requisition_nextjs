"use client";

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search, Download, Trash2, Plus, Eye, Edit, Truck,
  Clock, CheckCircle, IndianRupee, ReceiptText, Filter
} from 'lucide-react';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
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
    const u = localStorage.getItem('user');
    if (u) setUser(JSON.parse(u));
    fetchRequisitions();
  }, []);

  const fetchRequisitions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/requisitions', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRequisitions(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const stats = useMemo(() => ({
    pending: requisitions.filter(r => r.approvalStatus === 'PENDING').length,
    approved: requisitions.filter(r => r.approvalStatus === 'APPROVED').length,
    toPay: requisitions.filter(r => r.approvalStatus === 'APPROVED' && r.paymentStatus !== 'DONE').length,
    total: requisitions.length,
  }), [requisitions]);

  const filtered = useMemo(() => {
    let f = [...requisitions];
    if (activeStatFilter === 'PENDING') f = f.filter(r => r.approvalStatus === 'PENDING');
    else if (activeStatFilter === 'APPROVED') f = f.filter(r => r.approvalStatus === 'APPROVED');
    else if (activeStatFilter === 'TOPAY') f = f.filter(r => r.approvalStatus === 'APPROVED' && r.paymentStatus !== 'DONE');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      f = f.filter(r =>
        r.requestId?.toLowerCase().includes(q) ||
        r.materialDescription?.toLowerCase().includes(q) ||
        r.siteAddress?.toLowerCase().includes(q) ||
        r.vendorName?.toLowerCase().includes(q) ||
        r.createdBy?.fullName?.toLowerCase().includes(q)
      );
    }
    if (approvalFilter !== 'ALL') f = f.filter(r => r.approvalStatus === approvalFilter);
    if (priorityFilter !== 'ALL') f = f.filter(r => r.priority === priorityFilter);
    return f;
  }, [requisitions, searchQuery, approvalFilter, priorityFilter, activeStatFilter]);

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const visibleIds = paginated.map((r: any) => String(r.id));
  const allVisible = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const someVisible = visibleIds.some(id => selectedIds.includes(id));

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    allVisible
      ? setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)))
      : setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected?`)) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/requisitions/bulk-delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      fetchRequisitions();
    } catch (e) { alert('Delete failed'); }
    finally { setDeleting(false); }
  };

  const handleDispatch = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Mark as dispatched?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/requisitions/${id}/dispatch`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchRequisitions();
  };

  const formatDate = (val: string) => {
    if (!val) return '';
    const d = new Date(val.endsWith('Z') ? val : val + 'Z');
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const statusBadge = (status: string) => {
    const map: any = {
      APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      HOLD: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      TO_REVIEW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    };
    return `inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${map[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`;
  };

  const priorityBadge = (p: string) => {
    const map: any = {
      URGENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      HIGH: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      LOW: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      NORMAL: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return `inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${map[p] || map.NORMAL}`;
  };

  const paymentBadge = (p: string) => p === 'DONE'
    ? 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'inline-flex px-2 py-0.5 text-xs font-medium rounded-full border bg-slate-500/10 text-slate-400 border-slate-500/20';

  const statData = [
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'amber', filter: 'PENDING' as const },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald', filter: 'APPROVED' as const },
    { title: 'To Pay', value: stats.toPay, icon: IndianRupee, color: 'sky', filter: 'TOPAY' as const },
    { title: 'Total', value: stats.total, icon: ReceiptText, color: 'purple', filter: 'ALL' as const },
  ];

  const colorMap: any = {
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && user?.role === 'ADMIN' && (
            <button id="btn-bulk-delete" onClick={handleBulkDelete} disabled={deleting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors disabled:opacity-50">
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : `Delete (${selectedIds.length})`}
            </button>
          )}
          <button id="btn-export" onClick={() => setExporting(true)} disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50">
            <Download size={16} />
            {selectedIds.length > 0 ? `Export (${selectedIds.length})` : 'Export All'}
          </button>
          {user?.role === 'PURCHASER' && (
            <Link id="btn-new-req" href="/dashboard/create"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
              <Plus size={16} /> New Requisition
            </Link>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statData.map(s => (
          <button key={s.filter} id={`stat-${s.filter.toLowerCase()}`}
            onClick={() => { setActiveStatFilter(s.filter); if (s.filter !== 'TOPAY') setApprovalFilter(s.filter === 'ALL' ? 'ALL' : s.filter); }}
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
            <input id="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, item, site, vendor, creator..."
              className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-200 placeholder:text-slate-600" />
          </div>
          <select id="filter-approval" value={approvalFilter} onChange={e => setApprovalFilter(e.target.value)}
            className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-300">
            <option value="ALL">All Approval</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="HOLD">Hold</option>
            <option value="TO_REVIEW">To Review</option>
          </select>
          <select id="filter-priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-300">
            <option value="ALL">All Priority</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
          <span className="hidden md:flex items-center text-sm text-slate-500 whitespace-nowrap px-2">{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-slate-100">Requisitions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allVisible} ref={el => { if (el) el.indeterminate = someVisible && !allVisible; }}
                    onChange={toggleAll} className="rounded border-white/10 bg-slate-800" />
                </th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Item & Site</th>
                <th className="px-4 py-3">Created By</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Approval</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Dispatch</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <div className="inline-block w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">No requisitions found</td>
                </tr>
              ) : paginated.map((row: any) => {
                const id = String(row.id);
                const selected = selectedIds.includes(id);
                const canEdit = (user?.role === 'MANAGER' && row.paymentStatus !== 'DONE') ||
                  (user?.role === 'PURCHASER' && row.approvalStatus === 'PENDING') ||
                  (user?.role === 'ADMIN' && row.paymentStatus !== 'DONE');
                return (
                  <tr key={id} onClick={() => toggleSelect(id)}
                    className={`hover:bg-white/[0.02] cursor-pointer transition-colors ${selected ? 'bg-indigo-500/5' : ''}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected} onChange={() => toggleSelect(id)}
                        className="rounded border-white/10 bg-slate-800" />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Link href={`/dashboard/req/${id}`}
                        className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline underline-offset-2 transition-colors">
                        {row.requestId || 'DRAFT'}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className={priorityBadge(row.priority || 'NORMAL')}>{row.priority || 'NORMAL'}</span></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-200 truncate max-w-48">{row.materialDescription || row.description || 'Untitled'}</p>
                      <p className="text-slate-500 text-xs">{row.siteAddress || 'No Site'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-300">{row.createdBy?.fullName || row.createdByName || '-'}</p>
                      <p className="text-slate-500 text-xs">{formatDate(row.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-200">₹{row.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={statusBadge(row.approvalStatus)}>{row.approvalStatus}</span></td>
                    <td className="px-4 py-3"><span className={paymentBadge(row.paymentStatus)}>{row.paymentStatus}</span></td>
                    <td className="px-4 py-3"><span className={row.dispatchStatus === 'DISPATCHED' ? statusBadge('APPROVED') : statusBadge('')}>{row.dispatchStatus}</span></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Link id={`btn-view-${id}`} href={`/dashboard/req/${id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Eye size={16} />
                        </Link>
                        {canEdit && (
                          <Link id={`btn-edit-${id}`} href={`/dashboard/edit/${id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-colors">
                            <Edit size={16} />
                          </Link>
                        )}
                        {user?.role === 'PURCHASER' && row.dispatchStatus === 'NOT_DISPATCHED' && row.approvalStatus === 'APPROVED' && (
                          <button id={`btn-dispatch-${id}`} onClick={e => handleDispatch(e, id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 transition-colors">
                            <Truck size={16} />
                          </button>
                        )}
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
          <div className="flex justify-between items-center p-4 border-t border-white/5 text-sm text-slate-400">
            <span>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                className="px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(p => (p + 1) * rowsPerPage < filtered.length ? p + 1 : p)} disabled={(page + 1) * rowsPerPage >= filtered.length}
                className="px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
