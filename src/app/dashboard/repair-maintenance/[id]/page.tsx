"use client";

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRepair } from '@/modules/repairs/hooks/use-repair';
import { RepairInfoCard } from '@/modules/repairs/components/repair-info-card';
import { RepairActions } from '@/modules/repairs/components/repair-actions';
import { RepairAttachments } from '@/modules/repairs/components/repair-attachments';
import { PaymentModal } from '@/modules/repairs/components/payment-modal';
import StatusTimeline from '@/modules/common/components/status-timeline';
import StatusChip from '@/components/ui/status-chip';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const { repair, loading, saving, updateRepair, processAction, refresh } = useRepair(id);
  const [paymentOpen, setPaymentOpen] = useState(false);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!repair) return <div className="text-center py-20 text-slate-500">Repair request not found</div>;

  const isMasterLocked = repair.paymentStatus === 'DONE' || repair.dispatchStatus === 'DELIVERED';
  const canApprove = repair.repairStatus === 'REPAIRED' && repair.approvalStatus === 'PENDING' && (user?.role === 'ADMIN' || user?.role === 'MANAGER');
  const canPay = repair.approvalStatus === 'APPROVED' && repair.paymentStatus !== 'DONE' && (user?.role === 'ADMIN' || user?.role === 'ACCOUNTANT');

  const handlePaymentSubmit = async (data: any, file: File | null) => {
    await processAction('payment', data);
    setPaymentOpen(false);
  };

  const handleUpload = async (file: File, category: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('requisitionId', id);
    await fetch('/api/uploads', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <Link href="/dashboard/repair-maintenance" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
        <ArrowLeft size={16} /> Back to Register
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-3xl p-8 relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-[var(--app-muted)] uppercase tracking-widest mb-1">Repair Job</p>
                <h1 className="text-3xl font-bold">{repair.requestId}</h1>
              </div>
              <div className="flex gap-2">
                <StatusChip tone={repair.approvalStatus === 'APPROVED' ? 'emerald' : 'amber'}>{repair.approvalStatus}</StatusChip>
                <StatusChip tone={repair.paymentStatus === 'DONE' ? 'emerald' : 'slate'}>{repair.paymentStatus}</StatusChip>
              </div>
            </div>

            <RepairInfoCard repair={repair} updateReq={updateRepair} isMasterLocked={isMasterLocked} />
          </div>

          <RepairAttachments repair={repair} onUpload={handleUpload} isMasterLocked={isMasterLocked} />
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <RepairActions 
            canApprove={canApprove} 
            canPay={canPay} 
            onApprove={() => processAction('approve', { approvalStatus: 'APPROVED' })} 
            onPay={() => setPaymentOpen(true)} 
            saving={saving} 
          />

          <StatusTimeline 
            events={[
              { key: '1', title: 'Submitted', description: 'Request created', state: 'done', timestamp: repair.createdAt },
              { key: '2', title: 'Approval', description: repair.approvalStatus, state: repair.approvalStatus === 'APPROVED' ? 'done' : 'current' },
              { key: '3', title: 'Payment', description: repair.paymentStatus, state: repair.paymentStatus === 'DONE' ? 'done' : 'pending' },
            ]} 
          />
        </div>
      </div>

      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} onSubmit={handlePaymentSubmit} loading={saving} />
    </div>
  );
}
