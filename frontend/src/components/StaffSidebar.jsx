import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  UserCircle2,
  CalendarPlus,
  Bell,
  ChevronRight,
} from "lucide-react";

export default function StaffSidebar() {
  const location = useLocation();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/staffdashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Queue Control",
      path: "/doctors",
      icon: <CalendarDays className="w-5 h-5" />,
    },
       {
      name: "Queue Management",
      path: "/queuemanagement",
      icon: <ClipboardList className="w-5 h-5" />,
    },
      {
        name: "Follow up Scheduling",
        path: "/followups",
        icon: <CalendarPlus className="w-5 h-5" />,
      },
      {
        name: "Notices",
        path: "/notices",
        icon: <Bell className="w-5 h-5" />,
      },
    {
      name: "Staff Panel",
      path: "/staffmanagement",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Profile",
      path: "/staffprofile",
      icon: <UserCircle2 className="w-5 h-5" />,
    },
  ];

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-72 min-h-screen bg-gradient-to-b from-blue-800 via-blue-900 to-cyan-900 text-white shadow-2xl border-r border-white/10 flex flex-col">
      

      {/* Navigation */}
      <div className="flex-1 px-4 py-6">
        <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70 font-semibold px-3 mb-4">
          Main Navigation
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 ${
                isActive(item.path)
                  ? "bg-white text-blue-800 shadow-lg shadow-blue-950/30"
                  : "text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`transition-transform duration-300 ${
                    isActive(item.path)
                      ? "scale-110"
                      : "group-hover:scale-110"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm font-medium">{item.name}</span>
              </div>

              <ChevronRight
                className={`w-4 h-4 transition-all duration-300 ${
                  isActive(item.path)
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                }`}
              />
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer Card */}
      <div className="p-4 border-t border-white/10">
        <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 shadow-inner border border-white/10">
          <p className="text-sm font-semibold text-white">Eye Care Management</p>
          <p className="text-xs text-blue-100 mt-1 leading-relaxed">
            Efficiently manage staff, appointments, doctor rooms, and queue operations securely.
          </p>
        </div>
      </div>
    </aside>
  );
}