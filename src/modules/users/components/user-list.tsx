import { MoreVertical, CheckCircle, XCircle, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface UserListProps {
  users: any[];
  onAction: (userId: string, action: string) => void;
  onPageAccess: (user: any) => void;
  onRoleAssign: (user: any) => void;
  onDelete: (user: any) => void;
}

export function UserList({ users, onAction, onPageAccess, onRoleAssign, onDelete }: UserListProps) {
  const [menuUser, setMenuUser] = useState<string | null>(null);

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
    <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-[var(--app-panel)] text-[var(--app-muted)] text-xs uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Department</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--app-border)]">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/[0.02]">
                <td className="px-6 py-4 font-medium">{u.fullName}</td>
                <td className="px-6 py-4 text-[var(--app-muted)]">{u.email}</td>
                <td className="px-6 py-4"><span className={roleBadge(u.role)}>{u.role}</span></td>
                <td className="px-6 py-4 text-[var(--app-muted)]">{u.department || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${u.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right relative">
                  <button onClick={() => setMenuUser(menuUser === u.id ? null : u.id)} className="p-2 hover:bg-[var(--app-panel)] rounded-lg">
                    <MoreVertical size={16} />
                  </button>
                  {menuUser === u.id && (
                    <div className="absolute right-6 top-12 z-20 w-48 bg-[var(--app-surface-strong)] border border-[var(--app-border-strong)] rounded-xl p-2 shadow-xl animate-fade-in">
                      <button onClick={() => onAction(u.id, u.isActive ? 'deactivate' : 'activate')} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--app-panel)] rounded-lg">
                        {u.isActive ? <XCircle size={14} className="text-amber-400" /> : <CheckCircle size={14} className="text-emerald-400" />}
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => { onPageAccess(u); setMenuUser(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--app-panel)] rounded-lg">
                        <ShieldCheck size={14} className="text-indigo-400" /> Page Access
                      </button>
                      <button onClick={() => { onRoleAssign(u); setMenuUser(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--app-panel)] rounded-lg">
                        <Edit size={14} className="text-sky-400" /> Custom Role
                      </button>
                      <button onClick={() => { onDelete(u); setMenuUser(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-rose-500/10 text-rose-400 rounded-lg">
                        <Trash2 size={14} /> Delete User
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
