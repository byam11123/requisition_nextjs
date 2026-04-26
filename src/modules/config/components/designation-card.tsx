import { BriefcaseBusiness, Pencil, Trash2 } from 'lucide-react';
import ActionIconButton from '@/components/ui/action-icon-button';

export function DesignationCard({ designation, roles, onEdit, onDelete }: any) {
  const roleName = roles.find((r: any) => r.key === designation.defaultCustomRoleKey)?.name || "No auto-role";

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
            <BriefcaseBusiness size={18} />
          </div>
          <h3 className="text-lg font-semibold mt-4">{designation.name}</h3>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{designation.department || "Universal"}</p>
          <p className="text-sm text-slate-400 mt-3">{designation.description || "No description provided."}</p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Auto-fill Role</p>
            <p className="text-xs font-medium text-slate-300 mt-1">{roleName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ActionIconButton onClick={onEdit} icon={Pencil} label="Edit" tone="slate" />
          <ActionIconButton onClick={onDelete} icon={Trash2} label="Delete" tone="rose" />
        </div>
      </div>
    </div>
  );
}
