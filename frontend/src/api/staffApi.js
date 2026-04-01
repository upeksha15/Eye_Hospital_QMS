import api from './client';

export async function changePasswordStaff(body) {
  const { data } = await api.put('/api/staff/change-password', body);
  return data;
}
