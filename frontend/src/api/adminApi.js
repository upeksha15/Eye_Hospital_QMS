import api from './client';

export async function getDashboardStats() {
  const { data } = await api.get('/api/admin/dashboard/stats');
  return data;
}

export async function getChartSeries() {
  const { data } = await api.get('/api/admin/dashboard/chart');
  return data;
}

export async function getRecentActivity() {
  const { data } = await api.get('/api/admin/dashboard/recent-activity');
  return data;
}

export async function getNotifications() {
  const { data } = await api.get('/api/admin/notifications');
  return data;
}

export async function getSystemHealth() {
  const { data } = await api.get('/api/admin/system/health');
  return data;
}

export async function getAuditLogs(params) {
  const { data } = await api.get('/api/admin/audit-logs', { params });
  return data;
}

export async function getPatients() {
  const { data } = await api.get('/api/admin/patients');
  return data;
}

export async function getStaffAccounts() {
  const { data } = await api.get('/api/admin/staff-accounts');
  return data;
}

export async function createStaffAccount(body) {
  const { data } = await api.post('/api/admin/staff-accounts', body);
  return data;
}

export async function updateStaffAccount(id, body) {
  const { data } = await api.put(`/api/admin/staff-accounts/${id}`, body);
  return data;
}

export async function deleteStaffAccount(id) {
  const { data } = await api.delete(`/api/admin/staff-accounts/${id}`);
  return data;
}

export async function getDoctorsAdmin() {
  const { data } = await api.get('/api/admin/doctors');
  return data;
}

export async function createDoctor(body) {
  const { data } = await api.post('/api/admin/doctors', body);
  return data;
}

export async function updateDoctor(id, body) {
  const { data } = await api.put(`/api/admin/doctors/${id}`, body);
  return data;
}

export async function deleteDoctor(id) {
  const { data } = await api.delete(`/api/admin/doctors/${id}`);
  return data;
}

export async function getAppointmentsReport(params) {
  const { data } = await api.get('/api/admin/reports/appointments', { params });
  return data;
}

export async function downloadAppointmentsReportPdf(params) {
  // Request as arraybuffer to avoid issues where the response blob has an empty type
  // and to ensure we construct a proper PDF blob on the client.
  const { data } = await api.get('/api/admin/reports/appointments.pdf', {
    params,
    responseType: 'arraybuffer',
  });
  return new Blob([data], { type: 'application/pdf' });
}

export async function getPatientDetailsSummaryReport(params) {
  const { data } = await api.get('/api/admin/reports/patient-details-summary', { params });
  return data;
}

export async function downloadPatientDetailsSummaryPdf(params) {
  const { data } = await api.get('/api/admin/reports/patient-details-summary.pdf', {
    params,
    responseType: 'arraybuffer',
  });
  return new Blob([data], { type: 'application/pdf' });
}

export async function getAnnouncementsAdmin() {
  const { data } = await api.get('/api/admin/announcements');
  return data;
}

export async function getSpecialNotices(params) {
  const { data } = await api.get('/api/notices', { params });
  return data;
}

export async function createSpecialNotice(body) {
  const { data } = await api.post('/api/notices', body);
  return data;
}

export async function updateSpecialNotice(id, body) {
  const { data } = await api.put(`/api/notices/${id}`, body);
  return data;
}

export async function deleteSpecialNotice(id) {
  const { data } = await api.delete(`/api/notices/${id}`);
  return data;
}

export async function createAnnouncement(body) {
  const { data } = await api.post('/api/admin/announcements', body);
  return data;
}

export async function updateAnnouncement(id, body) {
  const { data } = await api.put(`/api/admin/announcements/${id}`, body);
  return data;
}

export async function deleteAnnouncement(id) {
  const { data } = await api.delete(`/api/admin/announcements/${id}`);
  return data;
}

export async function getSettings() {
  const { data } = await api.get('/api/admin/settings');
  return data;
}

export async function patchSettings(body) {
  const { data } = await api.patch('/api/admin/settings', body);
  return data;
}

export async function getPerformanceMetrics() {
  const { data } = await api.get('/api/admin/performance');
  return data;
}
