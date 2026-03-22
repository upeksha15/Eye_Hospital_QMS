import { useCallback, useEffect, useState } from 'react';
import { fetchSlots } from '../api/slotsApi';

export function useSlotAvailability(doctorId, month) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!doctorId || !month) {
      setSlots([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSlots(doctorId, month);
      setSlots(data.slots || []);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Failed to load slots');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [doctorId, month]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { slots, loading, error, refetch };
}
