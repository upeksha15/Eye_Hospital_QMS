import React from "react";
import { Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import UserReg from "./Pages/UserReg";
import LoginPage from "./Pages/LoginPage";
import UserDashboard from "./Pages/User_dash";
import UserProfile from "./Pages/User_Profile";
import BookAppointmentPage from "./Pages/BookAppointmentPage";
import MyAppointmentsPage from "./Pages/MyAppointmentsPage";
import QueueStatusPage from "./Pages/QueueStatusPage";
import QueueManagementPage from "./Pages/DoctorRoomManagement";
import StaffManagement from "./Pages/StaffManagement";
import StaffDashboard from "./Pages/StaffDashboard";
import { AdminRoute } from "./components/AdminRoute";
import { PatientRoute } from "./components/PatientRoute";
import { StaffRoute } from "./components/StaffRoute";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/pages/AdminDashboard";
import UserManagementPage from "./admin/pages/UserManagementPage";
import StaffAccountsPage from "./admin/pages/StaffAccountsPage";
import SystemPerformancePage from "./admin/pages/SystemPerformancePage";
import NoticesPage from "./admin/pages/NoticesPage";
import AuditLogsPage from "./admin/pages/AuditLogsPage";
import AdminSettingsPage from "./admin/pages/AdminSettingsPage";
import ReportsPage from "./admin/pages/ReportsPage";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";

/** Any authenticated user (patient or staff). */
const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse text-xl font-semibold text-indigo-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<UserReg />} />
      <Route
        path="/dashboard"
        element={
          <PatientRoute>
            <UserDashboard />
          </PatientRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PatientRoute>
            <UserProfile />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments/book"
        element={
          <PatientRoute>
            <BookAppointmentPage />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments/mine"
        element={
          <PatientRoute>
            <MyAppointmentsPage />
          </PatientRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <PatientRoute>
            <QueueStatusPage />
          </PatientRoute>
        }
      />

      <Route
        path="/queuemanagement"
        element={
          <AuthenticatedRoute>
            <QueueManagementPage />
          </AuthenticatedRoute>
        }
      />
      <Route
        path="/staffdashboard"
        element={
          <StaffRoute>
            <StaffDashboard />
          </StaffRoute>
        }
      />
      {/* support legacy/hyphenated path */}
      <Route path="/staff-dashboard" element={<Navigate to="/staffdashboard" replace />} />
      <Route
        path="/staffmanagement"
        element={
          <StaffRoute>
            <StaffManagement />
          </StaffRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="staff-accounts" element={<StaffAccountsPage />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="performance" element={<SystemPerformancePage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueueProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </QueueProvider>
    </AuthProvider>
  );
}

export default App;
