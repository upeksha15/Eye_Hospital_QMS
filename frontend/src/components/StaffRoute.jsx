import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Medical staff workspace (accounts created by admin). */
export function StaffRoute({ children }) {
  const { isAuthenticated, loading, userType, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EBF4FF]">
        <div className="animate-pulse text-lg font-semibold text-[#1E3A8A]">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userType !== 'staff' || role !== 'medical_staff') {
    if (userType === 'staff' && role === 'admin') return <Navigate to="/admin" replace />;
    if (userType === 'patient') return <Navigate to="/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
}
