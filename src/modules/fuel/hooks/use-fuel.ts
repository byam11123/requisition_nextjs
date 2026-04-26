import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useFuel() {
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/vehicle-fuel', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || r.requestId.toLowerCase().includes(q) || r.vehicleType.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    completed: requests.filter(r => r.status === 'COMPLETED').length,
  }), [requests]);

  const deleteBulk = async (ids: string[]) => {
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/vehicle-fuel/bulk-delete', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ ids }),
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return {
    requests: filteredRequests,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    refresh: fetchData,
    deleteBulk
  };
}
