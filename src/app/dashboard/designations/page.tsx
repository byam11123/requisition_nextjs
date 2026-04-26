"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { useDesignations } from "@/modules/config/hooks/use-designations";
import { DesignationCard } from "@/modules/config/components/designation-card";
import { DesignationModal } from "@/modules/config/components/designation-modal";
import PageHeader from "@/app/dashboard/components/page-header";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function DesignationsPage() {
  const { designations, roles, loading, remove, refresh } = useDesignations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Designations"
        subtitle="Manage job titles and their default capability mappings."
        actions={
          <button onClick={() => { setEditingItem(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
            <Plus size={16} /> New Designation
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><Loader2 size={32} className="animate-spin text-indigo-500" /></div>
        ) : designations.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-500 border border-dashed border-white/10 rounded-3xl italic">No designations defined yet</div>
        ) : (
          designations.map(item => (
            <DesignationCard 
              key={item.key} 
              designation={item} 
              roles={roles}
              onEdit={() => handleEdit(item)} 
              onDelete={() => setDeletingKey(item.key)} 
            />
          ))
        )}
      </div>

      <DesignationModal 
        open={modalOpen} 
        designation={editingItem} 
        roles={roles}
        onClose={() => setModalOpen(false)} 
        onSaved={refresh} 
      />

      <ConfirmationModal
        isOpen={!!deletingKey}
        onClose={() => setDeletingKey(null)}
        onConfirm={async () => {
          if (deletingKey) {
            await remove(deletingKey);
            setDeletingKey(null);
          }
        }}
        title="Delete Designation?"
        message="This will remove the job title from your organization register. Existing users will keep their title string but the mapping will be lost."
        confirmLabel="Delete Designation"
        tone="danger"
      />
    </div>
  );
}

