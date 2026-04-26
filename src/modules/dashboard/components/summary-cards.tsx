import { LayoutDashboard, Clock3, Users, BellRing } from 'lucide-react';
import StatCard from '@/components/ui/stat-card';

interface SummaryCardsProps {
  data: {
    totalRecords: number;
    pendingApprovals: number;
    activeUsers: number;
    reminders: number;
  };
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const statCards = [
    {
      label: "Total Records",
      value: data.totalRecords,
      helper: "Across core modules",
      tone: "indigo",
      icon: LayoutDashboard,
    },
    {
      label: "Pending Approvals",
      value: data.pendingApprovals,
      helper: "Items waiting for review",
      tone: "amber",
      icon: Clock3,
    },
    {
      label: "Active Users",
      value: data.activeUsers,
      helper: "Contributing team members",
      tone: "sky",
      icon: Users,
    },
    {
      label: "Reminders",
      value: data.reminders,
      helper: "Needs follow-up",
      tone: "purple",
      icon: BellRing,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card) => (
        <StatCard
          key={card.label}
          title={card.label}
          value={card.value}
          icon={card.icon}
          tone={card.tone as any}
          helper={card.helper}
        />
      ))}
    </div>
  );
}
