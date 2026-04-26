import Link from 'next/link';
import { Eye } from 'lucide-react';
import StatusChip from '@/components/ui/status-chip';
import ActionIconButton from '@/components/ui/action-icon-button';
import { formatDate } from '@/utils/format';

export function RepairTable({ 
  repairs, 
  selectedIds = [], 
  onToggleSelect, 
  onToggleAll, 
  allVisible = false, 
  someVisible = false 
}: { 
  repairs: any[]; 
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  allVisible?: boolean;
  someVisible?: boolean;
}) {
  const getStatusTone = (status: string) => {
    if (status === 'APPROVED' || status === 'DELIVERED') return 'emerald';
    if (status === 'PENDING') return 'amber';
    if (status === 'REJECTED') return 'rose';
    if (status === 'DISPATCHED') return 'sky';
    return 'slate';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left whitespace-nowrap">
        <thead className="bg-[var(--app-panel)]/80 text-[var(--app-muted)] text-xs uppercase tracking-wider">
          <tr>
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                checked={allVisible}
                ref={(el) => { if (el) el.indeterminate = someVisible && !allVisible; }}
                onChange={onToggleAll}
              />
            </th>
            <th className="px-4 py-3">Job ID</th>
            <th className="px-4 py-3">Item & Site</th>
            <th className="px-4 py-3">Requested By</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Dispatch</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {repairs.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                No repair cases found.
              </td>
            </tr>
          ) : (
            repairs.map((row) => (
              <tr key={row.id} className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedIds.includes(String(row.id)) ? 'bg-indigo-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                    checked={selectedIds.includes(String(row.id))}
                    onChange={() => onToggleSelect?.(String(row.id))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-indigo-400">
                  <Link href={`/dashboard/repair-maintenance/${row.id}`}>{row.requestId}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{row.itemDescription}</p>
                  <p className="text-slate-500 text-xs">{row.siteAddress}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-300">{row.repairRequisitionByName}</p>
                  <p className="text-slate-500 text-xs">{formatDate(row.timestamp)}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone={getStatusTone(row.approvalStatus as any)}>{row.approvalStatus}</StatusChip>
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone={getStatusTone(row.dispatchStatus as any)}>{row.dispatchStatus}</StatusChip>
                </td>
                <td className="px-4 py-3 text-right">
                  <ActionIconButton href={`/dashboard/repair-maintenance/${row.id}`} icon={Eye} label="View Case" tone="indigo" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
