"use client";

import { useState } from "react";
import { Plus, Search, PhoneCall } from "lucide-react";
import { useContacts } from "@/modules/contacts/hooks/use-contacts";
import { ContactCard } from "@/modules/contacts/components/contact-card";
import ContactModal from '@/modules/contacts/components/contact-modal';
import PageHeader from "@/app/dashboard/components/page-header";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function ContactManagerPage() {
  const { 
    contacts, loading, searchQuery, setSearchQuery, 
    saveContact, removeContact, refresh 
  } = useContacts();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleEdit = (contact: any) => {
    setCurrentContact(contact);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="Contact Manager"
        subtitle="Universal directory for vendors, site contacts, and personnel."
        actions={
          <button onClick={() => { setCurrentContact(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors text-white font-medium shadow-lg shadow-indigo-600/20">
            <Plus size={16} /> Add Contact
          </button>
        }
      />

      <div className="bg-[var(--app-surface)] border border-[var(--app-border)] rounded-2xl p-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            placeholder="Search directory..." 
            className="w-full bg-[var(--app-panel)] border border-[var(--app-border)] py-3.5 pl-12 pr-4 rounded-xl text-sm outline-none focus:border-indigo-500/50" 
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500">Loading directory...</div>
      ) : contacts.length === 0 ? (
        <div className="flex flex-col items-center py-20 border border-dashed border-white/10 rounded-3xl">
          <PhoneCall size={32} className="text-slate-700 mb-4" />
          <p className="text-slate-500 italic">No contacts found in directory</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {contacts.map(c => (
            <ContactCard 
              key={c.id} 
              contact={c} 
              onEdit={() => handleEdit(c)} 
              onDelete={() => setDeletingId(c.id)} 
            />
          ))}
        </div>
      )}

      <ContactModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={saveContact} 
        initialContact={currentContact} 
      />

      <ConfirmationModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={async () => {
          if (deletingId) {
            await removeContact(deletingId);
            setDeletingId(null);
          }
        }}
        title="Delete Contact?"
        message="This will remove the contact from the global directory. This action is irreversible."
        confirmLabel="Remove Contact"
        tone="danger"
      />
    </div>
  );
}

