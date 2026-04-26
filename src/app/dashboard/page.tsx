"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search, Trash2, Plus, Eye, Edit, Truck,
  Clock, CheckCircle, IndianRupee, ReceiptText
} from 'lucide-react';
import FilterDropdown, {
  type FilterDropdownOption,
} from '@/components/ui/filter-dropdown';
import ActionIconButton from '@/components/ui/action-icon-button';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import ExportMenu from '@/app/dashboard/components/export-menu';
import {
  downloadRegisterCsv,
  openRegisterPdf,
} from '@/app/dashboard/components/export-utils';
import PageHeader from '@/app/dashboard/components/page-header';
import RegisterTableShell from '@/app/dashboard/components/register-table-shell';
import StatusChip, {
  type StatusChipTone,
} from '@/components/ui/status-chip';
import StatCard from '@/components/ui/stat-card';
import {
  DEFAULT_REQUISITION_WORKFLOW_CONFIG,
  canRunRequisitionWorkflowStep,
} from '@/lib/config/requisition-workflow-config';

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [workflowConfig, setWorkflowConfig] = useState(DEFAULT_REQUISITION_WORKFLOW_CONFIG);
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeStatFilter, setActiveStatFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });
  const [dispatchModal, setDispatchModal] = useState({ isOpen: false, id: '' });

  const fetchRequisitions = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/requisitions', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setRequisitions(await res.json());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const fetchWorkflowConfig = async () => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/workflow-config/requisition', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setWorkflowConfig(await res.json());
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (pathname === '/dashboard') {
      router.replace('/dashboard/overview');
    }
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === '/dashboard') {
      return;
    }
    const u = JSON.stringify(useAuthStore.getState().user);
    if (u) {
      startTransition(() => {
        setUser(JSON.parse(u));
      });
    }
    const run = async () => {
      await Promise.all([fetchRequisitions(), fetchWorkflowConfig()]);
    };
    void run();
  }, [pathname]);

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
    setDeleting(true);
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/requisitions/bulk-delete', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      fetchRequisitions();
    } catch (e) { alert('Delete failed'); }
    finally { setDeleting(false); setDeleteModal({ isOpen: false }); }
  };

  if (pathname === '/dashboard') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Clock className="animate-pulse text-indigo-400" size={24} />
      </div>
    );
  }

  const handleDispatch = async (id: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/requisitions/${id}/dispatch`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    fetchRequisitions();
    setDispatchModal({ isOpen: false, id: '' });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setExporting(true);
    try {
      const exportSource =
        selectedIds.length > 0
          ? filtered.filter((row) => selectedIds.includes(String(row.id)))
          : filtered;

      const exportConfig = {
        filename: format === 'csv' ? 'requisition-register.csv' : 'requisition-register.pdf',
        title: 'Requisition',
        subtitle:
          'Purchase requests, approval progress, payment follow-up, and dispatch tracking.',
        countLabel: 'requisitions',
        columns: [
          { label: 'Request ID' },
          { label: 'Priority' },
          { label: 'Item Description' },
          { label: 'Site Address' },
          { label: 'Created By' },
          { label: 'Amount', align: 'right' as const },
          { label: 'Approval Status' },
          { label: 'Payment Status' },
          { label: 'Dispatch Status' },
          { label: 'Created At' },
        ],
        rows: exportSource.map((row) => [
          row.requestId || 'DRAFT',
          row.priority || 'NORMAL',
          row.materialDescription || row.description || 'Untitled',
          row.siteAddress || 'No Site',
          row.createdBy?.fullName || row.createdByName || '-',
          row.amount?.toLocaleString?.() ?? '',
          row.approvalStatus || '',
          row.paymentStatus || '',
          row.dispatchStatus || '',
          formatDate(row.createdAt),
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
    if (!val) return '';
    const d = new Date(val.endsWith('Z') ? val : val + 'Z');
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const getApprovalTone = (status: string): StatusChipTone => {
    if (status === 'APPROVED') return 'emerald';
    if (status === 'PENDING') return 'amber';
    if (status === 'REJECTED') return 'rose';
    if (status === 'HOLD') return 'orange';
    if (status === 'TO_REVIEW') return 'sky';
    return 'slate';
  };

  const getPriorityTone = (priority: string): StatusChipTone => {
    if (priority === 'URGENT') return 'rose';
    if (priority === 'HIGH') return 'amber';
    if (priority === 'LOW') return 'sky';
    return 'slate';
  };

  const getPaymentTone = (paymentStatus: string): StatusChipTone =>
    paymentStatus === 'DONE' ? 'emerald' : 'slate';

  const getDispatchTone = (dispatchStatus: string): StatusChipTone =>
    dispatchStatus === 'DISPATCHED' ? 'sky' : 'slate';

  const statData = [
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'amber', filter: 'PENDING' as const },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald', filter: 'APPROVED' as const },
    { title: 'To Pay', value: stats.toPay, icon: IndianRupee, color: 'sky', filter: 'TOPAY' as const },
    { title: 'Total', value: stats.total, icon: ReceiptText, color: 'purple', filter: 'ALL' as const },
  ];

  const approvalOptions: FilterDropdownOption<string>[] = [
    { value: 'ALL', label: 'All Approval' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'HOLD', label: 'Hold' },
    { value: 'TO_REVIEW', label: 'To Review' },
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
      <PageHeader
        title="Requisition"
        subtitle="Track purchase requests, approvals, payments, and dispatch flow."
        actions={
          <>
          {selectedIds.length > 0 && user?.role === 'ADMIN' && (
            <button id="btn-bulk-delete" onClick={() => setDeleteModal({ isOpen: true })} disabled={deleting}
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
          {(user?.role === 'PURCHASER' || user?.role === 'ADMIN') && (
            <Link id="btn-new-req" href="/dashboard/requisition/create"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
              <Plus size={16} /> New Requisition
            </Link>
          )}
          </>
        }
      />

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Are you sure you want to delete ${selectedIds.length} selected requisitions? This action cannot be undone.`}
        confirmLabel="Yes, Delete All"
        tone="danger"
      />

      <ConfirmationModal
        isOpen={dispatchModal.isOpen}
        onClose={() => setDispatchModal({ isOpen: false, id: '' })}
        onConfirm={() => handleDispatch(dispatchModal.id)}
        title="Dispatch Requisition"
        message="Are you sure you want to mark this requisition as dispatched?"
        confirmLabel="Yes, Dispatch"
        tone="info"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statData.map(s => (
          <StatCard key={s.filter}
            title={s.title}
            value={s.value}
            icon={s.icon}
            tone={s.color as any}
            active={activeStatFilter === s.filter}
            onClick={() => { setActiveStatFilter(s.filter); if (s.filter !== 'TOPAY') setApprovalFilter(s.filter === 'ALL' ? 'ALL' : s.filter); }} />
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
            <input id="search-input" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, item, site, vendor, creator..."
              className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--app-accent-border)] text-[var(--app-text)] placeholder:text-[var(--app-muted)]/50" />
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
          <span className="hidden md:flex items-center text-sm text-[var(--app-muted)] whitespace-nowrap px-2">{filtered.length} results</span>
        </div>
      </div>

      {/* Table */}
      <RegisterTableShell
        title="Requisition Register"
        totalCount={filtered.length}
        footer={
          filtered.length > rowsPerPage ? (
            <div className="flex justify-between items-center p-4 border-t border-[var(--app-border)] text-sm text-[var(--app-muted)] bg-[var(--app-panel)]/30">
              <span>Showing {page * rowsPerPage + 1} to {Math.min((page + 1) * rowsPerPage, filtered.length)} of {filtered.length} requisitions</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg border border-[var(--app-border)] hover:bg-[var(--app-accent-soft)] transition-colors disabled:opacity-40">Previous</button>
                <button onClick={() => setPage(p => (p + 1) * rowsPerPage < filtered.length ? p + 1 : p)} disabled={(page + 1) * rowsPerPage >= filtered.length}
                  className="px-3 py-1.5 rounded-lg border border-[var(--app-border)] hover:bg-[var(--app-accent-soft)] transition-colors disabled:opacity-40">Next</button>
              </div>
            </div>
          ) : null
        }
      >
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-[var(--app-panel)]/80 text-[var(--app-muted)] text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">
                  <input type="checkbox" checked={allVisible} ref={el => { if (el) el.indeterminate = someVisible && !allVisible; }}
                    onChange={toggleAll} className="rounded border-[var(--app-border-strong)] bg-[var(--app-bg-secondary)]" />
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
            <tbody className="divide-y divide-[var(--app-border)]">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[var(--app-muted)]">
                    <div className="inline-block w-5 h-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading...</p>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[var(--app-muted)]">No requisitions found</td>
                </tr>
              ) : paginated.map((row: any) => {
                const id = String(row.id);
                const selected = selectedIds.includes(id);
                const canEdit = (user?.role === 'MANAGER' && row.paymentStatus !== 'DONE') ||
                  (user?.role === 'PURCHASER' && row.approvalStatus === 'PENDING') ||
                  (user?.role === 'ADMIN' && row.paymentStatus !== 'DONE');
                return (
                  <tr key={id} onClick={() => toggleSelect(id)}
                    className={`hover:bg-[var(--app-accent-soft)]/20 cursor-pointer transition-colors ${selected ? 'bg-[var(--app-accent-soft)]/30' : ''}`}>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selected} onChange={() => toggleSelect(id)}
                        className="rounded border-[var(--app-border-strong)] bg-[var(--app-bg-secondary)]" />
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <Link href={`/dashboard/requisition/${id}`}
                        className="font-semibold text-[var(--app-accent)] hover:text-[var(--app-accent-strong)] hover:underline underline-offset-2 transition-colors">
                        {row.requestId || 'DRAFT'}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><StatusChip tone={getPriorityTone(row.priority || 'NORMAL')}>{row.priority || 'NORMAL'}</StatusChip></td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--app-text)] truncate max-w-48">{row.materialDescription || row.description || 'Untitled'}</p>
                      <p className="text-[var(--app-muted)] text-xs">{row.siteAddress || 'No Site'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[var(--app-text)]/90">{row.createdBy?.fullName || row.createdByName || '-'}</p>
                      <p className="text-[var(--app-muted)] text-xs">{formatDate(row.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--app-text)] font-medium">Rs {row.amount?.toLocaleString()}</td>
                    <td className="px-4 py-3"><StatusChip tone={getApprovalTone(row.approvalStatus)}>{row.approvalStatus}</StatusChip></td>
                    <td className="px-4 py-3"><StatusChip tone={getPaymentTone(row.paymentStatus)}>{row.paymentStatus}</StatusChip></td>
                    <td className="px-4 py-3"><StatusChip tone={getDispatchTone(row.dispatchStatus)}>{row.dispatchStatus}</StatusChip></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <ActionIconButton id={`btn-view-${id}`} href={`/dashboard/requisition/${id}`}
                          icon={Eye} label="View requisition" tone="indigo" size="sm" />
                        {canEdit && (
                          <ActionIconButton id={`btn-edit-${id}`} href={`/dashboard/requisition/edit/${id}`}
                            icon={Edit} label="Edit requisition" tone="sky" size="sm" />
                        )}
                        {canRunRequisitionWorkflowStep({
                          config: workflowConfig,
                          key: 'dispatch',
                          roleKey: user?.customRoleKey || user?.role,
                          record: row,
                        }).allowed && (
                          <ActionIconButton id={`btn-dispatch-${id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDispatchModal({ isOpen: true, id });
                            }}
                            icon={Truck} label="Dispatch requisition" tone="purple" size="sm" />
                        )}
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
