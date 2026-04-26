import Link from 'next/link';
import { Eye, Edit, Truck } from 'lucide-react';
import StatusChip, { StatusChipTone } from '@/components/ui/status-chip';
import ActionIconButton from '@/components/ui/action-icon-button';
import { canRunRequisitionWorkflowStep } from '@/lib/config/requisition-workflow-config';

interface TableProps {
  data: any[];
  user: any;
  loading: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  allVisible: boolean;
  someVisible: boolean;
  onDispatch: (id: string) => void;
  workflowConfig: any;
  formatDate: (val: string) => string;
}

export function RequisitionTable({
  data,
  user,
  loading,
  selectedIds,
  onToggleSelect,
  onToggleAll,
  allVisible,
  someVisible,
  onDispatch,
  workflowConfig,
  formatDate,
}: TableProps) {
  const getApprovalTone = (status: string): StatusChipTone => {
    const tones: Record<string, StatusChipTone> = {
      APPROVED: 'emerald',
      PENDING: 'amber',
      REJECTED: 'rose',
      HOLD: 'orange',
      TO_REVIEW: 'sky',
    };
    return tones[status] || 'slate';
  };

  return (
    <table className="w-full text-sm text-left whitespace-nowrap">
      <thead className="bg-[var(--app-panel)]/80 text-[var(--app-muted)] text-xs uppercase tracking-wider">
        <tr>
          <th className="px-4 py-3">
            <input
              type="checkbox"
              checked={allVisible}
              ref={(el) => {
                if (el) el.indeterminate = someVisible && !allVisible;
              }}
              onChange={onToggleAll}
              className="rounded border-[var(--app-border-strong)] bg-[var(--app-bg-secondary)]"
            />
          </th>
          <th className="px-4 py-3">Request ID</th>
          <th className="px-4 py-3">Priority</th>
          <th className="px-4 py-3">Item & Site</th>
          <th className="px-4 py-3">Created By</th>
          <th className="px-4 py-3">Amount</th>
          <th className="px-4 py-3">Approval</th>
          <th className="px-4 py-3">Payment</th>
          <th className="px-4 py-3">Dispatch</th>
          <th className="px-4 py-3 text-right">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--app-border)]">
        {loading ? (
          <tr>
            <td colSpan={10} className="py-12 text-center text-[var(--app-muted)]">
              <div className="inline-block w-5 h-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading...</p>
            </td>
          </tr>
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={10} className="py-12 text-center text-[var(--app-muted)]">
              No requisitions found
            </td>
          </tr>
        ) : (
          data.map((row: any) => {
            const id = String(row.id);
            const selected = selectedIds.includes(id);
            const canEdit =
              (user?.role === 'MANAGER' && row.paymentStatus !== 'DONE') ||
              (user?.role === 'PURCHASER' && row.approvalStatus === 'PENDING') ||
              (user?.role === 'ADMIN' && row.paymentStatus !== 'DONE');

            return (
              <tr
                key={id}
                onClick={() => onToggleSelect(id)}
                className={`hover:bg-[var(--app-accent-soft)]/20 cursor-pointer transition-colors ${
                  selected ? 'bg-[var(--app-accent-soft)]/30' : ''
                }`}
              >
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(id)}
                    className="rounded border-[var(--app-border-strong)] bg-[var(--app-bg-secondary)]"
                  />
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Link
                    href={`/dashboard/requisition/${id}`}
                    className="font-semibold text-[var(--app-accent)] hover:text-[var(--app-accent-strong)] hover:underline"
                  >
                    {row.requestId || 'DRAFT'}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone="slate">{row.priority || 'NORMAL'}</StatusChip>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[var(--app-text)] truncate max-w-48">
                    {row.materialDescription || row.description || 'Untitled'}
                  </p>
                  <p className="text-[var(--app-muted)] text-xs">{row.siteAddress || 'No Site'}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="text-[var(--app-text)]/90">{row.createdBy?.fullName || '-'}</p>
                  <p className="text-[var(--app-muted)] text-xs">{formatDate(row.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-[var(--app-text)] font-medium">
                  Rs {row.amount?.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone={getApprovalTone(row.approvalStatus)}>
                    {row.approvalStatus}
                  </StatusChip>
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone={row.paymentStatus === 'DONE' ? 'emerald' : 'slate'}>
                    {row.paymentStatus}
                  </StatusChip>
                </td>
                <td className="px-4 py-3">
                  <StatusChip tone={row.dispatchStatus === 'DISPATCHED' ? 'sky' : 'slate'}>
                    {row.dispatchStatus}
                  </StatusChip>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <ActionIconButton
                      href={`/dashboard/requisition/${id}`}
                      icon={Eye}
                      label="View"
                      tone="indigo"
                      size="sm"
                    />
                    {canEdit && (
                      <ActionIconButton
                        href={`/dashboard/requisition/edit/${id}`}
                        icon={Edit}
                        label="Edit"
                        tone="sky"
                        size="sm"
                      />
                    )}
                    {canRunRequisitionWorkflowStep({
                      config: workflowConfig,
                      key: 'dispatch',
                      roleKey: user?.customRoleKey || user?.role,
                      record: row,
                    }).allowed && (
                      <ActionIconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onDispatch(id);
                        }}
                        icon={Truck}
                        label="Dispatch"
                        tone="purple"
                        size="sm"
                      />
                    )}
                  </div>
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
