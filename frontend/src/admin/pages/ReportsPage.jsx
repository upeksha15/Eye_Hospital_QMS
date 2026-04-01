import React, { useEffect, useState } from 'react';
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
import AdminHeader from '../AdminHeader';
import * as adminApi from '../../api/adminApi';
import { FileDown } from 'lucide-react';

export default function ReportsPage() {
  const [granularity, setGranularity] = useState('week');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const d = await adminApi.getAppointmentsReport({
        granularity,
        referenceDate,
      });
      setReport(d.report);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [granularity, referenceDate]);

  const downloadPdf = async () => {
    try {
      const blob = await adminApi.downloadAppointmentsReportPdf({ granularity, referenceDate });

      // if server returned JSON error wrapped as blob, try to decode and show message
      if (blob.type && blob.type !== 'application/pdf') {
        try {
          const text = await blob.text();
          const json = JSON.parse(text);
          throw new Error(json.message || 'PDF generation failed');
        } catch (e) {
          // If parsing fails, fall through and attempt download anyway
          console.warn('Downloaded blob is not PDF, attempting to save anyway');
        }
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qms-appointments-${granularity}-${referenceDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Delay revoke to ensure browser has started the download
      setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    } catch (e) {
      setErr(e.message || 'PDF download failed');
    }
  };

  const chartData =
    report?.buckets?.map((b) => ({
      name: b.label.length > 18 ? b.label.slice(0, 16) + '…' : b.label,
      appointments: b.appointmentCount,
      uniquePatients: b.uniquePatientCount,
    })) || [];

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Reports"
        subtitle="Appointment volumes by week or month, with PDF export and trend-based forecasts"
      />

      <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <label className="block">
          <span className="text-xs font-semibold text-slate-500">View</span>
          <select
            className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value)}
          >
            <option value="week">Week-wise (last 4 weeks)</option>
            <option value="month">Month-wise (last 6 months)</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-500">Reference date</span>
          <input
            type="date"
            className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
        >
          Refresh
        </button>
        <button
          type="button"
          onClick={downloadPdf}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-navy text-white text-sm font-semibold shadow hover:opacity-95"
        >
          <FileDown className="w-4 h-4" />
          Download PDF
        </button>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{err}</div>
      )}

      {report?.prediction && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
            <p className="text-sm font-medium text-white/85">Predicted appointments (next period)</p>
            <p className="text-4xl font-bold tabular-nums mt-2">
              {report.prediction.nextPeriodAppointments}
            </p>
            <p className="text-xs text-white/75 mt-2">{report.prediction.method?.replace(/_/g, ' ')}</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-lg">
            <p className="text-sm font-medium text-white/85">Predicted unique patients (next period)</p>
            <p className="text-4xl font-bold tabular-nums mt-2">
              {report.prediction.nextPeriodUniquePatients}
            </p>
            <p className="text-xs text-white/75 mt-3 leading-relaxed">{report.prediction.note}</p>
          </div>
        </div>
      )}

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <h2 className="text-lg font-bold text-admin-navy mb-4">Volume chart</h2>
        <div className="h-80">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="appointments" name="Appointments" fill="#007bff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="uniquePatients" name="Unique patients" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <h2 className="text-lg font-bold text-admin-navy p-5 border-b border-slate-100">Detail table</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                <th className="px-5 py-3">Period</th>
                <th className="px-3 py-3">Appointments</th>
                <th className="px-3 py-3">Unique patients</th>
              </tr>
            </thead>
            <tbody>
              {report?.buckets?.map((b, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-700">{b.label}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums">{b.appointmentCount}</td>
                  <td className="px-3 py-3 font-semibold tabular-nums">{b.uniquePatientCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
