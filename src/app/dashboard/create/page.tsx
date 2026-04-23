"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, AlertCircle, Loader2 } from 'lucide-react';
import FormSelect, {
  type FormSelectOption,
} from '@/app/dashboard/components/form-select';

export default function CreateRequisitionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    materialDescription: '', siteAddress: '', quantity: '1', amount: '',
    priority: 'NORMAL', poDetails: '', requiredFor: '', vendorName: '',
    indentNo: '', description: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent, submit = false) => {
    e.preventDefault();
    if (!form.materialDescription) { setError('Material description is required'); return; }
    if (!form.siteAddress) { setError('Site address is required'); return; }
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/requisitions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, submit }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      router.push('/dashboard/requisition');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";
  const priorityOptions: FormSelectOption<string>[] = [
    { value: 'LOW', label: 'Low' },
    { value: 'NORMAL', label: 'Normal' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Link href="/dashboard/requisition" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Requisition
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">New Requisition</h1>
        <p className="text-slate-400 text-sm mb-6">Fill in the details to submit a new purchase request.</p>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={e => handleSubmit(e, true)} className="space-y-6">
          {/* Core Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Material Description *</label>
              <input value={form.materialDescription} onChange={set('materialDescription')}
                placeholder="E.g. 50 bags of Cement" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <FormSelect
                value={form.priority}
                options={priorityOptions}
                onChange={(value) => setForm((current) => ({ ...current, priority: value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 col-span-full">
              <label className={labelCls}>Site Address *</label>
              <input value={form.siteAddress} onChange={set('siteAddress')} placeholder="E.g. Head Office" className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" min="1" value={form.quantity} onChange={set('quantity')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Est. Amount (₹)</label>
              <input type="number" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" className={inputCls} required />
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Additional Details (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Required For</label>
                <input value={form.requiredFor} onChange={set('requiredFor')} placeholder="E.g. Foundation work" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Vendor Name</label>
                <input value={form.vendorName} onChange={set('vendorName')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>PO Details</label>
                <input value={form.poDetails} onChange={set('poDetails')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Indent No</label>
                <input value={form.indentNo} onChange={set('indentNo')} className={inputCls} />
              </div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Additional Notes</label>
              <textarea value={form.description} onChange={set('description')} rows={3}
                className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button type="button" onClick={e => handleSubmit(e, false)}
              className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium">
              Save as Draft
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium shadow-lg shadow-indigo-600/20 transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
