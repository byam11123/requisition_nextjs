"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useRoles } from "@/modules/config/hooks/use-roles";
import { RoleCard } from "@/modules/config/components/role-card";
import { RoleModal } from "@/modules/config/components/role-modal";
import PageHeader from "@/app/dashboard/components/page-header";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function RolesPage() {
  const { roles, loading, deleteRole, refresh } = useRoles();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Custom Roles"
        subtitle="Manage business-specific roles and granular page permissions."
        actions={
          <button onClick={() => { setEditingRole(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
            <Plus size={16} /> New Role
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl italic">No custom roles defined yet</div>
        ) : (
          roles.map(role => (
            <RoleCard 
              key={role.key} 
              role={role} 
              onEdit={() => handleEdit(role)} 
              onDelete={() => setDeletingKey(role.key)} 
            />
          ))
        )}
      </div>

      <RoleModal 
        open={modalOpen} 
        role={editingRole} 
        onClose={() => setModalOpen(false)} 
        onSaved={refresh} 
      />

      <ConfirmationModal
        isOpen={!!deletingKey}
        onClose={() => setDeletingKey(null)}
        onConfirm={async () => {
          if (deletingKey) {
            await deleteRole(deletingKey);
            setDeletingKey(null);
          }
        }}
        title="Delete Role?"
        message="This will permanently delete the custom role. Users assigned to this role may lose access to dashboard features."
        confirmLabel="Delete Permanently"
        tone="danger"
      />
    </div>
  );
}

