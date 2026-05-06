import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { RequisitionService } from '../services/requisition.service';

const service = new RequisitionService();

export function useRequisitions(organizationId?: string) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(async () => {
    // Use token presence as guard — the server reads org from the JWT,
    // so we don't need organizationId from the user object (which may be snake_case)
    const token = useAuthStore.getState().token;
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/requisitions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRequisitions(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // token is read from the store inside, no external dep needed

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const deleteBulk = async (ids: string[]) => {
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/requisitions', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids }),
      });
      await fetchRequisitions();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return {
    requisitions,
    loading,
    error,
    refresh: fetchRequisitions,
    deleteBulk,
    stats: service.calculateStats(requisitions),
  };
}
