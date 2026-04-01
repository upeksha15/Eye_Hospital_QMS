import api from './client';

export async function changePasswordStaff(body) {
  const { data } = await api.post('/api/staff/change-password', body);
  return data;
}

