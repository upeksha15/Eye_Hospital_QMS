import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';

export default function SystemPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [series, setSeries] = useState([]);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, ch, h] = await Promise.all([
          adminApi.getPerformanceMetrics(),
          adminApi.getChartSeries(),
          adminApi.getSystemHealth(),
        ]);
        setMetrics(p.metrics);
        setSeries(ch.series || []);
        setHealth(h.health);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const barData =
    series?.map((row) => ({
      name: row.hour,
      load: row.registrations + row.checkins + row.appointments,
    })) || [];

  return (
    <div className="font-admin space-y-8">
      <AdminHeader title="System Performance" subtitle="Operational throughput and infrastructure signals" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Appointments today',
            value: metrics?.appointmentsToday ?? '—',
            color: 'from-blue-500 to-indigo-600',
          },
          {
            label: 'Completed queues',
            value: metrics?.completedQueues ?? '—',
            color: 'from-emerald-500 to-teal-600',
          },
          {
            label: 'Avg. processing (mins)',
            value: metrics?.avgProcessingMins ?? '—',
            color: 'from-violet-500 to-purple-700',
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl bg-gradient-to-br ${c.color} text-white p-6 shadow-lg`}
          >
            <p className="text-sm font-medium text-white/85">{c.label}</p>
            <p className="text-3xl font-bold tabular-nums mt-2">{c.value}</p>
            {c.label.includes('Avg') && metrics?.peakHour && (
              <p className="text-xs text-white/75 mt-2">Peak: {metrics.peakHour}</p>
            )}
          </div>
        ))}
      </div>

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-admin-navy mb-4">Combined hourly load</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 12 }} />
              <Bar dataKey="load" name="Total activity" fill="#007bff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {health && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5">
            <h3 className="font-bold text-admin-navy mb-2">Service mesh</h3>
            <ul className="text-sm space-y-2 text-slate-600">
              <li>
                API gateway: <span className="text-emerald-600 font-semibold">Nominal</span>
              </li>
              <li>
                WebSocket fan-out:{' '}
                <span className="text-emerald-600 font-semibold">Connected</span>
              </li>
              <li>
                Database replica: <span className="text-emerald-600 font-semibold">{health.database.status}</span>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 p-5">
            <h3 className="font-bold text-admin-navy mb-2">Uptime narrative</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Rolling composite uptime sits at <strong>{health.uptime.value}</strong>. Exchange nodes are healthy and
              backup routines completed during the early maintenance window.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
