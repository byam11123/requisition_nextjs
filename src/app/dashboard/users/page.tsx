"use client";

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, MoreVertical, CheckCircle, XCircle, Trash2, Loader2, AlertCircle, X, ShieldCheck } from 'lucide-react';

import ActionToast from '../action-toast';
import PageAccessModal from './page-access-modal';

const MOCK_USERS = [
  { id: '9998', email: 'manager@example.com', fullName: 'Mike Manager', role: 'MANAGER', designation: 'Senior Manager', department: 'Operations', isActive: true },
  { id: '9997', email: 'purchaser@example.com', fullName: 'Paul Purchaser', role: 'PURCHASER', designation: 'Purchase Officer', department: 'Procurement', isActive: true },
  { id: '9996', email: 'accountant@example.com', fullName: 'Alice Accountant', role: 'ACCOUNTANT', designation: 'Finance Exec', department: 'Finance', isActive: true },
  { id: '9995', email: 'inactive@example.com', fullName: 'Jack Old', role: 'PURCHASER', designation: '-', department: '-', isActive: false },
];

function CreateUserModal({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'PURCHASER', designation: '', department: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string) => (e: any) => setForm(f => ({ ...f, [k]: e.target.value }));
  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      onSuccess();
    } catch (err: any) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-slate-950/50 border border-white/5 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-indigo-500/50 text-sm placeholder:text-slate-600";
  const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-100">Add New User</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-slate-400"><X size={20} /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className={labelCls}>Full Name</label><input value={form.fullName} onChange={set('fullName')} required className={inputCls} /></div>
          <div><label className={labelCls}>Email Address</label><input type="email" value={form.email} onChange={set('email')} required className={inputCls} /></div>
          <div><label className={labelCls}>Password</label><input type="password" value={form.password} onChange={set('password')} required minLength={8} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Role</label>
            <select value={form.role} onChange={set('role')} className={inputCls}>
              <option value="PURCHASER">Purchaser (Create Requisitions)</option>
              <option value="MANAGER">Manager (Approve Requisitions)</option>
              <option value="ACCOUNTANT">Accountant (Process Payments)</option>
              <option value="ADMIN">Admin (Manage Organization)</option>
            </select>
          </div>
          <div><label className={labelCls}>Designation</label><input value={form.designation} onChange={set('designation')} className={inputCls} /></div>
          <div><label className={labelCls}>Department</label><input value={form.department} onChange={set('department')} className={inputCls} /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
              {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [menuUser, setMenuUser] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [accessUser, setAccessUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setUsers(await res.json());
      else setUsers(MOCK_USERS); // bypass fallback
    } catch { setUsers(MOCK_USERS); }
    finally { setLoading(false); }
  };

  const execAction = async (userId: string, action: string) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/users/${userId}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setMenuUser(null);
      loadUsers();
    } catch { alert(`${action} failed`); }
    finally { setActionLoading(false); }
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) || u.designation?.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const roleBadge = (role: string) => {
    const m: any = {
      ADMIN: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      MANAGER: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      PURCHASER: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      ACCOUNTANT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    };
    return `inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${m[role] || ''}`;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <ActionToast
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100">User Management</h1>
        <button id="btn-add-user" onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20">
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search users..."
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-indigo-500/50 text-slate-200 placeholder:text-slate-600" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-300">
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="MANAGER">Manager</option>
          <option value="PURCHASER">Purchaser</option>
          <option value="ACCOUNTANT">Accountant</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-950/50 border border-white/5 rounded-xl px-3 py-2.5 text-sm outline-none text-slate-300">
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                    Loading...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-500">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-400">
                        {u.fullName?.[0]?.toUpperCase()}
                      </div>
                      {u.fullName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{u.email}</td>
                  <td className="px-6 py-4"><span className={roleBadge(u.role)}>{u.role}</span></td>
                  <td className="px-6 py-4 text-slate-400">{u.designation || '-'}</td>
                  <td className="px-6 py-4 text-slate-400">{u.department || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full border ${u.isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block">
                      <button id={`btn-menu-${u.id}`} onClick={() => setMenuUser(menuUser?.id === u.id ? null : u)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                      {menuUser?.id === u.id && (
                        <div className="absolute right-0 top-9 z-10 bg-slate-800 border border-white/10 rounded-2xl p-2 shadow-2xl w-48">
                          {u.isActive
                            ? <button onClick={() => execAction(u.id, 'deactivate')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-xl">
                                <XCircle size={16} className="text-amber-400" /> Deactivate
                              </button>
                            : <button onClick={() => execAction(u.id, 'activate')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-xl">
                                <CheckCircle size={16} className="text-emerald-400" /> Activate
                              </button>
                          }
                          <button onClick={() => { setAccessUser(u); setMenuUser(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-xl">
                            <ShieldCheck size={16} className="text-indigo-400" /> Page Access
                          </button>
                          <button onClick={() => { if (confirm(`Delete ${u.fullName}?`)) execAction(u.id, 'delete'); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-xl">
                            <Trash2 size={16} /> Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={() => { setCreateOpen(false); loadUsers(); }} />
      <PageAccessModal
        key={`${accessUser?.id ?? 'closed'}-${accessUser?.pageAccess?.join(',') ?? 'default'}`}
        open={!!accessUser}
        user={accessUser}
        onClose={() => setAccessUser(null)}
        onToast={(message, tone = 'success') => setToast({ message, tone })}
        onSaved={(pageAccess) => {
          const rawUser = window.localStorage.getItem('user');
          if (rawUser && accessUser?.id) {
            try {
              const storedUser = JSON.parse(rawUser);
              if (String(storedUser.id) === String(accessUser.id)) {
                window.localStorage.setItem('user', JSON.stringify({ ...storedUser, pageAccess }));
              }
            } catch {
              // Keep dashboard working even if local storage user is malformed.
            }
          }

          setUsers((current) =>
            current.map((entry) =>
              entry.id === accessUser?.id ? { ...entry, pageAccess } : entry,
            ),
          );
        }}
      />
    </div>
  );
}
