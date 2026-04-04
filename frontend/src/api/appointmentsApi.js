import api from './client';

export async function createAppointment(body) {
  const { data } = await api.post('/api/appointments', body);
  return data;
}

export async function fetchMyAppointments() {
  const { data } = await api.get('/api/appointments/mine');
  return data;
}

export async function cancelAppointment(id) {
  const { data } = await api.patch(`/api/appointments/${id}/cancel`);
  return data;
}

export async function checkIn(appointmentId) {
  const { data } = await api.post(`/api/checkin/${appointmentId}`);
  return data;
}

export async function checkSlotAvailability(doctorId, date) {
  const { data } = await api.get('/api/appointments/check-availability', {
    params: { doctorId, date },
  });
  return data;
}
