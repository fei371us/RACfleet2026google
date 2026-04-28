import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Job } from '../types';

export function useJobs() {
  const [jobs, setJobs]       = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<Job[]>('/api/jobs');
      setJobs(data);
    } catch (e: any) {
      setError(e.message ?? 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}
