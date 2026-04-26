import { Clock3, CheckCircle2, WalletCards } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export function SalaryStats({ 
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
    { title: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'emerald', key: 'APPROVED' },
    { title: 'Total Requests', value: stats.total, icon: WalletCards, tone: 'purple', key: 'ALL' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
