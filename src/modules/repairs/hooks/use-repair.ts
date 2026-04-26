import { useState, useEffect } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useRepair(id: string) {
  const { user } = useAuthStore();
  const [repair, setRepair] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchRepair = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/repair-maintenance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRepair(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) fetchRepair();
  }, [user, id]);

  const updateRepair = async (updates: any) => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/repair-maintenance/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      setRepair(data);
      return data;
    } finally {
      setSaving(false);
    }
  };

  const processAction = async (action: string, payload?: any) => {
    setSaving(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch(`/api/requisitions/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload || {})
      });
      if (!res.ok) throw new Error('Action failed');
      await fetchRepair();
    } finally {
      setSaving(false);
    }
  };

  return {
    repair,
    loading,
    saving,
    updateRepair,
    processAction,
    refresh: fetchRepair
  };
}

