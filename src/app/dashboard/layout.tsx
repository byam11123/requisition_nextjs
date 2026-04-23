"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, CalendarCheck2, HandCoins, FilePlus, Users, User, LogOut, Loader2, ChevronLeft, LucideIcon, ReceiptText } from 'lucide-react';
import Link from 'next/link';

import AccessDenied from './access-denied';
import { canAccessDashboardPath, getDefaultDashboardPath } from '@/lib/page-access';

type DashboardUser = {
  role?: string;
  fullName?: string;
  email?: string;
  pageAccess?: string[] | null;
};

function getStoredUser() {
  if (typeof window === 'undefined') {
    return null;
  }

  const userStr = window.localStorage.getItem('user');
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr) as DashboardUser;
  } catch {
    return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem('token');
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        setAuthReady(true);
        router.push('/');
        return;
      }

      setUser(storedUser);
      setAuthReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  if (!authReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const canAccessCurrentPage = canAccessDashboardPath(pathname, user.role, user.pageAccess);
  const fallbackHref = getDefaultDashboardPath(user.role, user.pageAccess);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const navItem = (href: string, label: string, Icon: LucideIcon) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        className={`group flex items-center rounded-xl transition-all ${
          isSidebarOpen ? 'gap-3 px-3 py-3' : 'mx-auto h-16 w-16 flex-col justify-center gap-1 px-1'
        } ${
          active
            ? 'bg-indigo-500/10 text-indigo-400 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
        }`}
        title={label}
      >
        <Icon
          size={isSidebarOpen ? 18 : 16}
          className={`shrink-0 transition-colors ${
            active ? 'text-indigo-300' : 'text-slate-400 group-hover:text-slate-200'
          }`}
        />
        {isSidebarOpen ? (
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{label}</span>
          </div>
        ) : (
          <span className="block h-5 max-w-full overflow-hidden text-center text-[9px] font-medium leading-[1.05] text-slate-500 group-hover:text-slate-300">
            {label}
          </span>
        )}
      </Link>
    );
  };

  const sectionLabel = (label: string) => {
    if (!isSidebarOpen) {
      return <div className="h-3" />;
    }

    return (
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className={`relative transition-all duration-300 bg-slate-900/50 border-r border-white/5 backdrop-blur-xl flex flex-col shrink-0 ${isSidebarOpen ? 'w-64' : 'w-22'}`}>
        {/* Toggle Button with larger hit area so expand/collapse feels reliable */}
        <div className="absolute right-0 top-6 z-50 translate-x-1/2 p-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-slate-400 shadow-md transition-all hover:border-indigo-500 hover:bg-indigo-600 hover:text-white focus:outline-none"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <ChevronLeft
              size={14}
              className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className={`border-b border-white/5 ${isSidebarOpen ? 'px-5 py-5' : 'flex justify-center px-0 py-5'}`}>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className={`rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0
            ${isSidebarOpen ? 'w-11 h-11' : 'w-12 h-12'}`}>
            <span className="font-bold text-white text-sm">RH</span>
          </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-100">Requisition Hub</p>
                <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-500">Operations Panel</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto py-5 ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
          {sectionLabel('Modules')}
          <div className="space-y-2">
            {canAccessDashboardPath('/dashboard/overview', user.role, user.pageAccess) && navItem('/dashboard/overview', 'Dashboard', LayoutDashboard)}
            {canAccessDashboardPath('/dashboard', user.role, user.pageAccess) && navItem('/dashboard', 'Requisition', ReceiptText)}
            {canAccessDashboardPath('/dashboard/repair-maintainance', user.role, user.pageAccess) && navItem('/dashboard/repair-maintainance', 'Repair & Maintainance', Wrench)}
            {canAccessDashboardPath('/dashboard/attendance', user.role, user.pageAccess) && navItem('/dashboard/attendance', 'Attendance', CalendarCheck2)}
            {canAccessDashboardPath('/dashboard/salary-advance', user.role, user.pageAccess) && navItem('/dashboard/salary-advance', 'Salary Advance', HandCoins)}
            {canAccessDashboardPath('/dashboard/users', user.role, user.pageAccess) && navItem('/dashboard/users', 'Manage Users', Users)}
            {canAccessDashboardPath('/dashboard/profile', user.role, user.pageAccess) && navItem('/dashboard/profile', 'Profile', User)}
          </div>

          {(canAccessDashboardPath('/dashboard/create', user.role, user.pageAccess) ||
            canAccessDashboardPath('/dashboard/repair-maintainance/create', user.role, user.pageAccess) ||
            canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess) ||
            canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess)) && (
            <>
              <div className="mt-6" />
              {sectionLabel('Quick Create')}
              <div className="space-y-2">
                {canAccessDashboardPath('/dashboard/create', user.role, user.pageAccess) && navItem('/dashboard/create', 'New Requisition', FilePlus)}
                {canAccessDashboardPath('/dashboard/repair-maintainance/create', user.role, user.pageAccess) && navItem('/dashboard/repair-maintainance/create', 'New Repair Request', FilePlus)}
                {canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess) && navItem('/dashboard/attendance/create', 'New Attendance', FilePlus)}
                {canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess) && navItem('/dashboard/salary-advance/create', 'New Salary Advance', FilePlus)}
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-white/5 p-4">
          {isSidebarOpen ? (
            <>
              <div className="mb-4 rounded-2xl border border-white/5 bg-slate-950/30 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-800">
                    <span className="text-sm font-semibold text-slate-400">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="truncate text-sm font-medium text-slate-200">{user.fullName || user.email}</p>
                    <p className="truncate text-xs uppercase tracking-[0.2em] text-slate-500">{user.role}</p>
                  </div>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-800" title={`${user.fullName || user.email} (${user.role})`}>
                <span className="text-sm font-semibold text-slate-400">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout}
                title="Logout"
                className="rounded-xl p-2 text-rose-400 transition-colors hover:bg-rose-500/10">
                <LogOut size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col">
        {/* Decorative background glow inside main content area */}
        <div className="absolute top-0 right-0 w-1/2 h-96 bg-indigo-500/10 blur-[120px] pointer-events-none -z-10 rounded-full" />
        
        <div className="p-8 flex-1">
          {canAccessCurrentPage ? children : <AccessDenied href={fallbackHref} />}
        </div>
      </main>
    </div>
  );
}
