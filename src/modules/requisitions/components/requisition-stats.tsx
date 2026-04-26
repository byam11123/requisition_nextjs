import { Clock, CheckCircle, IndianRupee, ReceiptText } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

interface StatsProps {
  stats: {
    pending: number;
    approved: number;
    toPay: number;
    total: number;
  };
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function RequisitionStats({ stats, activeFilter, onFilterChange }: StatsProps) {
  const statData = [
    { title: 'Pending', value: stats.pending, icon: Clock, color: 'amber', filter: 'PENDING' },
    { title: 'Approved', value: stats.approved, icon: CheckCircle, color: 'emerald', filter: 'APPROVED' },
    { title: 'To Pay', value: stats.toPay, icon: IndianRupee, color: 'sky', filter: 'TOPAY' },
    { title: 'Total', value: stats.total, icon: ReceiptText, color: 'purple', filter: 'ALL' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statData.map((s) => (
        <StatCard
          key={s.filter}
          title={s.title}
          value={s.value}
          icon={s.icon}
          tone={s.color as any}
          active={activeFilter === s.filter}
          onClick={() => onFilterChange(s.filter)}
        />
      ))}
    </div>
  );
}
