import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useRepairs() {
  const { user } = useAuthStore();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchRepairs = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/repair-maintenance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRepairs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchRepairs();
  }, [user]);

  const filteredRepairs = useMemo(() => {
    return repairs
      .filter(r => {
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || r.requestId?.toLowerCase().includes(q) || r.itemDescription?.toLowerCase().includes(q);
        
        let matchStatus = true;
        if (statusFilter === 'PENDING') matchStatus = r.approvalStatus === 'PENDING';
        else if (statusFilter === 'APPROVED') matchStatus = r.approvalStatus === 'APPROVED';
        else if (statusFilter === 'IN_TRANSIT') matchStatus = r.dispatchStatus === 'DISPATCHED';
        else if (statusFilter === 'COMPLETED') matchStatus = r.dispatchStatus === 'DELIVERED';
        
        return matchSearch && matchStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [repairs, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: repairs.length,
    pending: repairs.filter(r => r.approvalStatus === 'PENDING').length,
    inTransit: repairs.filter(r => r.dispatchStatus === 'DISPATCHED').length,
    completed: repairs.filter(r => r.dispatchStatus === 'DELIVERED').length,
  }), [repairs]);

  const deleteBulk = async (ids: string[]) => {
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/repair-maintenance', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids }),
      });
      await fetchRepairs();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    repairs: filteredRepairs,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh: fetchRepairs,
    deleteBulk
  };
}
