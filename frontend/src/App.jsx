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

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { QueueProvider } from "./context/QueueContext";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
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
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/book"
        element={
          <ProtectedRoute>
            <BookAppointmentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/appointments/mine"
        element={
          <ProtectedRoute>
            <MyAppointmentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/queue"
        element={
          <ProtectedRoute>
            <QueueStatusPage />
          </ProtectedRoute>
        }
      />

            <Route
        path="/queuemanagement"
        element={
          <ProtectedRoute>
            <QueueManagementPage />
          </ProtectedRoute>
        }
      />
            <Route
              path="/staffdashboard"
              element={
                <ProtectedRoute>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            {/* support legacy/hyphenated path */}
            <Route path="/staff-dashboard" element={<Navigate to="/staffdashboard" replace />} />
                  <Route
        path="/staffmanagement"
        element={
          <ProtectedRoute>
            <StaffManagement />
          </ProtectedRoute>
        }
      />
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
