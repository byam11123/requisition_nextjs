"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Building2, PhoneCall, MoreVertical, Edit2, Trash2 } from "lucide-react";
import PageHeader from "@/app/dashboard/components/page-header";
import ActionToast from "@/app/dashboard/action-toast";
import ContactModal from "./contact-modal";
import { type ContactDefinition } from "@/lib/stores/contact-store";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function ContactManagerPage() {
  const [contacts, setContacts] = useState<ContactDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState<ContactDefinition | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete states
  const [deleteData, setDeleteData] = useState<{ id: string; name: string } | null>(null);

  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/contacts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to load contacts." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return contacts;

    return contacts.filter((contact) => 
      contact.name.toLowerCase().includes(query) ||
      contact.role.toLowerCase().includes(query) ||
      contact.department.toLowerCase().includes(query) ||
      contact.phones.some(p => p.toLowerCase().includes(query))
    );
  }, [contacts, searchQuery]);

  const handleSaveContact = async (updatedContact: ContactDefinition) => {
    setSaving(true);
    try {
      let newList = [...contacts];
      const index = newList.findIndex(c => c.id === updatedContact.id);
      
      if (index >= 0) {
        newList[index] = updatedContact;
      } else {
        newList.push(updatedContact);
      }

      const token = localStorage.getItem("token");
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newList)
      });

      if (!res.ok) throw new Error("Failed to save changes");
      
      const returned = await res.json();
      setContacts(returned);
      setIsModalOpen(false);
      setToast({ type: "success", message: "Contact saved successfully." });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to save contact." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    setSaving(true);
    try {
      const newList = contacts.filter(c => c.id !== deleteData.id);
      
      const token = localStorage.getItem("token");
      const res = await fetch("/api/contacts", {
        method: "PUT",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newList)
      });

      if (!res.ok) throw new Error("Failed to delete");
      
      const returned = await res.json();
      setContacts(returned);
      setToast({ type: "success", message: "Contact deleted successfully." });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", message: "Failed to delete contact." });
    } finally {
      setSaving(false);
      setDeleteData(null);
    }
  };

  const openAddModal = () => {
    setCurrentContact(null);
    setIsModalOpen(true);
  };

  const openEditModal = (contact: ContactDefinition) => {
    setCurrentContact(contact);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {toast && (
        <ActionToast
          tone={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <PageHeader
        title="Contact Manager"
        subtitle="Manage shared employee and office contact details."
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-4 py-2.5 text-sm font-medium text-[var(--app-accent-text)] shadow-lg shadow-[var(--app-accent)]/20 transition-all hover:opacity-90 active:scale-95"
          >
            <Plus size={16} />
            Add Contact
          </button>
        }
      />

      <div className="rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-4 md:p-5">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, role, department or phone..."
            className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-3.5 pl-12 pr-4 text-sm text-[var(--app-text)] outline-none transition-colors placeholder:text-[var(--app-muted)]/50 focus:border-[var(--app-accent)]/50 focus:bg-[var(--app-panel)]/80"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)]">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--app-accent)] border-t-transparent" />
            <p className="text-sm text-[var(--app-muted)]">Loading contacts...</p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
            <PhoneCall size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--app-text)]">No contacts found</h3>
          <p className="max-w-sm text-sm text-[var(--app-muted)]">
            {searchQuery 
              ? "We couldn't find any contacts matching your search." 
              : "Your contact directory is currently empty. Add your first shared contact."}
          </p>
          {!searchQuery && (
            <button
              onClick={openAddModal}
              className="mt-6 flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2 text-sm text-[var(--app-text)] transition-hover hover:bg-[var(--app-accent-soft)]"
            >
              <Plus size={16} /> Add First Contact
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredContacts.map(contact => (
            <div 
              key={contact.id} 
              className="group relative flex flex-col rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] p-6 transition-all hover:border-[var(--app-accent)] hover:shadow-xl hover:shadow-[var(--app-accent-soft)]"
            >
              <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(contact)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)] transition-colors hover:bg-[var(--app-accent)]/20"
                    title="Edit Contact"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteData({ id: contact.id, name: contact.name })}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-300 transition-colors hover:bg-rose-500/20"
                    title="Delete Contact"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--app-accent-soft)] text-lg font-bold text-[var(--app-accent-strong)] ring-1 ring-inset ring-[var(--app-border)]">
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--app-text)] line-clamp-1">{contact.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
                    <span className="line-clamp-1">{contact.role || "No Role"}</span>
                    {contact.department && (
                      <>
                        <span className="h-1 w-1 rounded-full bg-[var(--app-muted)] opacity-50" />
                        <span className="flex items-center gap-1 line-clamp-1"><Building2 size={10} /> {contact.department}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-2 flex-1 space-y-3 rounded-2xl bg-[var(--app-panel)] p-4 border border-[var(--app-border-soft)]">
                {contact.phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-[var(--app-text)]">
                    <PhoneCall size={14} className="text-[var(--app-accent)]" />
                    <span>{phone}</span>
                  </div>
                ))}
              </div>

              {contact.notes && (
                <div className="mt-4 border-t border-[var(--app-border-soft)] pt-4 text-[11px] text-[var(--app-muted)] line-clamp-2 italic">
                  {contact.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveContact}
        initialContact={currentContact}
        loading={saving}
      />

      <ConfirmationModal
        isOpen={!!deleteData}
        onClose={() => setDeleteData(null)}
        onConfirm={handleDelete}
        title="Delete Contact"
        message={`Are you sure you want to remove "${deleteData?.name}" from the contact directory? This action cannot be undone.`}
        confirmLabel="Yes, Delete Contact"
        tone="danger"
        loading={saving}
      />
    </div>
  );
}
