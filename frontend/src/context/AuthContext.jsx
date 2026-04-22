import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as authApi from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser());
  const [token, setToken] = useState(() => authApi.getStoredToken());
  const [loading, setLoading] = useState(true);

  const userType = user?.userType || 'patient';
  const role = userType === 'staff' ? user?.role : 'patient';

  useEffect(() => {
    const t = authApi.getStoredToken();
    if (t) {
      authApi.setAuthToken(t);
      authApi
        .fetchMe()
        .then((d) => {
          const u = d.user || d.patient;
          if (u) {
            const normalized = { ...u, userType: d.userType || u.userType || 'patient' };
            setUser(normalized);
            const tok = authApi.getStoredToken();
            if (tok) authApi.persistAuth(tok, normalized);
          }
        })
        .catch(() => {
          authApi.clearAuth();
          setUser(null);
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (body) => {
    const data = await authApi.login(body);
    const u = data.user || data.patient;
    if (u) {
      const normalized = { ...u, userType: data.userType || u.userType || 'patient' };
      setUser(normalized);
      setToken(data.token);
    }
    return data;
  }, []);

  const register = useCallback(async (body) => {
    const data = await authApi.register(body);
    const u = data.user || data.patient;
    if (u) {
      const normalized = { ...u, userType: data.userType || u.userType || 'patient' };
      setUser(normalized);
      setToken(data.token);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    authApi.clearAuth();
    setUser(null);
    setToken(null);
  }, []);

  const updatePatient = useCallback(
    (updatedPatientData) => {
      setUser((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...updatedPatientData };
        authApi.persistAuth(token, merged);
        return merged;
      });
    },
    [token]
  );

  const updateStaff = useCallback(
    (updatedStaffData) => {
      setUser((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...updatedStaffData };
        authApi.persistAuth(token, merged);
        return merged;
      });
    },
    [token]
  );

  const patient = userType === 'patient' ? user : null;
  const staff = userType === 'staff' ? user : null;

  const value = useMemo(
    () => ({
      user,
      patient,
      staff,
      token,
      role,
      userType,
      isAuthenticated: Boolean(token && user),
      loading,
      login,
      register,
      logout,
      updatePatient,
      updateStaff,
    }),
    [user, patient, staff, token, role, userType, loading, login, register, logout, updatePatient, updateStaff]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
