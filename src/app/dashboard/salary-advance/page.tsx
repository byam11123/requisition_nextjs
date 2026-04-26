"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useSalary } from "@/modules/salary/hooks/use-salary";
import { SalaryStats } from "@/modules/salary/components/salary-stats";
import { SalaryTable } from "@/modules/salary/components/salary-table";
import { SalaryFilters } from "@/modules/salary/components/salary-filters";
import PageHeader from "@/app/dashboard/components/page-header";
import RegisterTableShell from "@/app/dashboard/components/register-table-shell";
import ExportMenu from "@/app/dashboard/components/export-menu";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { useState } from "react";

export default function SalaryAdvancePage() {
  const { user } = useAuthStore();
  const { 
    requests, loading, stats, searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter, deleteBulk 
  } = useSalary();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    if (selectedIds.length === requests.length && requests.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map(r => String(r.id)));
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
        title="Salary Advance"
        subtitle="Manage employee advance requests, repayment plans, and deduction history."
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
            <Link href="/dashboard/salary-advance/create"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
              <Plus size={16} /> New Request
            </Link>
          </>
        }
      />

      <SalaryStats 
        stats={stats} 
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <SalaryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        resultCount={requests.length}
      />

      <RegisterTableShell title="Salary Advance Register" totalCount={requests.length}>
        {loading ? (
          <div className="py-20 text-center text-[var(--app-muted)]">Loading records...</div>
        ) : (
          <SalaryTable 
            requests={requests} 
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            allVisible={requests.length > 0 && selectedIds.length === requests.length}
            someVisible={selectedIds.length > 0 && selectedIds.length < requests.length}
          />
        )}
      </RegisterTableShell>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Are you sure you want to delete ${selectedIds.length} selected salary requests?`}
        confirmLabel="Yes, Delete All"
        tone="danger"
      />
    </div>
  );
}
