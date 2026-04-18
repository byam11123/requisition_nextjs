"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, FilePlus, Users, User, LogOut, Loader2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/');
    } else {
      setUser(JSON.parse(userStr));
    }
  }, [router]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const navItem = (href: string, label: string, Icon: any) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return (
      <Link href={href}
        className={`flex items-center ${isSidebarOpen ? 'gap-3 px-3' : 'justify-center px-0'} py-2.5 rounded-xl font-medium transition-all
          ${active ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        title={!isSidebarOpen ? label : undefined}>
        <Icon size={20} className="shrink-0" />
        {isSidebarOpen && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Sidebar */}
      <aside className={`relative transition-all duration-300 bg-slate-900/50 border-r border-white/5 backdrop-blur-xl flex flex-col shrink-0 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        {/* Toggle Button attached to the border line */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 z-50 flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-indigo-600 hover:border-indigo-500 shadow-md transition-all focus:outline-none"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${!isSidebarOpen && 'rotate-180'}`} />
        </button>

        <div className={`h-16 flex items-center border-b border-white/5 ${isSidebarOpen ? 'px-6' : 'justify-center px-0'}`}>
          <div className={`rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0
            ${isSidebarOpen ? 'w-8 h-8 mr-3' : 'w-10 h-10'}`}>
            <span className="font-bold text-white text-sm">RH</span>
          </div>
          {isSidebarOpen && <span className="font-bold text-lg text-slate-100 truncate">Requisition Hub</span>}
        </div>

        <nav className={`flex-1 overflow-y-auto py-6 space-y-2 ${isSidebarOpen ? 'px-4' : 'px-3'}`}>
          {navItem('/dashboard', 'Dashboard', LayoutDashboard)}
          {user.role === 'PURCHASER' && navItem('/dashboard/create', 'New Requisition', FilePlus)}
          {user.role === 'ADMIN' && navItem('/dashboard/users', 'Manage Users', Users)}
          {navItem('/dashboard/profile', 'Profile', User)}
        </nav>

        <div className="p-4 border-t border-white/5">
          {isSidebarOpen ? (
            <>
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-slate-400 font-semibold text-sm">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-200 truncate">{user.fullName || user.email}</p>
                  <p className="text-xs text-slate-500 truncate">{user.role}</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center mb-2" title={`${user.fullName || user.email} (${user.role})`}>
                <span className="text-slate-400 font-semibold text-sm">{user.fullName?.[0] || user.email?.[0]?.toUpperCase()}</span>
              </div>
              <button onClick={handleLogout}
                title="Logout"
                className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors">
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
          {children}
        </div>
      </main>
    </div>
  );
}
