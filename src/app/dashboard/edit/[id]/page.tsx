"use client";

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

export default function EditRequisitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    materialDescription: '', siteAddress: '', quantity: 0, amount: 0,
    priority: 'NORMAL', poDetails: '', requiredFor: '', vendorName: '',
    indentNo: '', description: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/requisitions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setForm({
            materialDescription: data.materialDescription || '',
            siteAddress: data.siteAddress || '',
            quantity: data.quantity || 0,
            amount: data.amount || 0,
            priority: data.priority || 'NORMAL',
            poDetails: data.poDetails || '',
            requiredFor: data.requiredFor || '',
            vendorName: data.vendorName || '',
            indentNo: data.indentNo || '',
            description: data.description || '',
          });
        }
      } catch { setError('Failed to load requisition'); }
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/requisitions/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Update failed');
      router.push('/dashboard/requisition');
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Update failed'); }
    finally { setSaving(false); }
  };

  const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600 transition-colors";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
      <Link href="/dashboard/requisition" className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
        <ArrowLeft size={16} /> Back to Requisition
      </Link>

      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-5 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Edit Requisition</h1>
        <p className="text-slate-400 text-sm mb-6">Update the details of your requisition below.</p>

        {error && (
          <div className="flex items-center gap-2 p-4 mb-6 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Material Description</label>
              <input value={form.materialDescription} onChange={set('materialDescription')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Priority</label>
              <input value={form.priority} className={inputCls} disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className={labelCls}>Site Address</label>
              <input value={form.siteAddress} onChange={set('siteAddress')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Quantity</label>
              <input type="number" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Amount (₹)</label>
              <input type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) }))} className={inputCls} required />
            </div>
          </div>

          <div className="border-t border-white/5 pt-6">
            <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-4">Additional Details (Optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Required For</label><input value={form.requiredFor} onChange={set('requiredFor')} className={inputCls} /></div>
              <div><label className={labelCls}>Vendor Name</label><input value={form.vendorName} onChange={set('vendorName')} className={inputCls} /></div>
              <div><label className={labelCls}>PO Details</label><input value={form.poDetails} onChange={set('poDetails')} className={inputCls} /></div>
              <div><label className={labelCls}>Indent No</label><input value={form.indentNo} onChange={set('indentNo')} className={inputCls} /></div>
            </div>
            <div className="mt-4">
              <label className={labelCls}>Additional Notes</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className={`${inputCls} resize-none`} />
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:justify-end">
            <Link href="/dashboard/requisition" className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium">
              Cancel
            </Link>
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
