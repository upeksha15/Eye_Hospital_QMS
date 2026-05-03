import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
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
  const [chartDetails, setChartDetails] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detailView, setDetailView] = useState(null); // 'appointments', 'queues'
  const [appointmentsData, setAppointmentsData] = useState(null);
  const [queuesData, setQueuesData] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async (options) => {
      const showLoading = Boolean(options?.showLoading);
      if (cancelled) return;
      if (showLoading) setLoading(true);
      try {
        const [s, ch, act] = await Promise.all([
          adminApi.getDashboardStats(),
          adminApi.getChartSeries(),
          adminApi.getRecentActivity(),
        ]);
        if (cancelled) return;
        setStats(s.stats);
        setSeries(ch.series || []);
        setChartDetails(ch.details || null);
        setActivity(act.items || []);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        console.error('Dashboard error:', e);
        if (!cancelled) setError(e.message || 'Failed to load dashboard data');
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    };

    refresh({ showLoading: true });
    const intervalId = window.setInterval(() => refresh(), 10000);
    const handleFocus = () => refresh();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
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

  const chartTotals = chartDetails?.totals || {
    registrations: 0,
    checkins: 0,
    appointments: 0,
    total: 0,
  };
  const activeChartRows = series.filter((row) => row.total > 0);

  const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const total = payload.reduce((sum, item) => sum + Number(item.value || 0), 0);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
        <p className="text-xs font-bold text-slate-900">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((item) => (
            <div key={item.dataKey} className="flex items-center justify-between gap-6 text-xs">
              <span style={{ color: item.fill }}>{item.name}</span>
              <span className="font-semibold text-slate-900 tabular-nums">{item.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 border-t border-slate-100 pt-2 text-xs font-semibold text-slate-700">
          Total: {total}
        </p>
      </div>
    );
  };

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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-admin-navy">System Overview</h2>
              <p className="mt-1 text-xs text-slate-500">
                Hourly activity for today across patient registrations, queue check-ins, and appointment bookings.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs sm:min-w-56">
              <div className="rounded-xl bg-blue-50 px-3 py-2">
                <p className="font-semibold text-blue-700">Registrations</p>
                <p className="text-lg font-bold text-blue-900 tabular-nums">{chartTotals.registrations}</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2">
                <p className="font-semibold text-emerald-700">Check-ins</p>
                <p className="text-lg font-bold text-emerald-900 tabular-nums">{chartTotals.checkins}</p>
              </div>
              <div className="rounded-xl bg-violet-50 px-3 py-2">
                <p className="font-semibold text-violet-700">Appointments</p>
                <p className="text-lg font-bold text-violet-900 tabular-nums">{chartTotals.appointments}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <p className="font-semibold text-slate-600">Peak Hour</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{chartDetails?.peakHour || '—'}</p>
              </div>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="hour"
                  interval={2}
                  tick={{ fontSize: 11 }}
                  stroke="#94a3b8"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Legend />
                <Bar
                  dataKey="registrations"
                  name="Registrations"
                  fill="#007bff"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="checkins"
                  name="Check-ins"
                  fill="#16a34a"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
                <Bar
                  dataKey="appointments"
                  name="Appointments"
                  fill="#7c3aed"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-admin-navy">Chart Details</h3>
              <p className="text-xs text-slate-500">
                Total activity: <span className="font-semibold text-slate-800">{chartTotals.total}</span>
              </p>
            </div>
            {activeChartRows.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {activeChartRows.slice(0, 6).map((row) => (
                  <div key={row.hour} className="rounded-lg bg-white px-3 py-2 text-xs border border-slate-100">
                    <p className="font-bold text-slate-900">{row.hour}</p>
                    <p className="mt-1 text-slate-600">
                      Reg {row.registrations} · Check-ins {row.checkins} · Appts {row.appointments}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No activity has been recorded for today yet.</p>
            )}
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

      {detailView === 'appointments' && (
        <TodayAppointmentsDetail data={appointmentsData} onClose={closeDetailView} />
      )}
      {detailView === 'queues' && (
        <ActiveQueuesDetail data={queuesData} onClose={closeDetailView} />
      )}
    </div>
  );
}
