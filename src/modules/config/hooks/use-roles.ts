import { useState, useEffect } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useRoles() {
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/custom-roles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setRoles(data);
      } else {
        console.warn('Custom roles API returned non-array:', data);
        setRoles([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRoles();
  }, [user]);

  const deleteRole = async (key: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/custom-roles/${key}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchRoles();
  };

  return {
    roles,
    loading,
    deleteRole,
    refresh: fetchRoles
  };
}

