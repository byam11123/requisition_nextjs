"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, XCircle, Plus, Wallet, Eye, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/modules/auth/hooks/use-auth-store";
import { DetailInfoRow } from "@/app/dashboard/components/detail-info";
import StatusTimeline, { type TimelineEvent } from '@/modules/common/components/status-timeline';
import StatusChip from "@/components/ui/status-chip";
import { formatDate } from "@/utils/format";
import { canPerformStep } from "@/lib/workflow-assignee-guard";
import AddDeductionModal from "@/modules/salary/components/add-deduction-modal";
import ConfirmPaymentModal from "@/modules/salary/components/confirm-payment-modal";
import HistoryDetailModal from "@/modules/salary/components/history-detail-modal";
import { toast } from "sonner";

export default function SalaryAdvanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any>([]);
  const [deductions, setDeductions] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isDeductionModalOpen, setIsDeductionModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<any>(null);

  const { token, user } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch(`/api/salary-advance/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch record");
        const data = await res.json();
        setRecord(data);

        // Fetch aggregation data if employee code exists
        if (data.employeeCode) {
          const [summaryRes, historyRes, deductionsRes] = await Promise.all([
            fetch(`/api/salary-advance/summary?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/salary-advance/history?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`/api/salary-advance/deductions?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          if (summaryRes.ok) setSummary(await summaryRes.json());
          if (historyRes.ok) setHistory(await historyRes.json());
          if (deductionsRes.ok) setDeductions(await deductionsRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const refreshAggregation = async () => {
    if (!record?.employeeCode) return;
    const token = useAuthStore.getState().token;
    const [summaryRes, historyRes, deductionsRes] = await Promise.all([
      fetch(`/api/salary-advance/summary?employeeCode=${record.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/salary-advance/history?employeeCode=${record.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/salary-advance/deductions?employeeCode=${record.employeeCode}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    if (summaryRes.ok) setSummary(await summaryRes.json());
    if (historyRes.ok) setHistory(await historyRes.json());
    if (deductionsRes.ok) setDeductions(await deductionsRes.json());
  };

  const refreshAll = async () => {
    try {
      const currentToken = useAuthStore.getState().token;
      // Refresh the main record
      const recordRes = await fetch(`/api/salary-advance/${id}`, {
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      if (recordRes.ok) {
        const data = await recordRes.json();
        setRecord(data);

        // Refresh aggregations
        if (data.employeeCode) {
          const [summaryRes, historyRes, deductionsRes] = await Promise.all([
            fetch(`/api/salary-advance/summary?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${currentToken}` } }),
            fetch(`/api/salary-advance/history?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${currentToken}` } }),
            fetch(`/api/salary-advance/deductions?employeeCode=${data.employeeCode}`, { headers: { Authorization: `Bearer ${currentToken}` } })
          ]);

          if (summaryRes.ok) setSummary(await summaryRes.json());
          if (historyRes.ok) setHistory(await historyRes.json());
          if (deductionsRes.ok) setDeductions(await deductionsRes.json());
        }
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const handleAction = async (status: string) => {
    setActionLoading(status);
    try {
      const currentToken = useAuthStore.getState().token;
      const response = await fetch(`/api/salary-advance/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        await refreshAll();
        toast.success(`Request ${status.toLowerCase()} successfully`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddDeduction = async (data: { deductionDate: string; deductionAmount: number; remark: string }) => {
    try {
      const currentToken = useAuthStore.getState().token;
      const res = await fetch(`/api/salary-advance/deductions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeCode: record.employeeCode,
          amount: data.deductionAmount,
          deductionDate: data.deductionDate,
          remark: data.remark
        }),
      });

      if (!res.ok) throw new Error("Failed to save deduction");
      await refreshAll();
      toast.success("Deduction recorded successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save deduction");
    }
  };

  const handlePayment = async (data: { paymentMode: string; paymentReference: string; paymentPhotoUrl?: string }) => {
    try {
      const currentToken = useAuthStore.getState().token;
      const res = await fetch(`/api/salary-advance/${id}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${currentToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to confirm payment");
      }
      
      await refreshAll();
      toast.success("Payment confirmed and history updated");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to confirm payment");
    }
  };

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!record) return [];
    
    // Start with the initial request and approval for the CURRENT record
    const steps: TimelineEvent[] = [
      { 
        key: "created", 
        title: "Advance Requested", 
        description: `Requested by ${record.employeeName} (${record.employeeCode})`, 
        timestamp: record.entryTimestamp, 
        state: "done" 
      },
      { 
        key: "approval", 
        title: record.status === 'PENDING' ? "Awaiting Approval" : (['APPROVED', 'PAID'].includes(record.status) ? 'Approved' : 'Rejected'), 
        description: record.status === 'PENDING' 
          ? "Waiting for management review." 
          : `${['APPROVED', 'PAID'].includes(record.status) ? 'Approved' : 'Rejected'} by ${record.approvedByName || 'Manager'}.`, 
        timestamp: record.status === 'PENDING' ? null : record.approvedAt, 
        state: record.status === 'PENDING' ? 'current' : (['APPROVED', 'PAID', 'REJECTED'].includes(record.status) ? 'done' : 'pending')
      }
    ];

    // Add ALL previous disbursements from history
    // We sort them chronologically to show the flow
    const previousDisbursements = history
      .filter((h: any) => h.status === 'PAID' && String(h.request_id) !== String(record.requestId))
      .sort((a: any, b: any) => new Date(a.paid_at).getTime() - new Date(b.paid_at).getTime())
      .map((h: any) => ({
        key: `disbursed-${h.request_id}`,
        title: `${h.request_type} Disbursed`,
        description: `₹${h.requested_amount} released via ${h.payment_mode}`,
        timestamp: h.paid_at,
        state: "done" as const
      }));

    steps.push(...previousDisbursements);

    // Finally, add the current disbursement step
    steps.push({ 
      key: "payment", 
      title: record.status === 'PAID' ? "Current Advance Disbursed" : "Payment Disbursement", 
      description: record.status === 'PAID' 
        ? `Disbursed via ${record.paymentMode} (${record.paymentReference}) by ${record.paidByName || 'Accounts'}` 
        : (record.status === 'REJECTED' ? "Payment cancelled." : "Waiting for payment release."), 
      timestamp: record.status === 'PAID' ? record.paidAt : null, 
      state: record.status === 'APPROVED' ? 'current' : (record.status === 'PAID' ? 'done' : 'pending')
    });

    return steps;
  }, [record, history]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!record) return <p className="py-12 text-center text-slate-400">Record not found</p>;

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade-in-up">
      <Link href="/dashboard/salary-advance" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Salary Advances
      </Link>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Request ID</p>
                <h1 className="text-2xl font-bold">{record.requestId}</h1>
              </div>
              <StatusChip tone={record.status === 'PAID' ? 'emerald' : (record.status === 'APPROVED' ? 'indigo' : 'amber')}>
                {record.status === 'PAID' ? 'DISBURSED' : (record.status === 'APPROVED' ? 'AWAITING PAYMENT' : record.status)}
              </StatusChip>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Advance</p>
                <p className="text-2xl font-bold text-slate-100">₹{summary?.total_advance || 0}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Total Deducted</p>
                <p className="text-2xl font-bold text-rose-400">₹{summary?.total_deducted || 0}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Additional Advances</p>
                <p className="text-2xl font-bold text-amber-400">₹{summary?.total_additional || 0}</p>
              </div>
              <div className="bg-white/5 p-5 rounded-2xl border border-white/5 shadow-sm">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-emerald-400">₹{summary?.current_balance || 0}</p>
              </div>
            </div>

            {/* Deduction History */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30">
              <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">Deduction History</h3>
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/10 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                    {record.deductionHistory?.length || 0}
                  </span>
                </div>
                {record.status === 'PAID' && (
                  <button 
                    onClick={() => setIsDeductionModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-indigo-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors"
                  >
                    <Plus size={12} /> New Entry
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-bold">Deduction Date</th>
                      <th className="px-6 py-3 font-bold">Deduction Amount</th>
                      <th className="px-6 py-3 font-bold">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deductions && deductions.length > 0 ? (
                      deductions.map((d: any, idx: number) => (
                        <tr key={d.id || idx} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-300">{formatDate(d.deduction_date)}</td>
                          <td className="px-6 py-4 text-slate-200 font-semibold">₹{d.amount}</td>
                          <td className="px-6 py-4 text-slate-400 italic text-xs">{d.remark || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic">No deductions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Advance Request History */}
            <div className="mt-12 overflow-hidden rounded-2xl border border-white/5 bg-slate-950/30">
              <div className="flex items-center border-b border-white/5 bg-white/[0.02] px-6 py-4 gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-100">Advance Request History</h3>
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-500/10 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                  {history?.length || 0}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3 font-bold">Request ID</th>
                      <th className="px-6 py-3 font-bold">Date</th>
                      <th className="px-6 py-3 font-bold">Amount</th>
                      <th className="px-6 py-3 font-bold">Type</th>
                      <th className="px-6 py-3 font-bold">Status</th>
                      <th className="px-6 py-3 font-bold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history && history.length > 0 ? (
                      history.map((h: any) => (
                        <tr key={h.id} className={`group hover:bg-white/[0.02] transition-colors ${String(h.request_id) === String(record.requestId) ? 'bg-indigo-500/5' : ''}`}>
                          <td className="px-6 py-4 font-mono text-xs text-slate-300">{h.request_id}</td>
                          <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(h.created_at)}</td>
                          <td className="px-6 py-4 text-slate-200 font-semibold text-xs">₹{h.requested_amount}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${h.request_type === 'Initial' ? 'text-blue-400 border-blue-500/20 bg-blue-500/5' : 'text-amber-400 border-amber-500/20 bg-amber-500/5'}`}>
                              {h.request_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusChip tone={h.status === 'PAID' ? 'emerald' : (h.status === 'APPROVED' ? 'indigo' : 'amber')}>
                              {h.status === 'PAID' ? 'DISBURSED' : (h.status === 'APPROVED' ? 'APPROVED' : h.status)}
                            </StatusChip>
                          </td>
                          <td className="px-6 py-4 flex gap-3 items-center">
                            <button 
                              onClick={() => setSelectedHistory(h)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center"
                              title="View Details"
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">No history found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-12">
              <DetailInfoRow label="Employee Name" value={record.employeeName} />
              <DetailInfoRow label="Employee Code" value={record.employeeCode} />
              <DetailInfoRow label="Designation" value={record.designation} />
              <DetailInfoRow label="Department" value={record.department} />
              <DetailInfoRow label="Current Salary" value={`₹${record.currentSalary}`} />
              <DetailInfoRow label="Repayment Schedule" value={record.repaymentSchedule} />
              <DetailInfoRow label="Requested On" value={formatDate(record.entryTimestamp)} />
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          {record.status === 'PENDING' && (
            <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
              <h3 className="font-semibold mb-4 text-sm text-slate-200">Workflow Actions</h3>
              {user && canPerformStep('approve', record, { sub: user.id, role: user.role }) ? (
                <div className="space-y-3">
                  <button 
                    onClick={() => handleAction('APPROVED')} 
                    disabled={!!actionLoading} 
                    className="w-full py-2.5 bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'APPROVED' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve Request
                  </button>
                  <button 
                    onClick={() => handleAction('REJECTED')} 
                    disabled={!!actionLoading} 
                    className="w-full py-2.5 bg-rose-600/10 text-rose-500 border border-rose-500/20 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading === 'REJECTED' ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                    Reject Request
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4 border border-dashed border-white/5 rounded-xl">
                  Waiting for assigned manager
                </p>
              )}
            </div>
          )}
          {record.status === 'APPROVED' && (
            <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6">
              <h3 className="font-semibold mb-4 text-sm text-indigo-400 flex items-center gap-2">
                <Wallet size={16} /> Payment Release
              </h3>
              {user && canPerformStep('pay', record, { sub: user.id, role: user.role }) ? (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    This request has been approved. Please release the funds and record the payment details below.
                  </p>
                  <button 
                    onClick={() => setIsPaymentModalOpen(true)} 
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14} />
                    Confirm Disbursement
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-4 border border-dashed border-white/10 rounded-xl">
                  Waiting for accounts officer
                </p>
              )}
            </div>
          )}
          <StatusTimeline events={timelineEvents} />
        </div>
      </div>

      <AddDeductionModal 
        isOpen={isDeductionModalOpen}
        onClose={() => setIsDeductionModalOpen(false)}
        onConfirm={handleAddDeduction}
      />

      <ConfirmPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onConfirm={handlePayment}
      />

      <HistoryDetailModal
        isOpen={!!selectedHistory}
        onClose={() => setSelectedHistory(null)}
        record={selectedHistory}
      />
    </div>
  );
}
