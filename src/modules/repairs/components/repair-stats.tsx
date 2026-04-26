import { Clock, CheckCircle2, Truck, ReceiptText } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export function RepairStats({ 
  stats,
  activeFilter = 'ALL',
  onFilterChange
}: { 
  stats: any;
  activeFilter?: string;
  onFilterChange?: (f: string) => void;
}) {
  const data = [
    { title: 'Pending Approval', value: stats.pending, icon: Clock, tone: 'amber', key: 'PENDING' },
    { title: 'In Transit', value: stats.inTransit, icon: Truck, tone: 'sky', key: 'IN_TRANSIT' },
    { title: 'Completed', value: stats.completed, icon: CheckCircle2, tone: 'emerald', key: 'COMPLETED' },
    { title: 'Total Cases', value: stats.total, icon: ReceiptText, tone: 'purple', key: 'ALL' },
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
