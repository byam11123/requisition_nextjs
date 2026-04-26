import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useContacts() {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/contacts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.role.toLowerCase().includes(q) || 
      c.phones.some((p:string) => p.includes(q))
    );
  }, [contacts, searchQuery]);

  const saveContact = async (updated: any) => {
    const newList = [...contacts];
    const idx = newList.findIndex(c => c.id === updated.id);
    if (idx >= 0) newList[idx] = updated; else newList.push(updated);
    
    const token = useAuthStore.getState().token;
    const res = await fetch('/api/contacts', {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(newList)
    });
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
  };

  const removeContact = async (id: string) => {
    const newList = contacts.filter(c => c.id !== id);
    const token = useAuthStore.getState().token;
    const res = await fetch('/api/contacts', {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(newList)
    });
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
  };

  return {
    contacts: filteredContacts,
    loading,
    searchQuery,
    setSearchQuery,
    saveContact,
    removeContact,
    refresh: fetchContacts
  };
}
