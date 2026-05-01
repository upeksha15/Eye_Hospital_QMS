import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  UserPlus,
  ListOrdered,
  ChevronRight,
  Stethoscope as DocIcon,
} from 'lucide-react';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import TodayAppointmentsDetail from './TodayAppointmentsDetail';
import ActiveQueuesDetail from './ActiveQueuesDetail';

// Admin dashboard landing page (stats, charts, and health).
export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [series, setSeries] = useState([]);
  const [activity, setActivity] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailView, setDetailView] = useState(null); // 'appointments', 'queues'
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [queuesData, setQueuesData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      try {
        const [s, ch, act, h] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getChartSeries(),
          adminApi.getRecentActivity(),
          adminApi.getSystemHealth(),
        ]);
        if (cancelled) return;
        console.log('Dashboard stats:', s);
        setStats(s.stats);
        setSeries(ch.series || []);
        setActivity(act.items || []);
        setHealth(h.health);
        setError(null);
      } catch (e) {
        console.error('Dashboard error:', e);
        if (!cancelled) setError(e.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDashboard();
    const intervalId = setInterval(loadDashboard, 30000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, []);

  const handleAppointmentsClick = async () => {
    try {
      const data = await adminApi.getTodayAppointmentsDetail();
      setAppointmentsData(data);
      setDetailView('appointments');
    } catch (e) {
      console.error('Error loading appointments:', e);
    }
  };

  const handleQueuesClick = async () => {
    try {
      const data = await adminApi.getActiveQueuesDetail();
      setQueuesData(data);
      setDetailView('queues');
    } catch (e) {
      console.error('Error loading queues:', e);
    }
  };

  const closeDetailView = () => {
    setDetailView(null);
  };

  const statCards = [
    {
      label: "Today's Patients",
      value: stats?.todayPatients ?? '—',
      hint: stats ? `↗ ${stats.patientDeltaPercent}%` : '',
      hintClass: 'text-emerald-600',
      icon: UserPlus,
      accent: 'border-l-4 border-emerald-500',
    },
    {
      label: 'Active Queues',
      value: stats?.activeQueues ?? '—',
      hint: 'Queue sessions operating',
      hintClass: 'text-admin-purple font-medium',
      icon: ListOrdered,
      accent: 'border-l-4 border-violet-500',
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-6 font-admin">
        <div className="h-16 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="font-admin">
      <AdminHeader
        title="Admin Dashboard"
        subtitle="Manage hospital operations and system configurations"
      />

      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">
            <strong>Error loading dashboard:</strong> {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {statCards.map((c) => {
          let onClick = null;
          if (c.label === "Today's Patients") onClick = handleAppointmentsClick;
          if (c.label === 'Active Queues') onClick = handleQueuesClick;

          return (
            <button
              key={c.label}
              onClick={onClick}
              disabled={!onClick}
              className={`rounded-2xl bg-white p-5 shadow-sm border border-slate-200/80 ${c.accent} ${
                onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300 transition' : ''
              } text-left disabled:cursor-default`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{c.label}</p>
                  <p className="text-3xl font-bold text-admin-navy mt-1 tabular-nums">{c.value}</p>
                  <p className={`text-xs mt-2 ${c.hintClass}`}>{c.hint}</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 text-slate-500">
                  <c.icon className="w-5 h-5" />
                </div>
              </div>
              {onClick && <p className="text-xs mt-2 text-slate-400">Click to view details</p>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <section className="xl:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-admin-navy mb-4">System Overview</h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  name="Registrations"
                  stroke="#007bff"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="checkins"
                  name="Check-ins"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="appointments"
                  name="Appointments"
                  stroke="#7c3aed"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-admin-navy">Recent Activity</h2>
            <Link
              to="/admin/audit-logs"
              className="text-sm font-semibold text-admin-accent flex items-center gap-1 hover:underline"
            >
              View All Logs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <ul className="space-y-3 flex-1 overflow-y-auto max-h-80">
            {activity.map((item) => (
              <li
                key={item._id}
                className="flex gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-blue-100 text-admin-accent flex items-center justify-center shrink-0">
                  <DocIcon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{item.action}</p>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <section className="xl:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
          <h2 className="text-lg font-bold text-admin-navy mb-2">Operations</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Staff and administrator accounts are created under <strong>Staff accounts</strong>. Patients register on
            the public site and sign in with <strong>Patient</strong> on the login page. Use <strong>Reports</strong>{' '}
            for week- and month-wise appointment volumes and forecasts.
          </p>
        </section>

        <section className="rounded-2xl bg-transparent">
          <h2 className="text-lg font-bold text-admin-navy mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Staff accounts', to: '/admin/staff-accounts', color: 'bg-[#007bff] hover:bg-blue-600' },
              { label: 'Patients', to: '/admin/users', color: 'bg-admin-purple hover:bg-violet-700' },
              { label: 'Reports', to: '/admin/reports', color: 'bg-admin-teal hover:bg-teal-700' },
              { label: 'System performance', to: '/admin/performance', color: 'bg-admin-orange hover:bg-orange-700' },
            ].map((qa) => (
              <Link
                key={qa.to}
                to={qa.to}
                className={`${qa.color} text-white rounded-2xl p-6 min-h-[100px] flex items-center justify-center text-center text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]`}
              >
                {qa.label}
              </Link>
            ))}
          </div>
        </section>
      </div>

      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-xl bg-white border border-slate-200/80 p-4 flex gap-3 items-center shadow-sm">
            <span className={`w-3 h-3 rounded-full ${health.server.ok ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <div>
              <p className="text-xs font-semibold text-slate-500">Server Status</p>
              <p className="font-bold text-admin-navy">{health.server.status}</p>
              <p className="text-xs text-slate-500">{health.server.detail}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4 flex gap-3 items-center shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              ◈
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Database</p>
              <p className="font-bold text-admin-navy">{health.database.status}</p>
              <p className="text-xs text-slate-500">{health.database.detail}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4 flex gap-3 items-center shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              👥
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">Active Connections</p>
              <p className="font-bold text-admin-navy text-xl tabular-nums">{health.connections.value}</p>
              <p className="text-xs text-slate-500">{health.connections.detail}</p>
            </div>
          </div>
          <div className="rounded-xl bg-white border border-slate-200/80 p-4 flex gap-3 items-center shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
              %
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500">System Uptime</p>
              <p className="font-bold text-admin-navy text-xl tabular-nums">{health.uptime.value}</p>
              <p className="text-xs text-slate-500">{health.uptime.detail}</p>
            </div>
          </div>
        </div>
      )}

      {detailView === 'appointments' && (
        <TodayAppointmentsDetail data={appointmentsData} onClose={closeDetailView} />
      )}
      {detailView === 'queues' && (
        <ActiveQueuesDetail data={queuesData} onClose={closeDetailView} />
      )}
    </div>
  );
}
