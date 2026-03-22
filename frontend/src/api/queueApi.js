import api from './client';

export async function fetchQueueToday(doctorId) {
  const { data } = await api.get(`/api/queue/${doctorId}/today`);
  return data;
}
