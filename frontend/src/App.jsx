import React from "react";
import Home from "./Pages/Home";
import UserReg from "./Pages/UserReg";
import UserDashboard from "./Pages/User_dash";
import UserProfile from "./Pages/User_Profile";
import BookAppointmentPage from "./Pages/BookAppointmentPage";
import MyAppointmentsPage from "./Pages/MyAppointmentsPage";
import QueueStatusPage from "./Pages/QueueStatusPage";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<UserReg />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/appointments/book" element={<BookAppointmentPage />} />
          <Route path="/appointments/mine" element={<MyAppointmentsPage />} />
          <Route path="/queue" element={<QueueStatusPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
