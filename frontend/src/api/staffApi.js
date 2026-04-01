import api from './client';

export async function fetchStaffDirectory() {
  const { data } = await api.get('/api/staff/directory');
  return data;
}

