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
  const [patient, setPatient] = useState(() => authApi.getStoredPatient());
  const [token, setToken] = useState(() => authApi.getStoredToken());
  const [role, setRole] = useState(() => authApi.getStoredRole());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = authApi.getStoredToken();
    if (t) {
      authApi.setAuthToken(t);
      authApi
        .fetchMe()
        .then((d) => {
          if (d.patient) {
            setPatient(d.patient);
            setRole(d.patient.role || 'patient');
          }
        })
        .catch(() => {
          authApi.clearAuth();
          setPatient(null);
          setToken(null);
          setRole(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (body) => {
    const data = await authApi.login(body);
    setPatient(data.patient);
    setToken(data.token);
    setRole(data.patient.role || 'patient');
    return data;
  }, []);

  const register = useCallback(async (body) => {
    const data = await authApi.register(body);
    setPatient(data.patient);
    setToken(data.token);
    setRole(data.patient.role || 'patient');
    return data;
  }, []);

  const logout = useCallback(() => {
    authApi.clearAuth();
    setPatient(null);
    setToken(null);
    setRole(null);
  }, []);

  const value = useMemo(
    () => ({
      patient,
      token,
      role,
      isAuthenticated: Boolean(token && patient),
      loading,
      login,
      register,
      logout,
    }),
    [patient, token, role, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
