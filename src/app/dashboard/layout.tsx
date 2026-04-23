"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, CalendarCheck2, HandCoins, FilePlus, Users, User, LogOut, Loader2, ChevronLeft, LucideIcon, ReceiptText, Settings2, ShieldCheck, BriefcaseBusiness, PhoneCall, Fuel, Boxes, Menu } from 'lucide-react';
import Link from 'next/link';

import AppFooter from '@/app/app-footer';
import AccessDenied from './access-denied';
import ThemeSwitcher from './components/theme-switcher';
import { canAccessDashboardPath, getDefaultDashboardPath } from '@/lib/page-access';

type DashboardUser = {
  role?: string;
  baseRole?: string;
  customRoleKey?: string;
  customRoleName?: string;
  rolePageAccess?: string[] | null;
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

  useEffect(() => {
    const syncSidebarForViewport = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    syncSidebarForViewport();
    window.addEventListener('resize', syncSidebarForViewport);
    return () => window.removeEventListener('resize', syncSidebarForViewport);
  }, []);

  if (!authReady || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[var(--app-accent)]">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  const canAccessCurrentPage = canAccessDashboardPath(pathname, user.role, user.pageAccess, user.rolePageAccess);
  const fallbackHref = getDefaultDashboardPath(user.role, user.pageAccess, user.rolePageAccess);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const navItem = (href: string, label: string, Icon: LucideIcon) => {
    const active =
      pathname === href ||
      (href === '/dashboard/requisition'
        ? pathname === '/dashboard' ||
          pathname.startsWith('/dashboard/requisition') ||
          pathname.startsWith('/dashboard/req') ||
          pathname.startsWith('/dashboard/edit')
        : href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link
        href={href}
        onClick={() => {
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setIsSidebarOpen(false);
          }
        }}
        className={`group flex items-center rounded-xl transition-all ${
          isSidebarOpen ? 'gap-3 px-3 py-3' : 'mx-auto h-16 w-16 flex-col justify-center gap-1 px-1'
        } ${
          active
            ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent-strong)] shadow-[inset_0_0_0_1px_var(--app-accent-border)]'
            : 'text-[var(--app-muted)] hover:bg-white/5 hover:text-[var(--app-text)]'
        }`}
        title={label}
      >
        <Icon
          size={isSidebarOpen ? 18 : 16}
          className={`shrink-0 transition-colors ${
            active ? 'text-[var(--app-accent-strong)]' : 'text-[var(--app-muted)] group-hover:text-[var(--app-text)]'
          }`}
        />
        {isSidebarOpen ? (
          <div className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{label}</span>
          </div>
        ) : (
          <span className="block h-5 max-w-full overflow-hidden text-center text-[9px] font-medium leading-[1.05] text-[var(--app-muted)] group-hover:text-[var(--app-text)]">
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
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
        {label}
      </p>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-[var(--app-border)] bg-[var(--app-surface)] backdrop-blur-xl transition-all duration-300 lg:relative lg:z-auto ${
          isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-22'
        }`}
        style={{
          backgroundImage: 'var(--app-sidebar-wash)',
        }}
      >
        {/* Toggle Button with larger hit area so expand/collapse feels reliable */}
        <div className="absolute right-0 top-6 z-50 hidden translate-x-1/2 p-2 lg:block">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-md transition-all hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent)] hover:text-white focus:outline-none"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <ChevronLeft
              size={14}
              className={`transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <div className={`border-b border-[var(--app-border)] ${isSidebarOpen ? 'px-5 py-5' : 'flex justify-center px-0 py-5'}`}>
          <div className={`flex items-center ${isSidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className={`rounded-2xl flex items-center justify-center shrink-0 shadow-lg
            ${isSidebarOpen ? 'w-11 h-11' : 'w-12 h-12'}`}>
              <div
                className="flex h-full w-full items-center justify-center rounded-2xl"
                style={{
                  background: `linear-gradient(135deg, var(--app-logo-start), var(--app-logo-end))`,
                  boxShadow: `0 16px 40px color-mix(in srgb, var(--app-accent) 24%, transparent)`,
                }}
              >
                <span className="font-bold text-white text-sm">RH</span>
              </div>
            </div>
            {isSidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[var(--app-text)]">Requisition Hub</p>
                <p className="truncate text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">Operations Panel</p>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 overflow-y-auto py-5 ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
          {sectionLabel('Modules')}
          <div className="space-y-2">
            {canAccessDashboardPath('/dashboard/overview', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/overview', 'Dashboard', LayoutDashboard)}
            {canAccessDashboardPath('/dashboard/roles', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/roles', 'Custom Roles', ShieldCheck)}
            {canAccessDashboardPath('/dashboard/designations', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/designations', 'Designations', BriefcaseBusiness)}
            {canAccessDashboardPath('/dashboard/contact-manager', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/contact-manager', 'Contact Manager', PhoneCall)}
            {canAccessDashboardPath('/dashboard/store', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/store', 'Store Management', Boxes)}
            {canAccessDashboardPath('/dashboard/workflow', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/workflow', 'Workflow Config', Settings2)}
            {canAccessDashboardPath('/dashboard/requisition', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/requisition', 'Requisition', ReceiptText)}
      {canAccessDashboardPath('/dashboard/repair-maintainance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/repair-maintainance', 'Repair & Maintenance', Wrench)}
            {canAccessDashboardPath('/dashboard/vehicle-fuel', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/vehicle-fuel', 'Vehicle Daily Fuel', Fuel)}
            {canAccessDashboardPath('/dashboard/attendance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/attendance', 'Attendance', CalendarCheck2)}
            {canAccessDashboardPath('/dashboard/salary-advance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/salary-advance', 'Salary Advance', HandCoins)}
            {canAccessDashboardPath('/dashboard/users', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/users', 'Manage Users', Users)}
            {canAccessDashboardPath('/dashboard/profile', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/profile', 'Profile', User)}
          </div>

          {(canAccessDashboardPath('/dashboard/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/store/items/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/repair-maintainance/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/vehicle-fuel/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess, user.rolePageAccess)) && (
            <>
              <div className="mt-6" />
              {sectionLabel('Quick Create')}
              <div className="space-y-2">
                {canAccessDashboardPath('/dashboard/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/create', 'New Requisition', FilePlus)}
                {canAccessDashboardPath('/dashboard/store/items/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/store/items/create', 'New Store Item', FilePlus)}
                {canAccessDashboardPath('/dashboard/repair-maintainance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/repair-maintainance/create', 'New Repair Request', FilePlus)}
                {canAccessDashboardPath('/dashboard/vehicle-fuel/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/vehicle-fuel/create', 'New Vehicle Fuel', FilePlus)}
                {canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/attendance/create', 'New Attendance', FilePlus)}
                {canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/salary-advance/create', 'New Salary Advance', FilePlus)}
              </div>
            </>
          )}
        </nav>

        <div className="border-t border-[var(--app-border)] p-4">
          {isSidebarOpen ? (
            <>
              <div className="mb-4">
                <ThemeSwitcher />
              </div>
              <div className="mb-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-panel)] p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)]">
                    <span className="text-sm font-semibold text-[var(--app-muted)]">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 overflow-hidden">
                    <p className="truncate text-sm font-medium text-[var(--app-text)]">{user.fullName || user.email}</p>
                    <p className="truncate text-xs uppercase tracking-[0.2em] text-[var(--app-muted)]">{user.customRoleName || user.role}</p>
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
              <ThemeSwitcher compact />
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)]" title={`${user.fullName || user.email} (${user.role})`}>
                <span className="text-sm font-semibold text-[var(--app-muted)]">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
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
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Decorative background glow inside main content area */}
        <div className="absolute top-0 right-0 w-1/2 h-96 pointer-events-none -z-10 rounded-full blur-[120px]" style={{ background: 'var(--app-glow)' }} />

        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="absolute left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] text-[var(--app-text)] shadow-lg lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pt-16 sm:p-5 sm:pt-18 lg:p-8 lg:pt-8">
          {canAccessCurrentPage ? children : <AccessDenied href={fallbackHref} />}
        </div>
        <AppFooter
          mode="dashboard"
          className="shrink-0 border-t border-[var(--app-border)] bg-[var(--app-surface-strong)] px-4 py-3 text-center backdrop-blur-xl sm:px-6 lg:px-8"
        />
      </main>
    </div>
  );
}
