import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  User,
  LogOut,
  Eye,
  CheckCircle,
  AlertCircle,
  Activity,
  Bell,
  Home,
  History,
  Timer,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BookAppointmentPage from '../Pages/BookAppointmentPage';
import MyAppointmentsPage from '../Pages/MyAppointmentsPage';
import QueueStatusPage from '../Pages/QueueStatusPage';
import UserProfile from '../Pages/User_Profile';
import PatientFollowUpsPage from '../Pages/PatientFollowUpsPage';
import NotificationsPage from '../Pages/NotificationsPage';
import ReportsPage from '../Pages/ReportsPage';
import { fetchMyAppointments } from '../api/appointmentsApi';
import { fetchMyQueueStatusToday } from '../api/queueApi';

function getStatusColor(status) {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'checked_in':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
}

function getStatusIcon(status) {
  switch (status) {
    case 'approved':
      return <CheckCircle size={16} />;
    case 'pending':
      return <Clock size={16} />;
    case 'completed':
      return <CheckCircle size={16} />;
    case 'checked_in':
      return <AlertCircle size={16} />;
    default:
      return <AlertCircle size={16} />;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Doctor room queue state from API: Enabled | Paused | Disabled, or inactive when no data */
function formatQueueRoomStatus(status) {
  if (!status) return '—';
  const s = String(status);
  if (s.toLowerCase() === 'inactive') return 'No queue data';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function queueRoomStatusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'enabled') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90';
  if (s === 'paused') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/90';
  if (s === 'disabled') return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/90';
  if (s === 'inactive') return 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/90';
  return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/90';
}

export default function PatientDashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { patient, logout } = useAuth();

  const [user, setUser] = useState(
    patient || {
      fullName: 'Loading...',
      email: '',
      contactNumber: '',
      nic: '',
      profileImage: '',
    }
  );

  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    if (patient) {
      setUser(patient);
    }
  }, [patient]);

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const [queueStatus, setQueueStatus] = useState({
    isInQueue: false,
    queueNumber: null,
    position: null,
    estimatedWaitTime: 0,
    status: 'inactive',
    doctorName: '',
  });

  const [appointments, setAppointments] = useState({ upcoming: [], past: [] });
  const [dashLoading, setDashLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setDashLoading(true);
      try {
        const data = await fetchMyAppointments();
        if (!mounted) return;
        const all = data.appointments || [];

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayKey = startOfToday.toDateString();

        const upcoming = all
          .filter((a) => new Date(a.appointmentDate) >= startOfToday && a.status !== 'cancelled')
          .map((a) => ({
            id: a._id,
            date: a.appointmentDate,
            time: new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor: a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor',
            department: a.doctorId?.specialization || a.doctorId?.speciality || 'General',
            status: a.status === 'booked' ? 'approved' : a.status,
            type: (a.visitReason || 'consultation').replace(/_/g, ' '),
            doctorId: a.doctorId?._id || a.doctorId,
          }));

        const past = all
          .filter((a) => new Date(a.appointmentDate) < startOfToday || a.status === 'completed')
          .map((a) => ({
            id: a._id,
            date: a.appointmentDate,
            time: new Date(a.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            doctor: a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor',
            department: a.doctorId?.specialization || a.doctorId?.speciality || 'General',
            status: a.status,
            type: (a.visitReason || 'consultation').replace(/_/g, ' '),
          }));

        setAppointments({ upcoming, past });

        const todayAppt = all.find((a) => new Date(a.appointmentDate).toDateString() === todayKey);
        const todayDoctorId = todayAppt?.doctorId?._id || todayAppt?.doctorId || '';
        const todayDoctorName =
          todayAppt?.doctorId?.doctorName || todayAppt?.doctorId?.fullName || '';

        if (todayDoctorId) {
          try {
            const q = await fetchMyQueueStatusToday(todayDoctorId);
            if (!mounted) return;
            setQueueStatus({
              isInQueue: Boolean(q?.tokenNumber),
              queueNumber: q?.tokenNumber || null,
              position: q?.position ?? null,
              estimatedWaitTime: q?.estimatedWaitMinutes ?? 0,
              status: q?.queueStatus || 'inactive',
              doctorName: todayDoctorName,
            });
          } catch {
            setQueueStatus({
              isInQueue: false,
              queueNumber: null,
              position: null,
              estimatedWaitTime: 0,
              status: 'inactive',
              doctorName: todayDoctorName,
            });
          }
        } else {
          setQueueStatus({
            isInQueue: false,
            queueNumber: null,
            position: null,
            estimatedWaitTime: 0,
            status: 'inactive',
            doctorName: '',
          });
        }
      } finally {
        if (mounted) setDashLoading(false);
      }
    };

    // load only for dashboard view; other routes render their own pages
    if (location.pathname === '/dashboard') load();
    return () => {
      mounted = false;
    };
  }, [location.pathname]);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      window.location.href = '/';
    }
  };

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/dashboard' },
    { id: 'appointments', icon: Calendar, label: 'Get Appointment', path: '/appointments/book' },
    { id: 'history', icon: History, label: 'My Appointments', path: '/appointments/mine' },
    { id: 'queue', icon: Activity, label: 'Queue Status', path: '/queue' },
    { id: 'followups', icon: TrendingUp, label: 'Follow-Ups', path: '/appointments/followups' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
    { id: 'ReportsPage', icon: FileText, label: 'Reports', path: '/reports' },
  ];

  const pathname = location.pathname;

  const renderMainContent = () => {
    if (pathname === '/dashboard') {
      return (
        <div className="p-6 space-y-6">
          <div className="bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] rounded-xl p-6 text-white shadow-lg">
            <h2 className="text-2xl font-bold mb-2 text-white">Welcome, {user.fullName}!</h2>
            <p className="text-white/90">Manage your appointments and track your queue status in real-time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={() => navigate('/appointments/mine?filter=upcoming')}
              className="text-left bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1 text-[#6B7280]">Upcoming</p>
                  <p className="text-2xl font-bold text-[#1F2937]">{appointments.upcoming.length}</p>
                </div>
                <div className="bg-[#DBEAFE] p-3 rounded-lg">
                  <Calendar size={24} className="text-[#2563EB]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/queue')}
              className="text-left bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1 text-[#6B7280]">In Queue</p>
                  <p className="text-2xl font-bold text-[#1F2937]">{queueStatus.isInQueue ? 'Yes' : 'No'}</p>
                </div>
                <div className="bg-[#CCFBF1] p-3 rounded-lg">
                  <Activity size={24} className="text-[#0D9488]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/appointments/mine?filter=completed')}
              className="text-left bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1 text-[#6B7280]">Completed</p>
                  <p className="text-2xl font-bold text-[#1F2937]">{appointments.past.length}</p>
                </div>
                <div className="bg-[#DCFCE7] p-3 rounded-lg">
                  <CheckCircle size={24} className="text-[#16A34A]" />
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/queue')}
              className="text-left bg-white rounded-lg p-5 border border-[#E5E7EB] shadow-[0_1px_3px_0_rgba(0,0,0,0.08)] hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1 text-[#6B7280]">Wait Time</p>
                  <p className="text-2xl font-bold text-[#1F2937]">
                    {queueStatus.isInQueue ? `${queueStatus.estimatedWaitTime}m` : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#FEF3C7] p-3 rounded-lg">
                  <Timer size={24} className="text-[#EA580C]" />
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={() => navigate('/queue')}
            className="w-full text-left rounded-2xl bg-white border border-[#BAE6FD]/80 shadow-[0_4px_24px_rgba(15,76,129,0.08)] ring-1 ring-slate-200/60 overflow-hidden transition hover:shadow-[0_8px_30px_rgba(15,76,129,0.12)] hover:border-[#93C5FD] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9DF4] focus-visible:ring-offset-2"
          >
            <div className="p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] shadow-sm">
                    <Activity className="text-white" size={22} strokeWidth={2.25} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-[#0F4C81] tracking-tight">
                      Current Queue Status
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-0.5">Real-time updates</p>
                    {queueStatus.doctorName && (
                      <p className="text-xs text-[#9CA3AF] mt-1.5">
                        Today: <span className="text-[#6B7280] font-medium">{queueStatus.doctorName}</span>
                      </p>
                    )}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center self-start rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide ${queueRoomStatusBadgeClass(
                    queueStatus.status
                  )}`}
                >
                  {dashLoading ? 'Loading…' : formatQueueRoomStatus(queueStatus.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="rounded-xl bg-white p-4 border border-slate-200/90 shadow-sm">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">Queue number</p>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0F4C81]">
                    {queueStatus.queueNumber ?? '—'}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-200/90 shadow-sm">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">Position</p>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0F4C81]">
                    {queueStatus.position ?? '—'}
                  </p>
                  <p className="text-xs mt-1 text-[#9CA3AF]">people ahead</p>
                </div>
                <div className="rounded-xl bg-white p-4 border border-slate-200/90 shadow-sm">
                  <p className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide mb-1.5">Est. wait time</p>
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums text-[#0F4C81]">
                    {queueStatus.estimatedWaitTime ?? 0}
                  </p>
                  <p className="text-xs mt-1 text-[#9CA3AF]">minutes</p>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#BAE6FD] bg-[#F0F9FF] px-4 py-3">
                <Bell className="text-[#0F4C81] shrink-0 mt-0.5" size={18} strokeWidth={2} />
                <p className="text-sm leading-snug text-[#0F4C81]">
                  You&apos;ll be notified when it&apos;s your turn. Please stay nearby.
                </p>
              </div>
              <p className="mt-4 text-xs text-center text-[#6B7280] sm:text-right">Open full queue page →</p>
            </div>
          </button>

          <div className="bg-[#F0F9FF] rounded-xl shadow-md border-2 border-[#BAE6FD] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#0F4C81] flex items-center gap-2">
                <div className="bg-[#2A9DF4] p-2 rounded-lg">
                  <Calendar className="text-white" size={20} />
                </div>
                Upcoming Appointments
              </h3>
            </div>
            {appointments.upcoming.length > 0 ? (
              <div className="space-y-3">
                {appointments.upcoming.map((appointment) => (
                  <button
                    type="button"
                    key={appointment.id}
                    onClick={() =>
                      navigate(`/appointments/mine?filter=upcoming&id=${encodeURIComponent(String(appointment.id))}`)
                    }
                    className="w-full text-left bg-white rounded-lg p-4 border border-[#E5E7EB] hover:shadow-md hover:border-[#BAE6FD] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9DF4] focus-visible:ring-offset-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-[#0F4C81]">{appointment.doctor}</h4>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 shrink-0 ${getStatusColor(
                              appointment.status
                            )}`}
                          >
                            {getStatusIcon(appointment.status)}
                            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1).replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-[#6B7280] mb-1">{appointment.department}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#6B7280] mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(appointment.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {appointment.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <Activity size={14} />
                            {appointment.type}
                          </span>
                        </div>
                      </div>
                      <span className="text-[#2A9DF4] text-sm font-medium shrink-0 pt-1" aria-hidden>
                        View →
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6B7280]">
                <Calendar size={48} className="mx-auto mb-2 text-[#BAE6FD]" />
                <p>No upcoming appointments</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (pathname === '/appointments/book') {
      return <BookAppointmentPage />;
    }

    if (pathname === '/appointments/mine') {
      return <MyAppointmentsPage />;
    }

    if (pathname === '/queue') {
      return <QueueStatusPage />;
    }

    if (pathname === '/appointments/followups') {
      return <PatientFollowUpsPage />;
    }

    if (pathname === '/reports') {
      return <ReportsPage />;
    }

    if (pathname === '/profile') {
      return <UserProfile />;
    }

    if (pathname === '/notifications') {
      return <NotificationsPage />;
    }

    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">Page not found.</p>
      </div>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50 flex flex-col">
      <header className="bg-gradient-to-r from-[#0F4C81] to-[#2A9DF4] text-white shadow-xl z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLogoClick}
            className="flex items-center gap-3 focus:outline-none hover:opacity-90 transition"
            aria-label="Go to home page"
          >
            <div className="bg-white/25 p-2 rounded-lg shadow-md">
              <Eye size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Queue Management System</h2>
            </div>
          </button>
          <div className="flex items-center gap-4">
            {/* Notification bell icon */}
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/60"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-white" />
            </button>
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white bg-white/30 flex items-center justify-center">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-white" />
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-white/90">Welcome back,</p>
                <p className="font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-white/70">{currentDateTime.toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/25 hover:bg-white/35 px-4 py-2 rounded-lg transition-all duration-200 shadow-md text-white"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 bg-gradient-to-b from-[#0E7490] to-[#14B8A6] text-white border-r border-gray-200 flex flex-col shadow-sm h-full">
          <nav className="flex-1 p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              const handleClick = () => {
                if (item.path) navigate(item.path);
              };

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={handleClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive ? 'bg-[#14B8A6] text-white shadow-md' : 'text-white/90 hover:bg-[#0D9488]'
                  }`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="p-2 border-t border-white/20 mt-auto">
            <div className="bg-gradient-to-b from-[#0E7490] to-[#14B8A6] rounded-lg p-2 text-white shadow-md">
              <div className="flex items-center gap-1.5 mb-1">
                <Bell size={14} className="text-white" />
                <span className="text-xs font-semibold text-white">Quick Help</span>
              </div>
              <p className="text-xs text-white/90 leading-tight">
                Need assistance? Contact us at +94 11 234 5678
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-50">{renderMainContent()}</main>
      </div>
    </div>
  );
}
