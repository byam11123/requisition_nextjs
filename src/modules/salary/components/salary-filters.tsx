import { Search } from 'lucide-react';
import FilterDropdown from '@/components/ui/filter-dropdown';

interface SalaryFiltersProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
  resultCount: number;
}

export function SalaryFilters({ 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  resultCount 
}: SalaryFiltersProps) {
  return (
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 group w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)] transition-colors group-focus-within:text-[var(--app-accent)]" />
          <input 
            value={searchQuery} 
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search salary requests..."
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--app-accent-border)] text-[var(--app-text)]"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
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
          <div className="hidden md:block h-4 w-px bg-[var(--app-border)] mx-1" />
          <div className="text-[10px] text-[var(--app-muted)] font-bold uppercase tracking-wider whitespace-nowrap">
            <span className="text-[var(--app-text)]">{resultCount}</span> Results
          </div>
        </div>
      </div>
    </div>
  );
}
