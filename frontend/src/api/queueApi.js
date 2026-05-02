import api from './client';

export async function fetchQueueToday(doctorId) {
  const { data } = await api.get(`/api/queue/${doctorId}/today`);
  return data;
}

export async function fetchQueueBoardToday(doctorId) {
  const { data } = await api.get(`/api/queue/${doctorId}/board/today`);
  return data;
}

export async function fetchMyQueueStatusToday(doctorId) {
  const { data } = await api.get(`/api/queue/${doctorId}/my-status/today`);
  return data;
}

export async function fetchSkippedToday(doctorId) {
  const { data } = await api.get(`/api/queue/${doctorId}/skipped/today`);
  return data;
}
