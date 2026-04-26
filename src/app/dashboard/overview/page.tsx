"use client";

import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useDashboard } from '@/modules/dashboard/hooks/use-dashboard';
import { SummaryCards } from '@/modules/dashboard/components/summary-cards';
import { RecentActivity } from '@/modules/dashboard/components/recent-activity';
import { QuickLinks } from '@/modules/dashboard/components/quick-links';
import PageHeader from '@/app/dashboard/components/page-header';
import { Clock } from 'lucide-react';

import { ActivityTrendChart, ModuleDistributionChart } from '@/modules/dashboard/components/dashboard-charts';

export default function OverviewDashboardPage() {
  const { user } = useAuthStore();
  const { summary, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Clock className="animate-pulse text-indigo-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader 
        title={`Welcome, ${user?.fullName || 'User'}`} 
        subtitle="Here's what's happening in your organization today."
      />

      {summary && <SummaryCards data={summary.summaryCards} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-[var(--app-text)]">Activity Trends</h2>
                <p className="text-xs text-[var(--app-muted)] mt-1">Daily interaction volume over the last 7 days.</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--app-accent-soft)]/30 text-[var(--app-accent)] border border-[var(--app-accent-border)]/20">
                  <span className="w-2 h-2 rounded-full bg-[var(--app-accent)] shadow-[0_0_8px_var(--app-accent)]" /> Requisitions
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> Repairs
                </div>
              </div>
            </div>
            <div className="h-[320px]">
              {summary && <ActivityTrendChart data={summary.trends} />}
            </div>
          </div>
          
          {summary && <RecentActivity activities={summary.recentActivity} />}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--app-text)] mb-1">Module Distribution</h2>
            <p className="text-xs text-[var(--app-muted)] mb-6">Resource allocation by department.</p>
            <div className="h-[300px]">
              {summary && <ModuleDistributionChart data={[
                { label: 'Requisitions', value: summary.summaryCards.totalRecords - summary.summaryCards.reminders },
                { label: 'Repairs', value: summary.summaryCards.reminders || 2 },
                { label: 'Fuel/Misc', value: 3 },
              ]} />}
            </div>
          </div>

          {user && <QuickLinks user={user} />}
          
          <div className="rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
            <h2 className="text-lg font-semibold text-[var(--app-text)]">System Pulse</h2>
            <div className="mt-4 text-sm text-[var(--app-muted)]">
              All systems operational.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

