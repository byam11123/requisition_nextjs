"use client";

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useRepair } from '@/modules/repairs/hooks/use-repair';
import { RepairInfoCard } from '@/modules/repairs/components/repair-info-card';
import { RepairAttachments } from '@/modules/repairs/components/repair-attachments';
import WorkflowActionCard, { type WorkflowAction } from '@/modules/common/components/workflow-action-card';
import { Truck, CheckCircle, IndianRupee } from 'lucide-react';
import PaymentModal from '@/modules/common/components/payment-modal';
import StatusTimeline from '@/modules/common/components/status-timeline';
import StatusChip from '@/components/ui/status-chip';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { canPerformStep } from '@/lib/workflow-assignee-guard';
import ConfirmationModal from '@/components/ui/confirmation-modal';

export default function RepairDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const { repair, loading, saving, updateRepair, processAction, refresh } = useRepair(id);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [dispatchConfirmOpen, setDispatchConfirmOpen] = useState(false);
  const [deliveryConfirmOpen, setDeliveryConfirmOpen] = useState(false);
  const [logisticsDraft, setLogisticsDraft] = useState<any>({
    dispatchSite: '',
    dispatchByName: '',
    dispatchStatus: '',
    receivedBy: '',
    deliveryStatus: ''
  });

  const updateLogisticsDraft = (updates: any) => {
    setLogisticsDraft((prev: any) => ({ ...prev, ...updates }));
  };

  const handleDispatchAction = async () => {
    const payload = {
      ...logisticsDraft,
      dispatchStatus: logisticsDraft.dispatchStatus || 'DISPATCHED'
    };
    await processAction('dispatch', payload);
    setDispatchConfirmOpen(false);
    setLogisticsDraft({ dispatchSite: '', dispatchByName: '', dispatchStatus: '', receivedBy: '', deliveryStatus: '' });
  };

  const handleDeliverAction = async () => {
    const payload = {
      ...logisticsDraft,
      deliveryStatus: logisticsDraft.deliveryStatus || 'DELIVERED',
      action: 'DELIVER'
    };
    await processAction('dispatch', payload);
    setDeliveryConfirmOpen(false);
    setLogisticsDraft({ dispatchSite: '', dispatchByName: '', dispatchStatus: '', receivedBy: '', deliveryStatus: '' });
  };



  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!repair) return <div className="text-center py-20 text-slate-500">Repair request not found</div>;

  const effectiveDispatchStatus = logisticsDraft.dispatchStatus || repair.dispatchStatus;
  const effectiveDeliveryStatus = logisticsDraft.deliveryStatus || repair.deliveryStatus;

  const isMasterLocked = effectiveDeliveryStatus === 'DELIVERED';
  const userPayload = user ? { sub: user.sub, role: user.role } : null;
  const isPaid = repair.warrantyStatus === 'IN_WARRANTY' || repair.paymentStatus === 'DONE';
  const isApproved = repair.warrantyStatus === 'IN_WARRANTY' || repair.approvalStatus === 'APPROVED';
  
  const canApprove = repair.repairStatus === 'REPAIRED' && repair.approvalStatus === 'PENDING' && userPayload && canPerformStep('approve', repair, userPayload);
  const canPay = repair.approvalStatus === 'APPROVED' && repair.paymentStatus !== 'DONE' && userPayload && canPerformStep('pay', repair, userPayload);
  const canDispatch = isPaid && isApproved && repair.dispatchStatus === 'NOT_DISPATCHED' && userPayload && canPerformStep('dispatch', repair, userPayload);
  const canDeliver = isApproved && repair.dispatchStatus === 'DISPATCHED' && repair.deliveryStatus !== 'DELIVERED' && userPayload && (userPayload.role === 'ADMIN' || userPayload.role === 'SITE_INCHARGE');

  const workflowActions: WorkflowAction[] = [
    { label: 'Approve Repair', icon: CheckCircle, onClick: () => processAction('approve', { approvalStatus: 'APPROVED' }), variant: 'emerald', show: canApprove },
    { label: 'Record Payment', icon: IndianRupee, onClick: () => setPaymentOpen(true), variant: 'purple', show: canPay },
    { label: 'Dispatch to Site', icon: Truck, onClick: () => setDispatchConfirmOpen(true), variant: 'blue', show: canDispatch },
    { label: 'Mark Delivered', icon: CheckCircle, onClick: () => setDeliveryConfirmOpen(true), variant: 'orange', show: canDeliver }
  ];

  const handlePaymentSubmit = async (data: any, file: File | null) => {
    await processAction('payment', data);
    
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', 'PAYMENT');
      fd.append('requisitionId', id);
      await fetch('/api/uploads', { 
        method: 'POST', 
        body: fd, 
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } 
      });
      refresh();
    }
    
    setPaymentOpen(false);
  };

  const handleUpload = async (file: File, category: string) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    fd.append('requisitionId', id);
    await fetch('/api/uploads', { method: 'POST', body: fd, headers: { Authorization: `Bearer ${useAuthStore.getState().token}` } });
    refresh();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up">
      <Link href="/dashboard/repair-maintenance" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300">
        <ArrowLeft size={16} /> Back to Register
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-3xl p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs text-[var(--app-muted)] uppercase tracking-widest mb-1">Repair Job</p>
                <h1 className="text-3xl font-bold">{repair.requestId}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusChip tone={repair.repairStatus === 'REPAIRED' ? 'emerald' : 'amber'}>{repair.repairStatus}</StatusChip>
                <StatusChip tone={repair.approvalStatus === 'APPROVED' ? 'emerald' : 'amber'}>{repair.approvalStatus}</StatusChip>
                <StatusChip tone={repair.paymentStatus === 'DONE' ? 'emerald' : 'slate'}>{repair.paymentStatus}</StatusChip>
                {repair.dispatchStatus === 'DISPATCHED' && <StatusChip tone="sky">DISPATCHED</StatusChip>}
                {repair.deliveryStatus === 'DELIVERED' && <StatusChip tone="emerald">DELIVERED</StatusChip>}
              </div>
            </div>

            <RepairInfoCard 
              repair={repair} 
              updateReq={updateRepair} 
              isMasterLocked={isMasterLocked}
              logisticsDraft={logisticsDraft}
              updateLogisticsDraft={updateLogisticsDraft}
            />
          </div>

          <RepairAttachments repair={repair} onUpload={handleUpload} isMasterLocked={isMasterLocked} />
        </div>

        <div className="w-full lg:w-80 space-y-6">
          {repair.deliveryStatus !== 'DELIVERED' && (
            <WorkflowActionCard actions={workflowActions} loading={saving} />
          )}

          <StatusTimeline 
            events={[
              { 
                key: '1', 
                title: 'Created', 
                description: `By ${repair.createdByName || 'System'}`, 
                state: 'done', 
                timestamp: repair.timestamp 
              },
              { 
                key: '2', 
                title: 'Approval', 
                description: repair.approvalStatus === 'APPROVED' 
                  ? `By ${repair.approvalByName || 'System'} - APPROVED` 
                  : `Waiting for ${repair.approverId ? 'Assigned Approver' : 'Admin'}`, 
                state: repair.approvalStatus === 'APPROVED' ? 'done' : 'current',
                timestamp: repair.approvedAt
              },
              { 
                key: '3', 
                title: 'Payment', 
                description: repair.paymentStatus === 'DONE' 
                  ? `By ${repair.paymentByName || 'System'} - ${repair.paymentMethod || 'Record Saved'}` 
                  : repair.approvalStatus === 'APPROVED' ? 'Ready for Payment' : 'Pending Approval', 
                state: repair.paymentStatus === 'DONE' ? 'done' : (repair.approvalStatus === 'APPROVED' ? 'current' : 'pending'),
                timestamp: repair.paidAt
              },
              { 
                key: '4', 
                title: 'Dispatch', 
                description: repair.dispatchStatus === 'DISPATCHED' || repair.deliveryStatus === 'DELIVERED'
                  ? `By ${repair.dispatchByName || 'System'} to ${repair.dispatchSite || 'Site'}` 
                  : repair.paymentStatus === 'DONE' ? 'Ready for Dispatch' : 'Pending Payment', 
                state: (repair.dispatchStatus === 'DISPATCHED' || repair.deliveryStatus === 'DELIVERED') ? 'done' : (repair.paymentStatus === 'DONE' ? 'current' : 'pending'),
                timestamp: repair.dispatchedAt
              },
              { 
                key: '5', 
                title: 'Delivery', 
                description: repair.deliveryStatus === 'DELIVERED' 
                  ? `Received by ${repair.receivedBy || 'System'} at Site` 
                  : repair.dispatchStatus === 'DISPATCHED' ? 'In Transit to Site' : 'Awaiting Dispatch', 
                state: repair.deliveryStatus === 'DELIVERED' ? 'done' : (repair.dispatchStatus === 'DISPATCHED' ? 'current' : 'pending'),
                timestamp: repair.receivedDate
              },
            ]} 
          />
        </div>
      </div>

      <PaymentModal 
        open={paymentOpen} 
        onClose={() => setPaymentOpen(false)} 
        onSubmit={handlePaymentSubmit} 
        loading={saving} 
        initialAmount={Number(repair.amount || 0)}
      />

      <ConfirmationModal 
        isOpen={dispatchConfirmOpen}
        onClose={() => setDispatchConfirmOpen(false)}
        onConfirm={handleDispatchAction}
        title="Dispatch to Site"
        message="Are you sure you want to mark this item as dispatched to site? This will update the status and notify relevant parties."
        confirmLabel="Yes, Dispatch"
        tone="info"
      />

      <ConfirmationModal 
        isOpen={deliveryConfirmOpen}
        onClose={() => setDeliveryConfirmOpen(false)}
        onConfirm={handleDeliverAction}
        title="Confirm Delivery"
        message="Has the item been received at the site? This will mark the repair cycle as complete."
        confirmLabel="Yes, Delivered"
        tone="emerald"
      />
    </div>
  );
}
