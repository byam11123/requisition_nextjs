import { useState, useEffect } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useDesignations() {
  const { user } = useAuthStore();
  const [designations, setDesignations] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const [resDes, resRoles] = await Promise.all([
        fetch('/api/designations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/custom-roles', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [dataDes, dataRoles] = await Promise.all([resDes.json(), resRoles.json()]);
      setDesignations(Array.isArray(dataDes) ? dataDes : []);
      setRoles(Array.isArray(dataRoles) ? dataRoles : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const remove = async (key: string) => {
    const token = useAuthStore.getState().token;
    await fetch(`/api/designations/${key}`, { 
      method: "DELETE", 
      headers: { Authorization: `Bearer ${token}` } 
    });
    fetchData();
  };

  return {
    designations,
    roles,
    loading,
    remove,
    refresh: fetchData
  };
}

