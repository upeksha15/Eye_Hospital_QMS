import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Admin-only route gate for staff accounts with admin role.
export function AdminRoute({ children }) {
  const { isAuthenticated, loading, userType, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-admin-panel font-admin">
        <div className="animate-pulse text-admin-navy text-lg font-semibold">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Validation: block unauthenticated access to admin routes.
    return <Navigate to="/login" replace />;
  }

  if (userType !== 'staff' || role !== 'admin') {
    // Validation: only staff accounts with admin role can proceed.
    return <Navigate to="/" replace />;
  }

  return children;
}
