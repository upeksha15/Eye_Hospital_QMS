import api from './client';

export async function changePasswordStaff(body) {
  const { data } = await api.post('/api/staff/change-password', body);
  return data;
}

/** Medical staff directory for Staff Panel (works for medical_staff + admin; not admin-only). */
export async function fetchAvailableMedicalStaffPanel() {
  const { data } = await api.get('/api/staff/available-medical-staff');
  return data;
}

export async function getPatientDetailsSummaryReport(params) {
  const { data } = await api.get('/api/staff/patient-details-summary', { params });
  return data;
}

export async function downloadPatientDetailsSummaryPdf(params) {
  const { data } = await api.get('/api/staff/patient-details-summary.pdf', {
    params,
    responseType: 'arraybuffer',
  });
  return new Blob([data], { type: 'application/pdf' });
}

