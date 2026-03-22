import api, { setAuthToken } from './client';

export { setAuthToken };

const TOKEN_KEY = 'qms_token';
const PATIENT_KEY = 'qms_patient';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredPatient() {
  try {
    const raw = localStorage.getItem(PATIENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function persistAuth(token, patient) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
  setAuthToken(token);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_KEY);
  setAuthToken(null);
}

export async function register(body) {
  const { data } = await api.post('/api/auth/register', body);
  if (data.token && data.patient) persistAuth(data.token, data.patient);
  return data;
}

export async function login(body) {
  const { data } = await api.post('/api/auth/login', body);
  if (data.token && data.patient) persistAuth(data.token, data.patient);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/api/auth/me');
  return data;
}
