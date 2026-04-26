"use client";

import { useEffect, useState } from "react";
import { Plus, X, PhoneCall, Building2, UserCircle2, Loader2, Save } from "lucide-react";

export type ContactDefinition = {
  id: string;
  name: string;
  role: string;
  department: string;
  phones: string[];
  notes?: string;
};

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: ContactDefinition) => void;
  initialContact: ContactDefinition | null;
  loading?: boolean;
};

export default function ContactModal({ isOpen, onClose, onSave, initialContact, loading = false }: ContactModalProps) {
  const [mounted, setMounted] = useState(false);
  
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const extractTenDigits = (val: string) => {
    const digits = val.replace(/\D/g, "");
    return digits.length >= 10 ? digits.slice(-10) : digits;
  };

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = "hidden";
      if (initialContact) {
        setId(initialContact.id);
        setName(initialContact.name);
        setRole(initialContact.role);
        setDepartment(initialContact.department);
        setPhones(
          initialContact.phones.length > 0 
            ? initialContact.phones.map(extractTenDigits)
            : [""]
        );
        setNotes(initialContact.notes || "");
      } else {
        setId(crypto.randomUUID());
        setName("");
        setRole("");
        setDepartment("");
        setPhones([""]);
        setNotes("");
      }
      setError("");
    } else {
      const timer = setTimeout(() => setMounted(false), 300);
      document.body.style.overflow = "unset";
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialContact]);

  if (!isOpen && !mounted) return null;

  const handlePhoneChange = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    const newPhones = [...phones];
    newPhones[index] = digits;
    setPhones(newPhones);
  };

  const addPhoneField = () => {
    setPhones([...phones, ""]);
  };

  const removePhoneField = (index: number) => {
    if (phones.length === 1) {
      setPhones([""]);
      return;
    }
    const newPhones = [...phones];
    newPhones.splice(index, 1);
    setPhones(newPhones);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Contact name is required");
      return;
    }
    
    const validPhones = phones.map(p => p.trim()).filter(Boolean);
    if (validPhones.length === 0) {
      setError("At least one valid phone number is required");
      return;
    }
    
    for (const p of validPhones) {
      if (p.length !== 10) {
        setError(`Phone number ${p} must be exactly 10 digits.`);
        return;
      }
    }

    const finalPhones = validPhones.map(p => `+91 ${p}`);

    onSave({
      id,
      name: name.trim(),
      role: role.trim(),
      department: department.trim(),
      phones: finalPhones,
      notes: notes.trim(),
    });
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 sm:p-6 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-2xl backdrop-blur-xl transition-all duration-300 ${
          isOpen ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--app-border-soft)] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
              <UserCircle2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[var(--app-text)]">
                {initialContact ? "Edit Contact" : "Add New Contact"}
              </h2>
              <p className="text-xs text-[var(--app-muted)]">Manage shared address book details</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--app-muted)] transition-colors hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none transition-colors focus:border-[var(--app-accent)]"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                  Role / Designation
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Senior Driver"
                  className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-2.5 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none transition-colors focus:border-[var(--app-accent)]"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                  Department / Company
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-muted)]" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Transport"
                    className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] py-2.5 pl-10 pr-4 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none transition-colors focus:border-[var(--app-accent)]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-panel)]/30 p-4">
              <div className="mb-3 flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--app-accent)]">
                  Phone Numbers *
                </label>
                <button
                  type="button"
                  onClick={addPhoneField}
                  className="flex items-center gap-1 rounded-lg bg-[var(--app-accent-soft)] px-2 py-1 text-xs font-medium text-[var(--app-accent)] transition-colors hover:bg-[var(--app-accent-muted)]"
                >
                  <Plus size={14} /> Add
                </button>
              </div>
              <div className="space-y-3">
                {phones.map((phone, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1 flex items-center overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] focus-within:border-[var(--app-accent)] transition-colors">
                      <div className="flex h-full items-center pl-3 pr-2 text-[var(--app-muted)]">
                        <PhoneCall size={16} />
                        <span className="ml-2 pr-2 text-sm font-medium text-[var(--app-muted)] border-r border-[var(--app-border)]">+91</span>
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => handlePhoneChange(idx, e.target.value)}
                        placeholder="9000000000"
                        className="w-full bg-transparent py-2 pl-2 pr-4 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removePhoneField(idx)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--app-muted)]">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional supplier context or alternate contact rules"
                rows={3}
                className="w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-panel)] px-4 py-3 text-sm text-[var(--app-text)] placeholder-[var(--app-muted)] outline-none transition-colors focus:border-[var(--app-accent)]"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 border-t border-[var(--app-border-soft)] pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-[var(--app-border)] px-5 py-2.5 text-sm font-medium text-[var(--app-text)] transition-colors hover:bg-[var(--app-hover)] disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-6 py-2.5 text-sm font-medium text-[var(--app-accent-text,white)] shadow-lg transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {initialContact ? "Save Changes" : "Create Contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

