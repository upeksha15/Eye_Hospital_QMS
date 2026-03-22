import api from './client';

export async function fetchSlots(doctorId, month) {
  const { data } = await api.get(`/api/slots/${doctorId}`, {
    params: { month },
  });
  return data;
}
