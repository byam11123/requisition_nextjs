import { useState } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import FormSelect from '@/components/ui/form-select';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: any, file: File | null) => void;
  loading: boolean;
  initialAmount?: number;
}

export default function PaymentModal({ 
  open, 
  onClose, 
  onSubmit, 
  loading, 
  initialAmount = 0 
}: PaymentModalProps) {
  const [paymentStatus, setPaymentStatus] = useState('DONE');
  const [utrNo, setUtrNo] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<string>(initialAmount > 0 ? initialAmount.toString() : '');
  const [file, setFile] = useState<File | null>(null);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      paymentStatus,
      utrNo,
      paymentMode,
      paymentDate: new Date(paymentDate).toISOString(),
      amount: Number(amount),
    }, file);
  };

  const inputCls = "w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl px-4 py-2.5 text-[var(--app-text)] outline-none focus:border-[var(--app-accent-border)] text-sm transition-all";
  const labelCls = "block text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-6 shadow-2xl animate-fade-in-up">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-xl font-semibold">Update Payment</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Payment Status</label>
            <FormSelect 
              value={paymentStatus} 
              options={[{value:'DONE', label:'Done'}, {value:'PARTIAL', label:'Partial'}, {value:'NOT_DONE', label:'Not Done'}]} 
              onChange={setPaymentStatus} 
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>UTR Number</label>
              <input 
                value={utrNo} 
                onChange={e => setUtrNo(e.target.value)} 
                className={inputCls} 
                required 
                placeholder="Enter UTR #" 
              />
            </div>
            <div>
              <label className={labelCls}>Mode</label>
              <FormSelect 
                value={paymentMode} 
                options={[
                  {value:'UPI', label:'UPI'}, 
                  {value:'NEFT', label:'NEFT'}, 
                  {value:'RTGS', label:'RTGS'}, 
                  {value:'CASH', label:'Cash'},
                  {value:'CHEQUE', label:'Cheque'}
                ]} 
                onChange={setPaymentMode} 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Date</label>
              <input 
                type="date" 
                value={paymentDate} 
                onChange={e => setPaymentDate(e.target.value)} 
                className={inputCls} 
              />
            </div>
            <div>
              <label className={labelCls}>Amount</label>
              <input 
                type="number" 
                step="any"
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                className={inputCls} 
                placeholder="0.00" 
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Payment Proof</label>
            <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-6 text-sm text-[var(--app-muted)] transition-all hover:border-[var(--app-accent-border)] hover:bg-[var(--app-panel-hover)] group">
              <Upload size={18} className="text-[var(--app-muted)] group-hover:text-[var(--app-accent)]" />
              <span className="group-hover:text-[var(--app-text)]">{file ? file.name : "Select Proof Document (Image/PDF)"}</span>
              <input 
                type="file" 
                className="hidden" 
                onChange={e => setFile(e.target.files?.[0] || null)} 
              />
            </label>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-[var(--app-border)] text-[var(--app-text)] hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50">
              {loading ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
