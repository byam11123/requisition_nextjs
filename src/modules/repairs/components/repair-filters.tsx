import { Search } from 'lucide-react';
import FilterDropdown from '@/components/ui/filter-dropdown';

interface RepairFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  approvalFilter: string;
  onApprovalFilterChange: (val: string) => void;
  resultCount: number;
}

export function RepairFilters({ searchQuery, onSearchChange, approvalFilter, onApprovalFilterChange, resultCount }: RepairFiltersProps) {
  return (
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]" />
          <input 
            value={searchQuery} 
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search by ID, site, description..."
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--app-accent-border)] text-[var(--app-text)]"
          />
        </div>
        <div className="flex gap-3">
          <FilterDropdown
            label="Status"
            value={approvalFilter}
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'IN_TRANSIT', label: 'In Transit' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
            onChange={onApprovalFilterChange}
          />
          <span className="hidden md:flex items-center text-sm text-[var(--app-muted)] px-2 whitespace-nowrap">
            {resultCount} results
          </span>
        </div>
      </div>
    </div>
  );
}
