import { ReceiptText, CheckCircle2, Fuel, XCircle } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

export function FuelStats({ 
  stats,
  activeFilter = 'ALL',
  onFilterChange
}: { 
  stats: any;
  activeFilter?: string;
  onFilterChange?: (f: string) => void;
}) {
  const data = [
    { title: 'Pending Approval', value: stats.pending, icon: ReceiptText, tone: 'amber', key: 'PENDING' },
    { title: 'Approved', value: stats.approved, icon: CheckCircle2, tone: 'sky', key: 'APPROVED' },
    { title: 'Completed', value: stats.completed, icon: Fuel, tone: 'emerald', key: 'COMPLETED' },
    { title: 'Total Requests', value: stats.total, icon: Fuel, tone: 'purple', key: 'ALL' },
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
