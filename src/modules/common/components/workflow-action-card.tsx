import { Loader2, LucideIcon } from 'lucide-react';

export interface WorkflowAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant: 'emerald' | 'purple' | 'blue' | 'orange' | 'indigo' | 'rose' | 'sky';
  show: boolean;
  disabled?: boolean;
}

interface WorkflowActionCardProps {
  title?: string;
  actions: WorkflowAction[];
  loading?: boolean;
}

export default function WorkflowActionCard({ title = "Actions", actions, loading = false }: WorkflowActionCardProps) {
  const visibleActions = actions.filter(a => a.show);

  const variantMap: Record<string, string> = {
    emerald: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20",
    purple: "bg-purple-600 hover:bg-purple-500 shadow-purple-900/20",
    blue: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20",
    orange: "bg-orange-600 hover:bg-orange-500 shadow-orange-900/20",
    indigo: "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20",
    rose: "bg-rose-600 hover:bg-rose-500 shadow-rose-900/20",
    sky: "bg-sky-600 hover:bg-sky-500 shadow-sky-900/20",
  };

  return (
    <div className="space-y-3 rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 animate-fade-in">
      <h3 className="text-base font-semibold text-[var(--app-text)] mb-4">{title}</h3>
      
      <div className="space-y-3">
        {visibleActions.map((action, idx) => (
          <button
            key={idx}
            onClick={action.onClick}
            disabled={loading || action.disabled}
            className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 ${variantMap[action.variant] || variantMap.indigo}`}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <action.icon size={18} />
                {action.label}
              </>
            )}
          </button>
        ))}

        {visibleActions.length === 0 && (
          <p className="text-sm text-[var(--app-muted)] text-center italic py-2">No actions available</p>
        )}
      </div>
    </div>
  );
}
