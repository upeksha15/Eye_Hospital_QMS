import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Eye,
  LayoutDashboard,
  Users,
  UserCog,
  Activity,
  Megaphone,
  ScrollText,
  FileBarChart,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/admin', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/staff-accounts', label: 'Staff accounts', icon: UserCog },
  { to: '/admin/users', label: 'Patients', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/performance', label: 'System Performance', icon: Activity },
  { to: '/admin/notices', label: 'Notices & Announcements', icon: Megaphone },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-[#007bff] text-white shadow-lg shadow-blue-900/30'
        : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
    }`;

  return (
    <aside className="w-72 min-h-screen flex flex-col bg-admin-navy text-white shrink-0 font-admin shadow-xl">
      <div className="p-6 border-b border-white/10">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-3 focus:outline-none"
        >
          <div className="w-11 h-11 rounded-xl bg-[#007bff] flex items-center justify-center shadow-lg">
            <Eye className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-blue-200/80 font-semibold leading-tight">
              Eye Hospital
            </p>
            <p className="text-sm font-bold leading-snug">OPD Queue Management</p>
          </div>
        </button>
      </div>

      <div className="p-4 mx-4 mt-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
            {(user?.fullName || 'A')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-blue-200/70">Welcome,</p>
            <p className="font-semibold truncate">{user?.fullName || 'Admin User'}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#007bff]/40 text-[10px] font-semibold text-blue-100 border border-blue-400/30">
              System Administrator
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
            <item.icon className="w-5 h-5 shrink-0 opacity-90" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/10 hover:bg-red-500/90 text-sm font-semibold border border-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
