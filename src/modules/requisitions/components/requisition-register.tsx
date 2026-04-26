"use client";

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

import PageHeader from '@/app/dashboard/components/page-header';
import RegisterTableShell from '@/app/dashboard/components/register-table-shell';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import ExportMenu from '@/app/dashboard/components/export-menu';

import { useRequisitions } from '../hooks/use-requisitions';
import { RequisitionStats } from './requisition-stats';
import { RequisitionFilters } from './requisition-filters';
import { RequisitionTable } from './requisition-table';
import { formatDate } from '@/utils/format';

export function RequisitionRegister({ user, workflowConfig }: { user: any; workflowConfig: any }) {
  const { requisitions, loading, stats, deleteBulk } = useRequisitions(user?.organizationId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeStatFilter, setActiveStatFilter] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });

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
        r.siteAddress?.toLowerCase().includes(q)
      );
    }
    
    if (approvalFilter !== 'ALL') f = f.filter(r => r.approvalStatus === approvalFilter);
    if (priorityFilter !== 'ALL') f = f.filter(r => r.priority === priorityFilter);
    
    return f;
  }, [requisitions, searchQuery, approvalFilter, priorityFilter, activeStatFilter]);

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const visibleIds = filtered.map(r => String(r.id));
    const allVisible = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
    if (allVisible) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBulkDelete = async () => {
    await deleteBulk(selectedIds);
    setSelectedIds([]);
    setDeleteModal({ isOpen: false });
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Requisition"
        subtitle="Track purchase requests, approvals, payments, and dispatch flow."
        actions={
          <>
            {selectedIds.length > 0 && user?.role === 'ADMIN' && (
              <button
                onClick={() => setDeleteModal({ isOpen: true })}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 size={16} /> Delete ({selectedIds.length})
              </button>
            )}
            <ExportMenu
              exporting={false}
              selectedCount={selectedIds.length}
              onExportCsv={() => {}}
              onExportPdf={() => {}}
            />
            {(user?.role === 'PURCHASER' || user?.role === 'ADMIN') && (
              <Link
                href="/dashboard/requisition/create"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Plus size={16} /> New Requisition
              </Link>
            )}
          </>
        }
      />

      <RequisitionStats
        stats={stats}
        activeFilter={activeStatFilter}
        onFilterChange={(f) => {
          setActiveStatFilter(f);
          if (f !== 'TOPAY') setApprovalFilter(f === 'ALL' ? 'ALL' : f);
        }}
      />

      <RequisitionFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        approvalFilter={approvalFilter}
        onApprovalChange={setApprovalFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        resultCount={filtered.length}
      />

      <RegisterTableShell title="Requisition Register" totalCount={filtered.length}>
        <RequisitionTable
          data={filtered}
          user={user}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleAll={toggleAll}
          allVisible={filtered.length > 0 && filtered.every(r => selectedIds.includes(String(r.id)))}
          someVisible={filtered.some(r => selectedIds.includes(String(r.id)))}
          onDispatch={(id) => {}}
          workflowConfig={workflowConfig}
          formatDate={formatDate}
        />
      </RegisterTableShell>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Are you sure you want to delete ${selectedIds.length} selected requisitions?`}
        confirmLabel="Yes, Delete All"
        tone="danger"
      />
    </div>
  );
}

