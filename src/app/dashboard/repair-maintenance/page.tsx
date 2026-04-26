"use client";

import { useRepairs } from '@/modules/repairs/hooks/use-repairs';
import { RepairStats } from '@/modules/repairs/components/repair-stats';
import { RepairFilters } from '@/modules/repairs/components/repair-filters';
import { RepairTable } from '@/modules/repairs/components/repair-table';
import PageHeader from '@/app/dashboard/components/page-header';
import RegisterTableShell from '@/app/dashboard/components/register-table-shell';
import { Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ExportMenu from "@/app/dashboard/components/export-menu";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { useState } from "react";

export default function RepairDashboard() {
  const { user } = useAuthStore();
  const { 
    repairs, loading, stats, searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter, deleteBulk
  } = useRepairs();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    if (selectedIds.length === repairs.length && repairs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(repairs.map(r => String(r.id)));
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
        title="Repair & Maintenance" 
        subtitle="Manage breakdown requests and equipment servicing."
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
            <Link href="/dashboard/repair-maintenance/create"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
              <Plus size={16} /> New Request
            </Link>
          </>
        }
      />

      <RepairStats 
        stats={stats} 
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <RepairFilters 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        approvalFilter={statusFilter} 
        onApprovalFilterChange={setStatusFilter} 
        resultCount={repairs.length}
      />

      <RegisterTableShell title="Repair Register" totalCount={repairs.length}>
        {loading ? (
          <div className="p-12 text-center text-[var(--app-muted)]">Loading repairs...</div>
        ) : (
          <RepairTable 
            repairs={repairs} 
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            allVisible={repairs.length > 0 && selectedIds.length === repairs.length}
            someVisible={selectedIds.length > 0 && selectedIds.length < repairs.length}
          />
        )}
      </RegisterTableShell>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Are you sure you want to delete ${selectedIds.length} selected repair cases?`}
        confirmLabel="Yes, Delete All"
        tone="danger"
      />
    </div>
  );
}
