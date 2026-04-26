"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Wrench, CalendarCheck2, HandCoins, FilePlus, Users, User, LogOut, Loader2, ChevronLeft, LucideIcon, Palette, ReceiptText, Settings2, ShieldCheck, BriefcaseBusiness, PhoneCall, Fuel, Boxes, Menu } from 'lucide-react';
import Link from 'next/link';

import AppFooter from '@/components/common/app-footer';
import AccessDenied from './access-denied';

import { canAccessDashboardPath, getDefaultDashboardPath } from '@/lib/config/page-access';
import UserNav from './components/layout/user-nav';
import { ThemeSwitcher } from '@/components/theme';
import { APP_THEMES } from '@/components/theme/theme-config';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';



type ThemeOptionKey = (typeof APP_THEMES)[number]["key"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, token, clearAuth, _hasHydrated } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (!token || !user) {
      router.push('/');
    } else {
      setAuthReady(true);
    }
  }, [_hasHydrated, token, user, router]);

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

  const canAccessCurrentPage = canAccessDashboardPath(
    pathname, 
    user.role, 
    (user as any).page_access_override, 
    (user as any).role_page_access
  );
  const fallbackHref = getDefaultDashboardPath(
    user.role, 
    (user as any).page_access_override, 
    (user as any).role_page_access
  );

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const navItem = (href: string, label: string, Icon: LucideIcon) => {
    const active =
      pathname === href ||
      (href === '/dashboard/requisition'
        ? pathname === '/dashboard' ||
          pathname.startsWith('/dashboard/requisition')
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
          <span className="block h-5 max-w-full overflow-hidden text-center text-[11px] font-medium leading-[1.05] text-[var(--app-muted)] group-hover:text-[var(--app-text)]">
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
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--app-muted)]">
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--app-border-strong)] bg-[var(--app-surface-strong)] text-[var(--app-muted)] shadow-xl transition-all hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent)] hover:text-white focus:outline-none ring-4 ring-[var(--app-bg)]/50"
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <ChevronLeft
              size={18}
              className={`mt-0.5 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`}
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


         <nav className={`flex-1 min-h-0 overflow-y-auto py-5 ${isSidebarOpen ? 'px-4' : 'px-3'} scrollbar-thin scrollbar-track-[var(--app-surface)] scrollbar-thumb-[var(--app-muted)] hover:scrollbar-thumb-[var(--app-text)]`}>
          {sectionLabel('Modules')}
          <div className="space-y-2">
            {canAccessDashboardPath('/dashboard/overview', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/overview', 'Dashboard', LayoutDashboard)}
            {canAccessDashboardPath('/dashboard/roles', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/roles', 'Custom Roles', ShieldCheck)}
            {canAccessDashboardPath('/dashboard/designations', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/designations', 'Designations', BriefcaseBusiness)}
            {canAccessDashboardPath('/dashboard/contact-manager', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/contact-manager', 'Contact Manager', PhoneCall)}
            {canAccessDashboardPath('/dashboard/store', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/store', 'Store Management', Boxes)}
            {canAccessDashboardPath('/dashboard/workflow', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/workflow', 'Workflow Config', Settings2)}
            {canAccessDashboardPath('/dashboard/requisition', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/requisition', 'Requisition', ReceiptText)}
      {canAccessDashboardPath('/dashboard/repair-maintenance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/repair-maintenance', 'Repair & Maintenance', Wrench)}
            {canAccessDashboardPath('/dashboard/vehicle-fuel', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/vehicle-fuel', 'Vehicle Daily Fuel', Fuel)}
            {canAccessDashboardPath('/dashboard/attendance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/attendance', 'Attendance', CalendarCheck2)}
            {canAccessDashboardPath('/dashboard/salary-advance', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/salary-advance', 'Salary Advance', HandCoins)}
            {canAccessDashboardPath('/dashboard/users', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/users', 'Manage Users', Users)}
            {canAccessDashboardPath('/dashboard/profile', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/profile', 'Profile', User)}
          </div>

          {(canAccessDashboardPath('/dashboard/requisition/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/store/items/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/repair-maintenance/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/vehicle-fuel/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess, user.rolePageAccess) ||
            canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess, user.rolePageAccess)) && (
            <>
              <div className="mt-6" />
              {sectionLabel('Quick Create')}
              <div className="space-y-2">
                {canAccessDashboardPath('/dashboard/requisition/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/requisition/create', 'New Requisition', FilePlus)}
                {canAccessDashboardPath('/dashboard/store/items/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/store/items/create', 'New Store Item', FilePlus)}
                {canAccessDashboardPath('/dashboard/repair-maintenance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/repair-maintenance/create', 'New Repair Request', FilePlus)}
                {canAccessDashboardPath('/dashboard/vehicle-fuel/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/vehicle-fuel/create', 'New Vehicle Fuel', FilePlus)}
                {canAccessDashboardPath('/dashboard/attendance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/attendance/create', 'New Attendance', FilePlus)}
                {canAccessDashboardPath('/dashboard/salary-advance/create', user.role, user.pageAccess, user.rolePageAccess) && navItem('/dashboard/salary-advance/create', 'New Salary Advance', FilePlus)}
              </div>
            </>
          )}
          {isSidebarOpen && (
            <>
              <div className="mt-8" />
              {sectionLabel('Aesthetics')}
              <div className="px-1.5 flex justify-center">
                <ThemeSwitcher compact />
              </div>
            </>
          )}
        </nav>


        <div className="border-t border-[var(--app-border)] p-4 pt-2">
            <UserNav 
              user={user} 
              isSidebarOpen={isSidebarOpen} 
              onLogout={handleLogout} 
            />
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

