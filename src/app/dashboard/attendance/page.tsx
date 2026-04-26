"use client";

import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useAttendance } from "@/modules/attendance/hooks/use-attendance";
import { AttendanceStats } from "@/modules/attendance/components/attendance-stats";
import { AttendanceTable } from "@/modules/attendance/components/attendance-table";
import { AttendanceFilters } from "@/modules/attendance/components/attendance-filters";
import PageHeader from "@/app/dashboard/components/page-header";
import RegisterTableShell from "@/app/dashboard/components/register-table-shell";
import ExportMenu from "@/app/dashboard/components/export-menu";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { useState } from "react";

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { 
    records, loading, stats, searchQuery, setSearchQuery, 
    statusFilter, setStatusFilter, page, setPage, totalCount, rowsPerPage,
    deleteBulk
  } = useAttendance();
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false });

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    if (selectedIds.length === records.length && records.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(records.map(r => String(r.id)));
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
        title="Driver Attendance"
        subtitle="Manage movement slips, site routes, and geo-tag attendance records."
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
            <Link href="/dashboard/attendance/create"
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/20 transition-colors hover:bg-indigo-500">
              <Plus size={16} /> New Attendance
            </Link>
          </>
        }
      />

      <AttendanceStats 
        stats={stats} 
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
      />

      <AttendanceFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        resultCount={totalCount}
      />

      <RegisterTableShell 
        title="Attendance Register" 
        totalCount={totalCount}
        footer={
          totalCount > rowsPerPage && (
            <div className="flex items-center justify-between border-t border-white/5 px-5 py-3 text-sm text-[var(--app-muted)]">
              <span>Showing {page * rowsPerPage + 1}-{Math.min((page + 1) * rowsPerPage, totalCount)} of {totalCount}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5 transition-colors">Prev</button>
                <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * rowsPerPage >= totalCount} className="px-3 py-1 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
              </div>
            </div>
          )
        }
      >
        {loading ? (
          <div className="py-20 text-center text-[var(--app-muted)]">Loading records...</div>
        ) : (
          <AttendanceTable 
            records={records} 
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            allVisible={records.length > 0 && selectedIds.length === records.length}
            someVisible={selectedIds.length > 0 && selectedIds.length < records.length}
          />
        )}
      </RegisterTableShell>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false })}
        onConfirm={handleBulkDelete}
        title="Delete Selected?"
        message={`Are you sure you want to delete ${selectedIds.length} selected attendance records?`}
        confirmLabel="Yes, Delete All"
        tone="danger"
      />
    </div>
  );
}
