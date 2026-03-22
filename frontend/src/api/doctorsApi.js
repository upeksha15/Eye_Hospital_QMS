import api from './client';

export async function fetchDoctors() {
  const { data } = await api.get('/api/doctors');
  return data;
}

export async function fetchDoctor(id) {
  const { data } = await api.get(`/api/doctors/${id}`);
  return data;
}
