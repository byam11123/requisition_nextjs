import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FormSelect from '@/components/ui/form-select';

export function CreateUserModal({ open, onClose, onSuccess, roles, designations }: any) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    customRoleKey: roles[0]?.key || 'PURCHASER',
    designationKey: '',
    designation: '',
    department: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onSuccess();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl px-4 py-3 text-[var(--app-text)] outline-none focus:border-[var(--app-accent-border)] text-sm";
  const labelCls = "block text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[var(--app-surface-strong)] border border-[var(--app-border-strong)] rounded-3xl p-6 shadow-2xl animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New User</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X size={20} /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Full Name</label><input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} required className={inputCls} /></div>
          <div><label className={labelCls}>Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required className={inputCls} /></div>
          <div><label className={labelCls}>Password</label><input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required className={inputCls} /></div>
          
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 font-medium">
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


