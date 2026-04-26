import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { RequisitionService } from '../services/requisition.service';

const service = new RequisitionService();

export function useRequisitions(organizationId?: string) {
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequisitions = useCallback(async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
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
  }, [organizationId]);

  useEffect(() => {
    fetchRequisitions();
  }, [fetchRequisitions]);

  const deleteBulk = async (ids: string[]) => {
    try {
      await fetch('/api/requisitions/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
