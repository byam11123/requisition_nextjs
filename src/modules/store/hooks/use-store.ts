import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';

export function useStore() {
  const { user } = useAuthStore();
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = useAuthStore.getState().token;
      const [resItems, resLocs] = await Promise.all([
        fetch('/api/store/items', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/store/locations', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [dataItems, dataLocs] = await Promise.all([resItems.json(), resLocs.json()]);
      setItems(Array.isArray(dataItems) ? dataItems : []);
      setLocations(Array.isArray(dataLocs) ? dataLocs : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const filteredItems = useMemo(() => {
    return items
      .filter(item => {
        const matchType = typeFilter === 'ALL' || item.itemType === typeFilter;
        const q = searchQuery.toLowerCase();
        const matchSearch = !q || item.name.toLowerCase().includes(q) || item.itemCode.toLowerCase().includes(q);
        return matchType && matchSearch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, searchQuery, typeFilter]);

  return {
    items: filteredItems,
    locations,
    loading,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    refresh: fetchData
  };
}
