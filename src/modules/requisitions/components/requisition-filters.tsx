import { Search } from 'lucide-react';
import FilterDropdown, { FilterDropdownOption } from '@/components/ui/filter-dropdown';

interface FilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  approvalFilter: string;
  onApprovalChange: (filter: string) => void;
  priorityFilter: string;
  onPriorityChange: (filter: string) => void;
  resultCount: number;
}

export function RequisitionFilters({
  searchQuery,
  onSearchChange,
  approvalFilter,
  onApprovalChange,
  priorityFilter,
  onPriorityChange,
  resultCount,
}: FilterProps) {
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
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by ID, item, site, vendor..."
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[var(--app-accent-border)] text-[var(--app-text)]"
          />
        </div>
        <FilterDropdown
          label="Approval"
          value={approvalFilter}
          options={approvalOptions}
          onChange={onApprovalChange}
        />
        <FilterDropdown
          label="Priority"
          value={priorityFilter}
          options={priorityOptions}
          onChange={onPriorityChange}
        />
        <span className="hidden md:flex items-center text-sm text-[var(--app-muted)] px-2">
          {resultCount} results
        </span>
      </div>
    </div>
  );
}
