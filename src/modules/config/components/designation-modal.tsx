import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FormSelect from '@/components/ui/form-select';

export function DesignationModal({ open, designation, onClose, onSaved, roles }: any) {
  const [form, setForm] = useState(() => designation ? {
    name: designation.name,
    description: designation.description,
    department: designation.department,
    defaultCustomRoleKey: designation.defaultCustomRoleKey,
  } : {
    name: "",
    description: "",
    department: "",
    defaultCustomRoleKey: "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      const url = designation ? `/api/designations/${designation.key}` : "/api/designations";
      const res = await fetch(url, {
        method: designation ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved(await res.json());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl border border-white/5 bg-slate-950/50 px-4 py-3 text-sm text-slate-200 outline-none focus:border-indigo-500/50";
  const labelCls = "block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{designation ? 'Edit Designation' : 'New Designation'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <div><label className={labelCls}>Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} placeholder="e.g. Purchase Manager" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Department</label><input value={form.department} onChange={e => setForm({...form, department: e.target.value})} className={inputCls} placeholder="e.g. Finance" /></div>
            <div><label className={labelCls}>Default Role</label>
              <FormSelect value={form.defaultCustomRoleKey} options={[{value:'', label:'None'}, ...roles.map((r:any) => ({value:r.key, label:r.name}))]} onChange={val => setForm({...form, defaultCustomRoleKey: val})} />
            </div>
          </div>
          <div><label className={labelCls}>Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputCls} resize-none h-24`} placeholder="Notes about this job title..." /></div>
          
          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 font-medium">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Designation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


