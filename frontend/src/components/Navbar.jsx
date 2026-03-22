import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, Eye } from 'lucide-react';
import { initialsFromName } from '../utils/tokenHelpers';

const navLink =
  'px-3 py-2 rounded-lg text-sm font-medium transition text-slate-600 hover:text-blue-600';
const activeNav = 'text-blue-600 bg-blue-50 font-semibold';

export default function Navbar({ strings, patient }) {
  const display = patient?.fullName || 'Guest';
  const initials = initialsFromName(display);
  const pid = patient?.nic || patient?._id?.slice?.(-6) || '—';

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_4px_24px_rgba(37,99,235,0.10)] border-b border-blue-100">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
            <Eye className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="font-['Playfair_Display'] font-semibold text-[#1E3A8A] text-lg leading-tight truncate">
              {strings.hospital}
            </p>
            <p className="text-xs text-slate-500 truncate">{strings.subtitle}</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-1 md:gap-2">
          <NavLink
            to="/"
            className={({ isActive }) => `${navLink} ${isActive ? activeNav : ''}`}
            end
          >
            {strings.navHome}
          </NavLink>
          <NavLink
            to="/appointments/book"
            className={({ isActive }) => `${navLink} ${isActive ? activeNav : ''}`}
          >
            {strings.navAppointments}
          </NavLink>
          <NavLink
            to="/queue"
            className={({ isActive }) => `${navLink} ${isActive ? activeNav : ''}`}
          >
            {strings.navQueue}
          </NavLink>
          <span className={`${navLink} opacity-50 cursor-not-allowed`}>{strings.navFollowUps}</span>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative p-2 rounded-xl hover:bg-blue-50 text-slate-600"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>
          <div className="flex items-center gap-2 pl-1 pr-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50/50">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[120px]">{display}</p>
              <p className="text-[11px] text-slate-500">ID: {pid}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
