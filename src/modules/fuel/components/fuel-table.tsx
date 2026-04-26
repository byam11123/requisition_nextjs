import Link from 'next/link';
import { Eye } from 'lucide-react';
import StatusChip from '@/components/ui/status-chip';
import ActionIconButton from '@/components/ui/action-icon-button';
import { formatDate } from '@/utils/format';

export function FuelTable({ 
  requests, 
  selectedIds = [], 
  onToggleSelect, 
  onToggleAll, 
  allVisible = false, 
  someVisible = false 
}: { 
  requests: any[]; 
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  allVisible?: boolean;
  someVisible?: boolean;
}) {
  const getStatusTone = (status: string) => {
    if (status === 'COMPLETED' || status === 'APPROVED') return 'emerald';
    if (status === 'PENDING') return 'amber';
    if (status === 'REJECTED') return 'rose';
    return 'slate';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full whitespace-nowrap text-left text-sm">
        <thead className="bg-[var(--app-panel)]/80 text-xs uppercase tracking-wider text-[var(--app-muted)]">
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
            <th className="px-4 py-3">Request ID</th>
            <th className="px-4 py-3">Vehicle</th>
            <th className="px-4 py-3">RC No</th>
            <th className="px-4 py-3">Running</th>
            <th className="px-4 py-3">Requirement</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                No fuel requests found.
              </td>
            </tr>
          ) : (
            requests.map((row) => (
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
                  <Link href={`/dashboard/vehicle-fuel/${row.id}`}>{row.requestId}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{row.vehicleType}</p>
                  <p className="text-xs text-slate-500">{row.fuelType}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{row.rcNo}</td>
                <td className="px-4 py-3">
                  <p className="text-slate-100">{row.totalRunning} KM/Hrs</p>
                  <p className="text-xs text-slate-500">{row.lastReading} to {row.currentReading}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">{row.currentRequirementLitres} L</td>
                <td className="px-4 py-3"><StatusChip tone={getStatusTone(row.status)}>{row.status}</StatusChip></td>
                <td className="px-4 py-3 text-right">
                  <ActionIconButton href={`/dashboard/vehicle-fuel/${row.id}`} icon={Eye} label="View Details" tone="indigo" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
