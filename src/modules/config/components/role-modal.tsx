import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import FormSelect from '@/components/ui/form-select';
import { DASHBOARD_PAGE_OPTIONS } from '@/lib/config/page-access';

export function RoleModal({ open, role, onClose, onSaved }: any) {
  const [form, setForm] = useState(() => role ? {
    name: role.name,
    description: role.description,
    baseRole: role.baseRole,
    pageAccess: role.pageAccess,
  } : {
    name: "",
    description: "",
    baseRole: "PURCHASER",
    pageAccess: ["overview", "requisition", "profile"],
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      const url = role ? `/api/custom-roles/${role.key}` : "/api/custom-roles";
      const res = await fetch(url, {
        method: role ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onSaved(await res.json());
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const togglePage = (key: string) => {
    setForm(f => ({
      ...f,
      pageAccess: f.pageAccess.includes(key) ? f.pageAccess.filter((p:any) => p !== key) : [...f.pageAccess, key]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{role ? 'Edit Role' : 'New Role'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl"><X size={18}/></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Role Name" className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none w-full" />
            <FormSelect value={form.baseRole} options={[{value:'ADMIN', label:'Admin'}, {value:'MANAGER', label:'Manager'}, {value:'PURCHASER', label:'Purchaser'}]} onChange={val => setForm({...form, baseRole: val})} />
          </div>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-sm outline-none w-full resize-none h-24" />
          
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Page Access</p>
            <div className="grid grid-cols-2 gap-2">
              {DASHBOARD_PAGE_OPTIONS.map(p => (
                <button key={p.key} onClick={() => togglePage(p.key)} className={`text-left p-3 rounded-xl border transition-all ${form.pageAccess.includes(p.key) ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-white/5 bg-slate-950/40'}`}>
                  <p className="text-xs font-semibold">{p.label}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-indigo-600 font-medium">
              {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Save Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


