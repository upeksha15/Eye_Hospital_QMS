import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Only registered patients (self-service accounts). Staff must use admin or medical staff entry points. */
export function PatientRoute({ children }) {
  const { isAuthenticated, loading, userType, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse text-xl font-semibold text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userType === 'staff') {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/staffmanagement" replace />;
  }

  return children;
}
