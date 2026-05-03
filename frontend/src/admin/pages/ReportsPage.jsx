import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as adminApi from '../../api/adminApi';
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  FileDown,
  ShieldAlert,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import AdminHeader from '../AdminHeader';

// Admin reports and PDF exports.
export default function ReportsPage() {
  const [granularity, setGranularity] = useState('week');
  const [referenceDate, setReferenceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedBucketLabel, setSelectedBucketLabel] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('all');
  const [doctors, setDoctors] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [err, setErr] = useState('');

  const load = useCallback(
    async ({ silent = false } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setErr('');
      try {
        const d = await adminApi.getAppointmentsReport({
          granularity,
          referenceDate,
          doctorId: selectedDoctor === 'all' ? undefined : selectedDoctor,
        });
        setReport(d.report);
        setLastUpdated(new Date());
      } catch (e) {
        setErr(e.response?.data?.message || e.message);
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [granularity, referenceDate, selectedDoctor]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    const loadDoctors = async () => {
      setDoctorLoading(true);
      try {
        const d = await adminApi.getDoctorsAdmin();
        const rows = Array.isArray(d.doctors) ? d.doctors : [];
        if (!cancelled) setDoctors(rows);
      } catch {
        if (!cancelled) setDoctors([]);
      } finally {
        if (!cancelled) setDoctorLoading(false);
      }
    };
    loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      load({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (!report?.buckets?.length) return;
    const latestLabel = report.buckets[report.buckets.length - 1].label;
    if (!selectedBucketLabel || !report.buckets.some((b) => b.label === selectedBucketLabel)) {
      setSelectedBucketLabel(latestLabel);
    }
  }, [report, selectedBucketLabel]);

  const downloadPdf = async () => {
    try {
      const blob = await adminApi.downloadAppointmentsReportPdf({
        granularity,
        referenceDate,
        doctorId: selectedDoctor === 'all' ? undefined : selectedDoctor,
      });

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

  const chartData = useMemo(() => {
    const buckets = report?.buckets || [];
    const base = buckets.map((b) => ({
      name: b.label.length > 18 ? b.label.slice(0, 16) + '…' : b.label,
      appointments: b.appointmentCount,
      uniquePatients: b.uniquePatientCount,
      predictionRangeLow: null,
      predictionRangeHigh: null,
    }));
    if (report?.prediction) {
      const rangeMin = report.prediction.appointmentRange?.min ?? null;
      const rangeMax = report.prediction.appointmentRange?.max ?? null;
      base.push({
        name: granularity === 'week' ? 'Next week' : 'Next month',
        appointments: report.prediction.nextPeriodAppointments,
        uniquePatients: report.prediction.nextPeriodUniquePatients,
        predictionRangeLow: rangeMin,
        predictionRangeHigh: rangeMax,
      });
    }
    return base;
  }, [report, granularity]);

  const latestBucket = report?.buckets?.[report?.buckets?.length - 1] || null;
  const previousBucket = report?.buckets?.[report?.buckets?.length - 2] || null;
  const deltaPct = latestBucket && previousBucket && previousBucket.appointmentCount > 0
    ? ((latestBucket.appointmentCount - previousBucket.appointmentCount) / previousBucket.appointmentCount) * 100
    : null;
  const predictedAppointments = report?.prediction?.nextPeriodAppointments ?? null;
  const predictedRange = report?.prediction?.appointmentRange ?? null;
  const predictedDelta = latestBucket && predictedAppointments != null
    ? predictedAppointments - latestBucket.appointmentCount
    : null;
  const predictedPct = latestBucket && predictedAppointments != null && latestBucket.appointmentCount > 0
    ? (predictedDelta / latestBucket.appointmentCount) * 100
    : null;
  const riskLevel = predictedPct != null && predictedPct >= 20 ? 'High Risk' : 'Normal';

  const monthValue = referenceDate.slice(0, 7);
  const bucketOptions = report?.buckets || [];
  const selectedBucket = bucketOptions.find((b) => b.label === selectedBucketLabel) || latestBucket;
  const selectedBucketLabelText = selectedBucket?.label || '—';

  const parseLabelEndDate = (label) => {
    if (!label) return null;
    const matches = label.match(/\d{4}-\d{2}-\d{2}/g);
    if (!matches || matches.length < 1) return null;
    return matches[matches.length - 1];
  };

  const handleBucketChange = (label) => {
    setSelectedBucketLabel(label);
    const endDate = parseLabelEndDate(label);
    if (endDate) {
      setReferenceDate(endDate);
    }
  };

  const handleMonthChange = (value) => {
    if (!value) return;
    setReferenceDate(`${value}-01`);
  };

  const formatPct = (value) => {
    if (value == null || !Number.isFinite(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Reports"
        subtitle="Weekly Patient Prediction Reports"
      />

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Select Month</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <CalendarRange className="w-4 h-4 text-slate-400" />
              <input
                type="month"
                className="bg-transparent outline-none"
                value={monthValue}
                onChange={(e) => handleMonthChange(e.target.value)}
              />
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Select Week</span>
            <select
              className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm min-w-[220px]"
              value={selectedBucketLabelText}
              onChange={(e) => handleBucketChange(e.target.value)}
            >
              {bucketOptions.map((b) => (
                <option key={b.label} value={b.label}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Select Doctor</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm">
              <Stethoscope className="w-4 h-4 text-slate-400" />
              <select
                className="bg-transparent outline-none"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={doctorLoading}
              >
                <option value="all">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.fullName}
                  </option>
                ))}
              </select>
            </div>
          </label>
          <button
            type="button"
            onClick={() => load()}
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
            Download Report
          </button>
          <div className="ml-auto text-xs text-slate-400">
            {refreshing ? 'Updating...' : lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : '—'}
          </div>
        </div>
      </div>

      {err && (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">{err}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/85">Total Appointments This Week</p>
                <BarChart3 className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-4xl font-bold tabular-nums mt-2">
                {selectedBucket?.appointmentCount ?? '—'}
              </p>
              <p className="text-xs text-white/75 mt-2">{selectedBucket?.label || '—'}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/85">Predicted Appointments</p>
                <TrendingUp className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-4xl font-bold tabular-nums mt-2">{predictedAppointments ?? '—'}</p>
              <div className="flex items-center gap-2 text-xs text-white/80 mt-2">
                <span>{formatPct(predictedPct)} Increase</span>
              </div>
            </div>
          </div>

          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
            <h2 className="text-lg font-bold text-admin-navy mb-4">Weekly Patient Volume & Prediction</h2>
            <div className="h-80">
              {loading ? (
                <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      name="Current Week"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="uniquePatients"
                      name="Next Week (Predicted)"
                      stroke="#16a34a"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictionRangeLow"
                      name="Prediction Range (Min)"
                      stroke="#22c55e"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2 }}
                      connectNulls={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictionRangeHigh"
                      name="Prediction Range (Max)"
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 2 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-admin-navy">Weekly Details - {monthValue}</h2>
              <button
                type="button"
                onClick={downloadPdf}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-navy text-white text-xs font-semibold shadow hover:opacity-95"
              >
                <FileDown className="w-4 h-4" />
                Generate & download report
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                    <th className="px-5 py-3">Period</th>
                    <th className="px-3 py-3">Appointments</th>
                    <th className="px-3 py-3">Prediction Range</th>
                    <th className="px-3 py-3">Unique patients</th>
                    <th className="px-3 py-3">Change (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.buckets?.map((b, i) => {
                    const prev = i > 0 ? report.buckets[i - 1] : null;
                    const changePct = prev && prev.appointmentCount > 0
                      ? ((b.appointmentCount - prev.appointmentCount) / prev.appointmentCount) * 100
                      : null;
                    const isSelected = selectedBucket?.label === b.label;
                    return (
                      <tr
                        key={i}
                        className={`border-t border-slate-100 ${isSelected ? 'bg-amber-50/60' : ''}`}
                      >
                        <td className="px-5 py-3 text-slate-700">{b.label}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{b.appointmentCount}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums text-slate-600">
                          {i === report.buckets.length - 1 && predictedRange
                            ? `${predictedRange.min} - ${predictedRange.max}`
                            : '—'}
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{b.uniquePatientCount}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums text-emerald-600">
                          {changePct == null ? '—' : formatPct(changePct)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Forecasting Trends
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Steady upward trend in patient volume over recent periods.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                Demand Prediction
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Predicting an increase in patient visits next week based on current trend.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Risk Identification
              </div>
              <p className="text-sm text-slate-600 mt-2">
                Identified a high risk alert due to the predicted surge in appointments.
              </p>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              Prediction Summary
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Based on the current trend, the predicted patient count for next week is{' '}
              <span className="font-semibold text-slate-900">{predictedAppointments ?? '—'}</span>.
            </p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 mt-3">
              {riskLevel}
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Demand Increase
            </div>
            <p className="text-sm text-slate-600 mt-2">
              High confidence, projected demand increase of{' '}
              <span className="font-semibold text-slate-900">
                {predictedDelta == null ? '—' : `${predictedDelta > 0 ? '+' : ''}${predictedDelta}`}
              </span>{' '}
              patients next week.
            </p>
            <p className="text-xs text-slate-500 mt-2">Confidence based on recent trend buckets.</p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Risk Due
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {predictedPct != null && predictedPct >= 20
                ? 'Identified a high risk alert due to the predicted surge in appointments.'
                : 'Continue at a stable pace. No surge detected for the next week.'}
            </p>
            <p className="text-xs text-slate-500 mt-2">{deltaPct == null ? '—' : `${formatPct(deltaPct)} vs previous period`}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
