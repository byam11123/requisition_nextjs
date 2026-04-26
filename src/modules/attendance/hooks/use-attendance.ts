import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useAttendance() {
  const { user } = useAuthStore();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const res = await fetch('/api/attendance', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || r.requestId.toLowerCase().includes(q) || r.driverName.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, statusFilter]);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter(r => r.status === 'PENDING').length,
    approved: records.filter(r => r.status === 'APPROVED').length,
    rejected: records.filter(r => r.status === 'REJECTED').length,
  }), [records]);

  const deleteBulk = async (ids: string[]) => {
    try {
      const token = useAuthStore.getState().token;
      await fetch('/api/attendance/bulk-delete', {
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
    records: filteredRecords.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    totalCount: filteredRecords.length,
    loading,
    stats,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    rowsPerPage,
    refresh: fetchData,
    deleteBulk
  };
}
