import React, { useCallback, useEffect, useState } from 'react';
import { FileDown, RefreshCw, CalendarClock, TrendingUp, Users } from 'lucide-react';
import PatientDetailsCalendar from './PatientDetailsCalendar';
import { colomboWeekRangeLabel, colomboYmdFromDate } from '../utils/colomboDate';

const logoSrc = `${process.env.PUBLIC_URL || ''}/eye-hospital-logo.svg`;

function fmtDay(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

async function savePdfBlob(blob, filename) {
  if (blob.type && blob.type !== 'application/pdf') {
    try {
      const text = await blob.text();
      const json = JSON.parse(text);
      throw new Error(json.message || 'PDF generation failed');
    } catch (e) {
      if (e.message && e.message !== 'PDF generation failed') throw e;
      throw new Error('PDF generation failed');
    }
  }
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1500);
}

const btnGhost = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-40';
const btnTeal = 'rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-teal-900/10 transition hover:bg-teal-700 disabled:opacity-40';
const btnNavy = 'rounded-xl bg-[#001f3f] px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-[#001f3f]/20 transition hover:bg-[#002a52] disabled:opacity-40';

/**
 * @param {{ api: object, variant?: 'staff' | 'admin' }} props
 */
export default function PatientDetailsSummaryPanel({ api, variant = 'admin' }) {
  const [referenceDate, setReferenceDate] = useState(() => colomboYmdFromDate(new Date()));
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [weekPdfLoading, setWeekPdfLoading] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const d = await api.getPatientDetailsSummaryReport({ referenceDate });
      setSummary(d.summary);
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [api, referenceDate]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadPdf = async () => {
    setErr('');
    try {
      const blob = await api.downloadPatientDetailsSummaryPdf({ referenceDate });
      await savePdfBlob(blob, `patient-monthly-report-${referenceDate}.pdf`);
    } catch (e) {
      setErr(e.message || 'PDF download failed');
    }
  };

  const downloadWeekPdf = async (week) => {
    setWeekPdfLoading(week.start);
    setErr('');
    try {
      const blob = await api.downloadPatientDetailsSummaryPdf({
        referenceDate,
        weekStart: week.start,
      });
      const safe = week.label.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_');
      await savePdfBlob(blob, `patient-week-${safe}.pdf`);
    } catch (e) {
      setErr(e.message || 'PDF download failed');
    } finally {
      setWeekPdfLoading(null);
    }
  };

  const pred = summary?.prediction;
  const isStaff = variant === 'staff';

  return (
    <div className="space-y-8">
      {!isStaff && (
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <img src={logoSrc} alt="National Eye Hospital" className="h-11 w-auto" width={280} height={49} />
          {loading && !summary && (
            <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
              Loading…
            </span>
          )}
        </div>
      )}

      {isStaff && loading && !summary && (
        <div className="flex justify-end">
          <span className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm">
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-teal-600" />
            Loading…
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <PatientDetailsCalendar
            referenceDate={referenceDate}
            disabled={loading}
            onSelectDate={(ymd) => setReferenceDate(ymd)}
          />
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Reference</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                type="date"
                className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
              />
              <button type="button" onClick={() => setReferenceDate(colomboYmdFromDate(new Date()))} disabled={loading} className={btnGhost}>
                Today
              </button>
              <button type="button" onClick={load} disabled={loading} className={btnTeal}>
                <RefreshCw className={`mr-2 inline h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading…' : 'Refresh'}
              </button>
              <button type="button" onClick={downloadPdf} disabled={loading} className={btnNavy}>
                <FileDown className="mr-2 inline h-4 w-4" />
                Full PDF
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600">{colomboWeekRangeLabel(referenceDate)}</p>
          </div>
        </div>
      </div>

      {err && (
        <div
          role="alert"
          className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900 shadow-sm"
        >
          {err}
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">This week</span>
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <Users className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-4 font-['Playfair_Display'] text-4xl font-bold tabular-nums text-[#001f3f]">{summary.thisWeek.uniquePatientCount}</p>
              <p className="mt-1 text-xs text-slate-500">Unique patients</p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold tabular-nums text-slate-900">{summary.thisWeek.appointmentCount}</span> appointments
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.02] transition hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Previous week</span>
                <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
                  <CalendarClock className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-4 font-['Playfair_Display'] text-4xl font-bold tabular-nums text-slate-800">{summary.previousWeek.uniquePatientCount}</p>
              <p className="mt-1 text-xs text-slate-500">Unique patients</p>
              <p className="mt-3 text-sm text-slate-600">
                <span className="font-semibold tabular-nums text-slate-900">{summary.previousWeek.appointmentCount}</span> appointments
              </p>
            </div>

            <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50 via-emerald-50/80 to-teal-50/90 p-5 shadow-md shadow-teal-900/5 ring-1 ring-teal-900/[0.04]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-700/90">Next week</span>
                <div className="rounded-lg bg-white/70 p-2 text-teal-700 shadow-sm">
                  <TrendingUp className="h-4 w-4" strokeWidth={2} />
                </div>
              </div>
              <p className="mt-4 font-['Playfair_Display'] text-4xl font-bold tabular-nums text-teal-900">{pred?.predictedNextWeekPatientCount}</p>
              <p className="mt-1 text-xs text-teal-800/80">Forecast · unique patients</p>
              <p className="mt-2 truncate text-xs text-teal-800/70" title={pred?.targetLabel}>
                {pred?.targetLabel}
              </p>
            </div>
          </div>

          {Array.isArray(summary.weekByWeek) && summary.weekByWeek.length > 0 && (
            <div className="space-y-4">
              <h2 className="font-['Playfair_Display'] text-lg font-semibold text-[#001f3f] sm:text-xl">By week</h2>
              {summary.weekByWeek.map((week) => (
                <div
                  key={week.start}
                  className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.02] transition hover:shadow-md"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 py-3.5 sm:px-5">
                    <div>
                      <p className="font-medium text-slate-900">{week.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {week.uniquePatientCount} patients · {week.appointmentCount} appointments
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadWeekPdf(week)}
                      disabled={loading || weekPdfLoading === week.start}
                      className="rounded-xl bg-[#001f3f] px-3 py-2 text-xs font-medium text-white shadow-md shadow-[#001f3f]/20 transition hover:bg-[#002a52] disabled:opacity-40"
                    >
                      <FileDown className="mr-1.5 inline h-3.5 w-3.5" />
                      {weekPdfLoading === week.start ? '…' : 'Week PDF'}
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-[#001f3f] text-left text-[11px] font-semibold uppercase tracking-wide text-white">
                          <th className="px-4 py-3">Patient</th>
                          <th className="px-4 py-3">NIC</th>
                          <th className="px-4 py-3">Contact</th>
                          <th className="px-4 py-3 text-right tabular-nums">Appts</th>
                          <th className="px-4 py-3">Last visit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!week.patients || week.patients.length === 0) && (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                              No data
                            </td>
                          </tr>
                        )}
                        {week.patients?.map((p) => (
                          <tr key={p.patientId} className="transition hover:bg-slate-50/90">
                            <td className="px-4 py-2.5 font-medium text-slate-900">{p.fullName}</td>
                            <td className="px-4 py-2.5 tabular-nums text-slate-600">{p.nic}</td>
                            <td className="px-4 py-2.5 tabular-nums text-slate-600">{p.contactNumber}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-900">{p.appointmentCount}</td>
                            <td className="px-4 py-2.5 text-slate-600">{fmtDay(p.lastAppointmentDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
