import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Vehicle } from '../types';

export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get<Vehicle[]>('/api/vehicles')
      .then(setVehicles)
      .finally(() => setLoading(false));
  }, []);

  return { vehicles, loading };
}
