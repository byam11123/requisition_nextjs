import { useAuthStore } from '@/modules/auth/hooks/use-auth-store';
import { useState, useEffect } from 'react';

export function useDashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const token = useAuthStore.getState().token;
        const res = await fetch('/api/dashboard-summary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard summary');
        const data = await res.json();
        setSummary(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  return { summary, loading, error };
}


