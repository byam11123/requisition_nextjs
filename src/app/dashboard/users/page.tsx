"use client";
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';




import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '@/app/dashboard/components/page-header';
import { useUsers } from '@/modules/users/hooks/use-users';
import { UserList } from '@/modules/users/components/user-list';
import { CreateUserModal } from '@/modules/users/components/create-user-modal';
import PageAccessModal from '@/modules/users/components/page-access-modal';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import FilterDropdown from '@/components/ui/filter-dropdown';
import ActionToast from '../action-toast';

export default function UserManagementPage() {
  const { 
    users, loading, searchQuery, setSearchQuery, 
    roleFilter, setRoleFilter, statusFilter, setStatusFilter, refresh 
  } = useUsers();
  
  const [createOpen, setCreateOpen] = useState(false);
  const [accessUser, setAccessUser] = useState<any>(null);
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  const handleAction = async (userId: string, action: string) => {
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/users/${userId}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Action failed');
      setToast({ message: `User ${action}ed successfully`, tone: 'success' });
      refresh();
    } catch (err: any) {
      setToast({ message: err.message, tone: 'error' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && <ActionToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}

      <PageHeader 
        title="User Management" 
        actions={
          <button onClick={() => setCreateOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> Add User
          </button>
        }
      />

      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search users..." 
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-[var(--app-accent-border)]"
          />
        </div>
        <FilterDropdown label="Role" value={roleFilter} options={[{value:'ALL', label:'All Roles'}, {value:'ADMIN', label:'Admin'}]} onChange={setRoleFilter} />
        <FilterDropdown label="Status" value={statusFilter} options={[{value:'ALL', label:'All Status'}, {value:'ACTIVE', label:'Active'}]} onChange={setStatusFilter} />
      </div>

      <UserList 
        users={users} 
        onAction={handleAction} 
        onPageAccess={setAccessUser} 
        onRoleAssign={() => {}} 
        onDelete={setDeleteUser} 
      />

      <CreateUserModal 
        open={createOpen} 
        onClose={() => setCreateOpen(false)} 
        onSuccess={() => { setCreateOpen(false); refresh(); }} 
        roles={[]} 
        designations={[]} 
      />

      <PageAccessModal 
        open={!!accessUser} 
        user={accessUser} 
        onClose={() => setAccessUser(null)} 
        onToast={(m, t) => setToast({message: m, tone: t as any})} 
        onSaved={refresh} 
      />

      <ConfirmationModal 
        isOpen={!!deleteUser} 
        onClose={() => setDeleteUser(null)} 
        onConfirm={() => handleAction(deleteUser.id, 'delete')} 
        title="Delete User?" 
        message={`Are you sure you want to delete ${deleteUser?.fullName}?`} 
        tone="danger" 
      />
    </div>
  );
}





