import Link from 'next/link';
import { Boxes, ReceiptText, Wrench, Fuel, CalendarCheck2, HandCoins, Users } from 'lucide-react';
import { canAccessDashboardPath } from '@/lib/config/page-access';

export function QuickLinks({ user }: { user: any }) {
  const links = [
    { label: "New Requisition", href: "/dashboard/requisition/create", icon: ReceiptText },
    { label: "New Repair", href: "/dashboard/repair-maintenance/create", icon: Wrench },
    { label: "New Inventory", href: "/dashboard/store/items/create", icon: Boxes },
    { label: "New Fuel", href: "/dashboard/vehicle-fuel/create", icon: Fuel },
    { label: "New Attendance", href: "/dashboard/attendance/create", icon: CalendarCheck2 },
    { label: "New Salary Adv.", href: "/dashboard/salary-advance/create", icon: HandCoins },
    { label: "Users", href: "/dashboard/users", icon: Users },
  ].filter(l => canAccessDashboardPath(l.href, user.role, user.pageAccess, user.rolePageAccess));

  return (
    <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
      <h2 className="text-lg font-semibold text-[var(--app-text)]">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] transition-all hover:bg-[var(--app-accent-soft)]/20 hover:border-[var(--app-accent-border)] group"
          >
            <link.icon className="text-[var(--app-muted)] transition-colors group-hover:text-[var(--app-accent)]" size={20} />
            <span className="mt-2 text-xs font-medium text-center">{link.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
