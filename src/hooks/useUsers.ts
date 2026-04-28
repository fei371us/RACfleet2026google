import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../types';

export function useUsers() {
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<User[]>('/api/users')
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
