import React from "react";
import { Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import AboutPage from "./Pages/AboutPage";
import ServicesPage from "./Pages/ServicesPage";
import ContactPage from "./Pages/ContactPage";
import UserReg from "./Pages/UserReg";
import LoginPage from "./Pages/LoginPage";
import PatientDashboardLayout from "./components/PatientDashboardLayout";
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
import PatientDetailsSummaryReport from "./admin/pages/PatientDetailsSummaryReport";
import StaffDoctors from "./Pages/StaffDoctors";
import StaffNotices from "./Pages/StaffNotices";
import StaffProfile from "./Pages/StaffProfile";
import FollowUps from "./Pages/Staff_FollowUps";
import StaffPatientDetailsPage from "./Pages/StaffPatientDetailsPage";

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
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route
        path="/dashboard"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments/book"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments/mine"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/appointments/followups"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
          </PatientRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <PatientRoute>
            <PatientDashboardLayout />
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
      <Route
        path="/doctors"
        element={
          <StaffRoute>
            <StaffDoctors />
          </StaffRoute>
        }
      />
      <Route
        path="/doctors/:doctorId"
        element={
          <StaffRoute>
            <StaffDoctors />
          </StaffRoute>
        }
      />
      <Route
        path="/notices"
        element={
          <StaffRoute>
            <StaffNotices />
          </StaffRoute>
        }
      />
      <Route
        path="/staffprofile"
        element={
          <StaffRoute>
            <StaffProfile />
          </StaffRoute>
        }
      />
      <Route
        path="/followups"
        element={
          <StaffRoute>
            <FollowUps />
          </StaffRoute>
        }
      />
      <Route
        path="/appointmentdetails"
        element={
          <StaffRoute>
            <StaffPatientDetailsPage />
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
        <Route path="patient-details-summary" element={<PatientDetailsSummaryReport />} />
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
