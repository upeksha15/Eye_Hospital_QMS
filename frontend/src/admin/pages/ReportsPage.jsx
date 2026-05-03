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
        const d = await adminApi.getDoctorRoomsAdmin();
        const rows = Array.isArray(d.rooms) ? d.rooms : [];
        if (!cancelled) {
          setDoctors(
            rows.map((room) => ({
              _id: room._id,
              fullName: room.doctorName || room.fullName || 'Doctor',
              speciality: room.specialization || room.speciality || '',
              room: room.room || '',
            }))
          );
        }
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
    if (!report?.daily?.days) return [];
    const avgDaily = report.daily.dailyAverage || 0;
    return report.daily.days.map((d, idx) => ({
      name: `${d.label}\n${d.date}`,
      shortName: d.label.slice(0, 3),
      appointments: d.appointmentCount,
      prediction: avgDaily,
      predictionMin: Math.max(0, avgDaily - 2),
      predictionMax: avgDaily + 2,
      isNextWeek: idx >= 7,
      date: d.date,
    }));
  }, [report?.daily?.days, report?.daily?.dailyAverage]);

  const totalCurrentWeek = report?.daily?.totalWeek ?? 0;
  const avgCurrentWeek = report?.daily?.dailyAverage ?? 0;
  const nextWeekPredicted = avgCurrentWeek * 7;
  const deltaPct = totalCurrentWeek > 0 ? ((nextWeekPredicted - totalCurrentWeek) / totalCurrentWeek) * 100 : null;
  const predictedRange = report?.prediction?.appointmentRange ?? null;
  const predictedDelta = nextWeekPredicted - totalCurrentWeek;
  const riskLevel = deltaPct != null && deltaPct >= 20 ? 'High Risk' : 'Normal';

  const monthValue = referenceDate.slice(0, 7);

  const getCurrentWeekRange = () => {
    if (!report?.daily?.days || report.daily.days.length < 7) return '—';
    const firstDay = report.daily.days[0].date;
    const lastDay = report.daily.days[6].date;
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    return `${formatDate(firstDay)} → ${formatDate(lastDay)}`;
  };

  const handleMonthChange = (value) => {
    if (!value) return;
    setReferenceDate(`${value}-01`);
  };

  const formatPct = useCallback((value) => {
    if (value == null || !Number.isFinite(value)) return '—';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  }, []);

  const formatChangeFromCounts = useCallback((current, previous) => {
    if (previous == null) return '—';
    if (previous === 0) return current > 0 ? '+100.0%' : '0.0%';
    return formatPct(((current - previous) / previous) * 100);
  }, [formatPct]);

  const getPredictedWeekRange = () => {
    if (!report?.daily?.days || report.daily.days.length < 14) return '—';
    const firstDay = report.daily.days[7].date;
    const lastDay = report.daily.days[13].date;
    const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    return `${formatDate(firstDay)} → ${formatDate(lastDay)}`;
  };

  const currentMonthDisplay = new Date(`${monthValue}-01`).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  // Get selected doctor name for display
  const selectedDoctorName = selectedDoctor === 'all' 
    ? 'All Doctors'
    : doctors.find(d => d._id === selectedDoctor)?.fullName || 'Unknown Doctor';

  const weeklyDetailsRows = useMemo(() => {
    const buckets = report?.buckets || [];
    const rows = buckets.map((b, i) => {
      const prev = i > 0 ? buckets[i - 1] : null;
      return {
        key: `actual-${b.start || i}`,
        label: b.label,
        appointmentCount: b.appointmentCount,
        predictionRange:
          i === buckets.length - 1 && predictedRange
            ? `${predictedRange.min} - ${predictedRange.max}`
            : '—',
        uniquePatients: b.uniquePatientCount,
        change: formatChangeFromCounts(b.appointmentCount, prev?.appointmentCount),
        isPrediction: false,
      };
    });

    if (report?.daily?.days?.length >= 14) {
      const nextWeekStart = report.daily.days[7].date;
      const nextWeekEnd = report.daily.days[13].date;
      const uniqueRange = report?.prediction?.uniquePatientRange;
      rows.push({
        key: 'predicted-next-week',
        label: `${nextWeekStart} → ${nextWeekEnd} (Predicted)`,
        appointmentCount: Math.round(nextWeekPredicted),
        predictionRange: predictedRange ? `${predictedRange.min} - ${predictedRange.max}` : '—',
        uniquePatients: uniqueRange ? `${uniqueRange.min} - ${uniqueRange.max}` : '—',
        change: formatChangeFromCounts(Math.round(nextWeekPredicted), totalCurrentWeek),
        isPrediction: true,
      });
    }

    return rows;
  }, [
    report?.buckets,
    report?.daily?.days,
    report?.prediction?.uniquePatientRange,
    predictedRange,
    nextWeekPredicted,
    totalCurrentWeek,
    formatChangeFromCounts,
  ]);

  return (
    <div className="font-admin space-y-8">
      <AdminHeader
        title="Reports"
        subtitle="Weekly Patient Prediction Reports"
      />

      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Current Month</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700">
              <CalendarRange className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{currentMonthDisplay}</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Current Week</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-700 min-w-[280px]">
              <CalendarRange className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{getCurrentWeekRange()}</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Predicted Week</span>
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700 min-w-[280px]">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="font-medium">{getPredictedWeekRange() || '—'}</span>
            </div>
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-500">Filter by Doctor</span>
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
          {selectedDoctor !== 'all' && (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-sm">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-blue-700">Showing: {selectedDoctorName}</span>
            </div>
          )}
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
                {totalCurrentWeek ?? '—'}
              </p>
              <p className="text-xs text-white/75 mt-2">{selectedDoctor === 'all' ? 'All doctors (Mon-Sun)' : `${selectedDoctorName} (Mon-Sun)`}</p>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white/85">Predicted Appointments Next Week</p>
                <TrendingUp className="w-5 h-5 text-white/80" />
              </div>
              <p className="text-4xl font-bold tabular-nums mt-2">{Math.round(nextWeekPredicted) ?? '—'}</p>
              <div className="flex items-center gap-2 text-xs text-white/80 mt-2">
                <span>{formatPct(deltaPct)} Increase vs this week</span>
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
                  <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="shortName" 
                      tick={{ fontSize: 10 }} 
                      interval={0}
                      angle={-25} 
                      textAnchor="end" 
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                      formatter={(value) => Math.round(value)}
                      labelFormatter={(label, payload) => {
                        if (payload && payload.length > 0) {
                          return `${payload[0].payload.shortName} ${payload[0].payload.date}`;
                        }
                        return label;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      name="Current Week"
                      stroke="#2563eb"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563eb' }}
                      activeDot={{ r: 6 }}
                      connectNulls={false}
                      isAnimationActive={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="prediction"
                      name="Next Week (Predicted)"
                      stroke="#16a34a"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#16a34a' }}
                      connectNulls={true}
                      isAnimationActive={true}
                    />
                    <Line
                      type="monotone"
                      dataKey="predictionMin"
                      stroke="#22c55e"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                      connectNulls={true}
                      isAnimationActive={false}
                      name="Prediction Range (Min)"
                    />
                    <Line
                      type="monotone"
                      dataKey="predictionMax"
                      stroke="#16a34a"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      dot={false}
                      connectNulls={true}
                      isAnimationActive={false}
                      name="Prediction Range (Max)"
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
                  {weeklyDetailsRows.map((row) => {
                    return (
                      <tr
                        key={row.key}
                        className={`border-t border-slate-100 ${row.isPrediction ? 'bg-emerald-50/70' : ''}`}
                      >
                        <td className={`px-5 py-3 ${row.isPrediction ? 'font-semibold text-emerald-800' : 'text-slate-700'}`}>
                          {row.label}
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{row.appointmentCount}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums text-slate-600">
                          {row.predictionRange}
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{row.uniquePatients}</td>
                        <td className={`px-3 py-3 font-semibold tabular-nums ${row.change.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {row.change}
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
              {selectedDoctor === 'all' 
                ? `Based on daily trends, all doctors predicted at ${Math.round(nextWeekPredicted)} appointments next week.`
                : `${selectedDoctorName} predicted at ${Math.round(nextWeekPredicted)} appointments next week.`
              }
            </p>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mt-3 ${
              riskLevel === 'High Risk' 
                ? 'bg-red-50 text-red-700' 
                : 'bg-green-50 text-green-700'
            }`}>
              {riskLevel}
            </span>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              Demand Increase
            </div>
            <p className="text-sm text-slate-600 mt-2">
              Projected demand increase of{' '}
              <span className="font-semibold text-slate-900">
                {predictedDelta == null ? '—' : `${predictedDelta > 0 ? '+' : ''}${Math.round(predictedDelta)}`}
              </span>{' '}
              patients next week.
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {selectedDoctor === 'all'
                ? `All doctors average: ${avgCurrentWeek.toFixed(1)} appointments/day`
                : `${selectedDoctorName} average: ${avgCurrentWeek.toFixed(1)} appointments/day`
              }
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Risk Assessment
            </div>
            <p className="text-sm text-slate-600 mt-2">
              {deltaPct != null && deltaPct >= 20
                ? `High risk alert: Expected ${Math.round(nextWeekPredicted)} appointments vs ${totalCurrentWeek} this week.`
                : `Stable demand expected: ${Math.round(nextWeekPredicted)} appointments predicted for next week.`}
            </p>
            <p className="text-xs text-slate-500 mt-2">{deltaPct == null ? '—' : `Change: ${formatPct(deltaPct)}`}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
