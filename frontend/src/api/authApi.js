import api, { setAuthToken } from './client';

export { setAuthToken };

const TOKEN_KEY = 'qms_token';
const PATIENT_KEY = 'qms_patient';
const ROLE_KEY = 'qms_role';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/** Stored session user (patient or staff). Legacy entries without userType are treated as patients. */
export function getStoredUser() {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u.userType) u.userType = 'patient';
    return u;
  } catch {
    return null;
  }
}

/** @deprecated use getStoredUser */
export function getStoredPatient() {
  return getStoredUser();
}

export function getStoredRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function persistAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PATIENT_KEY, JSON.stringify(user));
  const role = user.userType === 'staff' ? user.role : 'patient';
  localStorage.setItem(ROLE_KEY, role);
  setAuthToken(token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_KEY);
  localStorage.removeItem(ROLE_KEY);
  setAuthToken(null);
}

export async function register(body) {
  const { data } = await api.post('/api/auth/register', body);
  const u = data.user || data.patient;
  if (data.token && u) persistAuth(data.token, u);
  return data;
}

export async function login(body) {
  const { data } = await api.post('/api/auth/login', body);
  const u = data.user || data.patient;
  if (data.token && u) persistAuth(data.token, u);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}

export async function updatePatientData(patientData) {
  const { data } = await api.put('/api/auth/sync-patient', patientData);
  const u = data.user || data.patient;
  if (data.token && u) {
    persistAuth(data.token, u);
  } else if (u) {
    persistAuth(getStoredToken(), u);
  }
  return data;
}

export async function updateStaffData(staffData) {
  const { data } = await api.put('/api/auth/sync-staff', staffData);
  const u = data.user || data.staff;
  if (data.token && u) {
    persistAuth(data.token, u);
  } else if (u) {
    persistAuth(getStoredToken(), u);
  }
  return data;
}
