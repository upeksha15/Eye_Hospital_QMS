import api, { setAuthToken } from './client';

export { setAuthToken };

const TOKEN_KEY = 'qms_token';
const PATIENT_KEY = 'qms_patient';
const ROLE_KEY = 'qms_role';

/** Session-only storage: closing the tab/window clears the login (no persistent token). */
function getSession() {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

/** One-time migration from legacy localStorage tokens into sessionStorage. */
function migrateFromLocalStorage(sess) {
  if (!sess) return;
  try {
    if (sess.getItem(TOKEN_KEY)) return;
    const t = localStorage.getItem(TOKEN_KEY);
    if (!t) return;
    sess.setItem(TOKEN_KEY, t);
    const p = localStorage.getItem(PATIENT_KEY);
    if (p) sess.setItem(PATIENT_KEY, p);
    const r = localStorage.getItem(ROLE_KEY);
    if (r) sess.setItem(ROLE_KEY, r);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PATIENT_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredToken() {
  const sess = getSession();
  if (sess) {
    migrateFromLocalStorage(sess);
    const v = sess.getItem(TOKEN_KEY);
    if (v) return v;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/** Stored session user (patient or staff). Legacy entries without userType are treated as patients. */
export function getStoredUser() {
  const sess = getSession();
  if (sess) migrateFromLocalStorage(sess);
  try {
    const raw =
      (sess && sess.getItem(PATIENT_KEY)) || localStorage.getItem(PATIENT_KEY);
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
  const sess = getSession();
  if (sess) migrateFromLocalStorage(sess);
  return (sess && sess.getItem(ROLE_KEY)) || localStorage.getItem(ROLE_KEY);
}

export function persistAuth(token, user) {
  const sess = getSession();
  if (sess) {
    sess.setItem(TOKEN_KEY, token);
    sess.setItem(PATIENT_KEY, JSON.stringify(user));
    const role = user.userType === 'staff' ? user.role : 'patient';
    sess.setItem(ROLE_KEY, role);
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(PATIENT_KEY);
  localStorage.removeItem(ROLE_KEY);
  setAuthToken(token);
}

export function clearAuth() {
  const sess = getSession();
  if (sess) {
    sess.removeItem(TOKEN_KEY);
    sess.removeItem(PATIENT_KEY);
    sess.removeItem(ROLE_KEY);
  }
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

/** Permanently delete the logged-in patient account (Patient + linked User + appointments, etc.). */
export async function deleteMyAccount() {
  const response = await api.delete('/api/auth/account');
  const payload =
    response && response.data !== undefined && response.data !== ''
      ? response.data
      : null;
  const normalized =
    payload && typeof payload === 'object'
      ? payload
      : { success: true, message: 'Account deleted successfully' };
  if (normalized.success !== false) {
    clearAuth();
  }
  return normalized;
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
