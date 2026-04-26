import { Building2, PhoneCall, Edit2, Trash2 } from 'lucide-react';

export function ContactCard({ contact, onEdit, onDelete }: any) {
  return (
    <div className="group relative rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all hover:border-[var(--app-accent)] hover:shadow-xl hover:shadow-[var(--app-accent-soft)]">
      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100 flex gap-1">
        <button onClick={onEdit} className="h-8 w-8 flex items-center justify-center rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[var(--app-accent)]/20 transition-colors"><Edit2 size={14}/></button>
        <button onClick={onDelete} className="h-8 w-8 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition-colors"><Trash2 size={14}/></button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-lg font-bold text-[var(--app-accent-strong)] ring-1 ring-[var(--app-border)]">
          {contact.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="font-semibold text-[var(--app-text)] truncate">{contact.name}</h3>
          <p className="text-xs text-[var(--app-muted)] flex items-center gap-2">
            <span>{contact.role || 'Personnel'}</span>
            {contact.department && <><span className="h-1 w-1 rounded-full bg-slate-700"/> <Building2 size={10}/> {contact.department}</>}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-[var(--app-panel)] p-4 border border-[var(--app-border-soft)]">
        {contact.phones.map((p:string) => (
          <div key={p} className="flex items-center gap-3 text-sm">
            <PhoneCall size={14} className="text-[var(--app-accent)]" />
            <span>{p}</span>
          </div>
        ))}
      </div>

      {contact.notes && (
        <p className="mt-4 pt-4 border-t border-[var(--app-border-soft)] text-[11px] text-[var(--app-muted)] italic line-clamp-2">{contact.notes}</p>
      )}
    </div>
  );
}
