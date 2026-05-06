import Link from 'next/link';
import { Eye, ImageIcon } from 'lucide-react';
import StatusChip from '@/components/ui/status-chip';
import ActionIconButton from '@/components/ui/action-icon-button';
import { formatDate } from '@/utils/format';

export function AttendanceTable({ 
  records, 
  selectedIds = [], 
  onToggleSelect, 
  onToggleAll, 
  allVisible = false, 
  someVisible = false 
}: { 
  records: any[]; 
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleAll?: () => void;
  allVisible?: boolean;
  someVisible?: boolean;
}) {
  const getStatusTone = (status: string) => {
    if (status === 'APPROVED') return 'emerald';
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
            <th className="px-4 py-3">Slip ID</th>
            <th className="px-4 py-3">Driver</th>
            <th className="px-4 py-3">Route</th>
            <th className="px-4 py-3">Vehicle No.</th>
            <th className="px-4 py-3">Geo Tag</th>
            <th className="px-4 py-3">Admin</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {records.length === 0 ? (
            <tr>
              <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                No attendance records found.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className={`hover:bg-white/[0.02] transition-colors cursor-pointer ${selectedIds.includes(String(record.id)) ? 'bg-indigo-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-white/10 bg-white/5 text-indigo-500 transition-colors focus:ring-0 focus:ring-offset-0"
                    checked={selectedIds.includes(String(record.id))}
                    onChange={() => onToggleSelect?.(String(record.id))}
                    onClick={(e) => e.stopPropagation()}
                  />
                </td>
                <td className="px-4 py-3 font-semibold text-indigo-400">
                  <Link href={`/dashboard/attendance/${record.id}`}>{record.requestId}</Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-200">{record.driverName}</p>
                  <p className="text-xs text-slate-500">{formatDate(record.timestamp)}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-slate-200">{record.fromSiteName}</p>
                  <p className="text-xs text-slate-500">To {record.toSiteName}</p>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {record.vehicleNumber}
                </td>
                <td className="px-4 py-3">
                  {record.geoTagPhotoUrl ? (
                    <StatusChip tone="emerald"><ImageIcon size={12}/> Attached</StatusChip>
                  ) : (
                    <StatusChip tone="amber">Pending</StatusChip>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-200 italic text-xs">
                  {record.adminName || '—'}
                </td>
                <td className="px-4 py-3"><StatusChip tone={getStatusTone(record.status)}>{record.status}</StatusChip></td>
                <td className="px-4 py-3 text-right">
                  <ActionIconButton href={`/dashboard/attendance/${record.id}`} icon={Eye} label="View Details" tone="indigo" />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
