import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatDate } from '@/utils/format';

interface ActivityItem {
  id: string;
  module: string;
  title: string;
  description: string;
  timestamp: string;
  href: string;
  tone: string;
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  const toneClasses: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    sky: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    purple: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  };

  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--app-text)]">Recent Activity</h2>
      <p className="mt-1 text-xs text-[var(--app-muted)]">Latest operational movement.</p>
      
      <div className="mt-4 space-y-2.5">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={activity.href}
            className="block rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3 transition-all hover:bg-[var(--app-surface-strong)]"
          >
            <div className="flex justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${toneClasses[activity.tone]}`}>
                    {activity.module}
                  </span>
                  <p className="text-sm font-semibold">{activity.title}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--app-muted)]">{activity.description}</p>
                <p className="mt-1 text-[10px] text-[var(--app-muted)]">{formatDate(activity.timestamp)}</p>
              </div>
              <ArrowRight size={16} className="text-[var(--app-muted)]" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
