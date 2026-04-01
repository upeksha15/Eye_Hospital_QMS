import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Eye,
  ShieldCheck,
  LogOut,
  Bell,
  CalendarDays,
  Clock3,
} from "lucide-react";

export default function StaffTopBar() {
  const { staff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const displayStaff = staff || {
    fullName: "Staff Member",
    role: "Hospital Staff",
    department: "Administration",
    profilePic: "https://i.pravatar.cc/100?img=12",
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const formattedTime = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-700 via-blue-800 to-cyan-700 text-white shadow-lg border-b border-white/10">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-[70px] flex items-center justify-between">
        
        {/* Left */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md">
            <Eye className="w-6 h-6 text-white" />
          </div>

          <div className="leading-tight">
            <Link
              to="/staffdashboard"
              className="text-xl sm:text-2xl font-bold tracking-tight hover:text-cyan-200 transition-colors"
            >
              National Eye Hospital
            </Link>

            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span className="text-xs sm:text-sm text-blue-100 font-medium">
                Secure Staff Operations Dashboard
              </span>
            </div>
          </div>
        </div>

        {/* Center - Date/Time */}
        <div className="hidden lg:flex items-center gap-5 bg-white/10 border border-white/15 rounded-2xl px-5 py-2 backdrop-blur-md shadow-sm">
          <div className="flex items-center gap-2 text-white">
            <CalendarDays className="w-4 h-4 text-cyan-200" />
            <span className="text-sm font-medium">{formattedDate}</span>
          </div>
          <div className="w-px h-5 bg-white/20"></div>
          <div className="flex items-center gap-2 text-white">
            <Clock3 className="w-4 h-4 text-cyan-200" />
            <span className="text-sm font-medium">{formattedTime}</span>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Notification */}
          <button className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors border border-white/10">
            <Bell className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
          </button>

          {/* Profile */}
          <div className="flex items-center gap-3 bg-white/10 border border-white/15 rounded-2xl px-3 py-2 backdrop-blur-md shadow-sm hover:bg-white/15 transition-all">
            <img
              src={displayStaff.profilePic}
              alt="Staff Avatar"
              className="w-11 h-11 rounded-full object-cover border-2 border-white shadow"
            />
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-white">
                {displayStaff.fullName}
              </p>
              <p className="text-xs text-blue-100 font-medium">
                {displayStaff.role} • {displayStaff.department}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}