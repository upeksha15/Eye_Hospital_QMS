import api from './client';

export async function changePasswordStaff(body) {
  const { data } = await api.post('/api/staff/change-password', body);
  return data;
}

export async function fetchStaffDirectory() {
  const { data } = await api.get('/api/admin/staff-accounts');
  return data;
}

