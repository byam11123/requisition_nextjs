import { Clock3, CheckCircle2, XCircle, CalendarCheck2 } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export function AttendanceStats({ 
  stats,
  activeFilter = 'ALL',
  onFilterChange
}: { 
  stats: any;
  activeFilter?: string;
  onFilterChange?: (f: string) => void;
}) {
  const data = [
    { title: 'Pending Approval', value: stats.pending, icon: Clock3, tone: 'amber', key: 'PENDING' },
    { title: 'Approved Trips', value: stats.approved, icon: CheckCircle2, tone: 'emerald', key: 'APPROVED' },
    { title: 'Rejected Entries', value: stats.rejected, icon: XCircle, tone: 'rose', key: 'REJECTED' },
    { title: 'Total Slips', value: stats.total, icon: CalendarCheck2, tone: 'purple', key: 'ALL' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {data.map(s => (
        <StatCard 
          key={s.title} 
          title={s.title} 
          value={s.value} 
          icon={s.icon} 
          tone={s.tone as any} 
          active={activeFilter === s.key}
          onClick={() => onFilterChange?.(s.key)}
        />
      ))}
    </div>
  );
}
