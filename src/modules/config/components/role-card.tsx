import { UserCog, Pencil, Trash2 } from 'lucide-react';
import ActionIconButton from '@/components/ui/action-icon-button';

export function RoleCard({ role, onEdit, onDelete }: any) {
  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <UserCog size={20} />
          </div>
          {!role.isSystem && (
            <div className="flex gap-2">
              <ActionIconButton onClick={onEdit} icon={Pencil} label="Edit" tone="slate" />
              <ActionIconButton onClick={onDelete} icon={Trash2} label="Delete" tone="rose" />
            </div>
          )}
        </div>
        <h3 className="text-lg font-semibold mt-4">{role.name}</h3>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{role.baseRole}</p>
        <p className="text-sm text-slate-400 mt-3">{role.description || "No description provided."}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5 focus:border-red">
        {role.pageAccess.map((p: string) => (
          <span key={p} className="px-2 py-0.5 rounded-full bg-slate-950/50 border border-white/5 text-[10px] text-slate-400">
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
