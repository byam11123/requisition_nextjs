import { Search } from 'lucide-react';
import FilterDropdown from '@/components/ui/filter-dropdown';

interface AttendanceFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  resultCount: number;
}

export function AttendanceFilters({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  resultCount 
}: AttendanceFiltersProps) {
  return (
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-3xl p-5 backdrop-blur-xl space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]" />
          <input 
            value={searchQuery} 
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search attendance records..."
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-2xl pl-11 pr-4 py-3 text-sm outline-none focus:border-[var(--app-accent-border)] text-[var(--app-text)]"
          />
        </div>
        <div className="flex gap-3">
          <FilterDropdown
            label="Approval"
            value={statusFilter}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]}
            onChange={onStatusChange}
          />
        </div>
      </div>
      <div className="text-xs text-[var(--app-muted)] font-medium px-1">
        Showing <span className="text-[var(--app-text)]">{resultCount}</span> records
      </div>
    </div>
  );
}
