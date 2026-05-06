import { CheckCircle, IndianRupee, Loader2, Truck } from 'lucide-react';

export function RepairActions({ 
  canApprove, canPay, canDispatch, canDeliver, onApprove, onPay, onDispatch, onDeliver, saving 
}: { 
  canApprove: boolean; 
  canPay: boolean; 
  canDispatch: boolean;
  canDeliver: boolean;
  onApprove: () => void; 
  onPay: () => void; 
  onDispatch: () => void;
  onDeliver: () => void;
  saving: boolean 
}) {
  return (
    <div className="space-y-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-4">Actions</h3>
      
      {canApprove && (
        <button 
          onClick={onApprove} 
          disabled={saving} 
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Approve Repair
        </button>
      )}

      {canPay && (
        <button 
          onClick={onPay} 
          disabled={saving} 
          className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <IndianRupee size={16} />}
          Record Payment
        </button>
      )}

      {canDispatch && (
        <button 
          onClick={onDispatch} 
          disabled={saving} 
          className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
          Dispatch to Site
        </button>
      )}

      {canDeliver && (
        <button 
          onClick={onDeliver} 
          disabled={saving} 
          className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Mark Delivered
        </button>
      )}

      {!canApprove && !canPay && !canDispatch && !canDeliver && (
        <p className="text-sm text-[var(--app-muted)] text-center italic py-2">No actions available</p>
      )}
    </div>
  );
}
