import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Download,
  FileText,
  Loader2,
  Search,
  Stethoscope,
  Building2,
} from 'lucide-react';
import api from '../api/client';
import { fetchMyAppointments, checkSlotAvailability } from '../api/appointmentsApi';
import { formatYMD, monthKeyFromDate, nowColombo } from '../utils/dateHelpers';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ALL_DOCTORS_OPTION = '__all_doctors__';

function mapDoctorRooms(raw) {
  return (raw || []).map((d) => ({
    _id: d._id,
    doctorName: d.doctorName || d.fullName || 'Doctor',
    speciality: d.specialization || d.speciality || 'General Ophthalmology',
    room: d.room || '—',
    availability: Array.isArray(d.availability) ? d.availability : [],
  }));
}

function doctorWorksOnDay(doctor, dayName) {
  if (!dayName) return true;
  const a = doctor.availability;
  if (!a.length) return true;
  return a.includes(dayName);
}

function getAppointmentRowStatus(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'completed' || s === 'checked_in') {
    return { label: 'Completed', completed: true };
  }
  if (s === 'booked') {
    return { label: 'Booked', completed: false };
  }
  return null;
}

export default function ReportsPage() {
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);
  const [doctorsError, setDoctorsError] = useState('');

  const [slotByDoctorId, setSlotByDoctorId] = useState({});
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [nameSearch, setNameSearch] = useState('');
  const [specialityFilter, setSpecialityFilter] = useState('');
  const [dayFilter, setDayFilter] = useState('');

  const [apptMonth, setApptMonth] = useState(() => monthKeyFromDate(nowColombo()));
  const [apptDoctorId, setApptDoctorId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState('');

  const [pdfAllLoading, setPdfAllLoading] = useState(false);
  const [pdfApptLoading, setPdfApptLoading] = useState(false);

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    setDoctorsError('');
    try {
      const { data } = await api.get('/api/doctor-rooms');
      setDoctors(mapDoctorRooms(data));
    } catch {
      setDoctorsError('Could not load doctors. Please try again later.');
      setDoctors([]);
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const todayYmd = useMemo(() => formatYMD(nowColombo()), []);

  useEffect(() => {
    if (!doctors.length) {
      setSlotByDoctorId({});
      return;
    }
    let cancelled = false;
    (async () => {
      setSlotsLoading(true);
      const next = {};
      await Promise.all(
        doctors.map(async (d) => {
          try {
            const res = await checkSlotAvailability(d._id, todayYmd);
            if (res?.success) {
              next[d._id] =
                typeof res.remainingSlots === 'number' ? res.remainingSlots : 0;
            } else {
              next[d._id] = null;
            }
          } catch {
            next[d._id] = null;
          }
        })
      );
      if (!cancelled) {
        setSlotByDoctorId(next);
        setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [doctors, todayYmd]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setApptLoading(true);
      setApptError('');
      try {
        const data = await fetchMyAppointments();
        if (!mounted) return;
        setAppointments(data.appointments || []);
      } catch {
        if (!mounted) return;
        setApptError('Could not load your appointments.');
        setAppointments([]);
      } finally {
        if (mounted) setApptLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const specialities = useMemo(() => {
    const set = new Set();
    doctors.forEach((d) => {
      if (d.speciality) set.add(d.speciality);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    const q = nameSearch.trim().toLowerCase();
    return doctors.filter((d) => {
      if (q && !d.doctorName.toLowerCase().includes(q)) return false;
      if (specialityFilter && d.speciality !== specialityFilter) return false;
      if (dayFilter && !doctorWorksOnDay(d, dayFilter)) return false;
      return true;
    });
  }, [doctors, nameSearch, specialityFilter, dayFilter]);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d._id === apptDoctorId) || null,
    [doctors, apptDoctorId]
  );
  const isAllDoctorsSelected = apptDoctorId === ALL_DOCTORS_OPTION;

  const filteredAppointments = useMemo(() => {
    if (!apptDoctorId) return [];
    return appointments.filter((a) => {
      const docId = a.doctorId?._id || a.doctorId;
      if (!isAllDoctorsSelected && String(docId) !== String(apptDoctorId)) return false;
      const key = formatYMD(a.appointmentDate).slice(0, 7);
      if (key !== apptMonth) return false;
      const st = String(a.status || '').toLowerCase();
      if (st === 'cancelled') return false;
      return getAppointmentRowStatus(a.status) != null;
    });
  }, [appointments, apptDoctorId, apptMonth, isAllDoctorsSelected]);

  const { completedTotal, bookedTotal } = useMemo(() => {
    let c = 0;
    let b = 0;
    filteredAppointments.forEach((a) => {
      const row = getAppointmentRowStatus(a.status);
      if (row?.completed) c += 1;
      else if (row && !row.completed) b += 1;
    });
    return { completedTotal: c, bookedTotal: b };
  }, [filteredAppointments]);

  const monthLabel = useMemo(() => {
    const [y, m] = apptMonth.split('-').map(Number);
    if (!y || !m) return apptMonth;
    return new Date(y, m - 1, 1).toLocaleString('en-LK', {
      month: 'long',
      year: 'numeric',
    });
  }, [apptMonth]);

  const handleAllDoctorsPdf = async () => {
    if (!doctors.length) return;
    setPdfAllLoading(true);
    try {
      const { downloadDoctorsTablePdf } = await import('../utils/reportPdf');
      const filterNote = 'Complete doctor directory — all doctors in the system';

      const rows = doctors.map((d) => ({
        doctorName: d.doctorName,
        speciality: d.speciality,
        availableDays: d.availability.length ? d.availability.join(', ') : '—',
        room: d.room,
        slots: slotByDoctorId[d._id] != null ? slotByDoctorId[d._id] : '—',
      }));
      await downloadDoctorsTablePdf({ rows, filterNote });
    } finally {
      setPdfAllLoading(false);
    }
  };

  const handleAppointmentPdf = async () => {
    if (!apptDoctorId || (!selectedDoctor && !isAllDoctorsSelected)) return;
    setPdfApptLoading(true);
    try {
      const { downloadAppointmentMonthPdf } = await import('../utils/reportPdf');
      const rows = filteredAppointments.map((a) => {
        const row = getAppointmentRowStatus(a.status);
        return {
          dateStr: new Date(a.appointmentDate).toLocaleDateString('en-LK', {
            timeZone: 'Asia/Colombo',
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          statusLabel: row?.label || '—',
          room: a.doctorId?.room || selectedDoctor.room || '—',
        };
      });
      await downloadAppointmentMonthPdf({
        monthLabel,
        doctorName: isAllDoctorsSelected ? 'All Doctors' : selectedDoctor?.doctorName,
        speciality: isAllDoctorsSelected ? 'Multiple' : selectedDoctor?.speciality,
        room: isAllDoctorsSelected ? 'Multiple' : selectedDoctor?.room,
        rows,
        completedCount: completedTotal,
        bookedCount: bookedTotal,
      });
    } finally {
      setPdfApptLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm focus:border-[#2A9DF4] focus:outline-none focus:ring-2 focus:ring-[#2A9DF4]/25 transition';
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-10 pb-16">
      <div className="rounded-2xl bg-gradient-to-br from-[#2A9DF4] to-[#0F4C81] p-6 sm:p-8 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-inner">
            <FileText className="text-white" size={28} strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
            <p className="mt-1 text-white/90 text-sm sm:text-base max-w-2xl">
              Doctor directory and your appointment history by month. Export clean PDFs for your records.
            </p>
          </div>
        </div>
      </div>

      {/* —— Doctor details —— */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(15,76,129,0.06)] overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#0F4C81]/10 text-[#0F4C81]">
              <Stethoscope size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#0F4C81]">Doctor details report</h2>
              <p className="text-xs text-slate-500">
                Search and filter the table below; the PDF always includes every doctor in one report
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAllDoctorsPdf}
            disabled={pdfAllLoading || doctors.length === 0}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-[#0F4C81]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#0F4C81] shadow-sm hover:bg-[#F0F9FF] hover:border-[#2A9DF4] hover:shadow transition disabled:opacity-50 disabled:pointer-events-none"
          >
            {pdfAllLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download doctor details report (PDF)
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass} htmlFor="doc-search">
                Search by doctor name
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={18}
                />
                <input
                  id="doc-search"
                  type="search"
                  placeholder="Type a name…"
                  value={nameSearch}
                  onChange={(e) => setNameSearch(e.target.value)}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="doc-spec">
                Speciality
              </label>
              <select
                id="doc-spec"
                value={specialityFilter}
                onChange={(e) => setSpecialityFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">All specialities</option>
                {specialities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="doc-day">
                Available day
              </label>
              <select
                id="doc-day"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">Any day</option>
                {WEEKDAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {doctorsError && (
            <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">
              {doctorsError}
            </div>
          )}

          {doctorsLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="animate-spin text-[#2A9DF4]" size={36} />
              <p className="text-sm font-medium">Loading doctors…</p>
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Stethoscope className="mx-auto mb-3 text-slate-300" size={48} />
              <p className="font-medium text-slate-700">No doctors match your filters</p>
              <p className="text-sm mt-1">Try clearing search or filters.</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Speciality</th>
                      <th className="px-4 py-3 font-semibold">Available days</th>
                      <th className="px-4 py-3 font-semibold">Room</th>
                      <th className="px-4 py-3 font-semibold">Slots left today</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredDoctors.map((d) => (
                      <tr
                        key={d._id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-[#0F4C81]">{d.doctorName}</td>
                        <td className="px-4 py-3 text-slate-700">{d.speciality}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {d.availability.length ? d.availability.join(', ') : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-slate-700">
                            <Building2 size={14} className="text-slate-400" />
                            {d.room}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums text-slate-800">
                          {slotsLoading ? (
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Loader2 size={14} className="animate-spin" />
                            </span>
                          ) : slotByDoctorId[d._id] != null ? (
                            slotByDoctorId[d._id]
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4">
                {filteredDoctors.map((d) => (
                  <div
                    key={d._id}
                    className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-bold text-[#0F4C81]">{d.doctorName}</p>
                        <p className="text-sm text-slate-600 mt-0.5">{d.speciality}</p>
                      </div>
                      <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                        Room {d.room}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">Available days</p>
                    <p className="text-sm text-slate-700 mb-3">
                      {d.availability.length ? d.availability.join(', ') : '—'}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="text-slate-400">Slots today: </span>
                      {slotsLoading ? (
                        <Loader2 size={14} className="inline animate-spin text-slate-400" />
                      ) : slotByDoctorId[d._id] != null ? (
                        <span className="font-semibold tabular-nums">{slotByDoctorId[d._id]}</span>
                      ) : (
                        '—'
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* —— Appointments month-wise —— */}
      <section className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_4px_24px_rgba(15,76,129,0.06)] overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-4 flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-700">
            <Calendar size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#0F4C81]">Appointment report (month-wise)</h2>
            <p className="text-xs text-slate-500">Your bookings for the selected doctor (or all doctors) by month</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} htmlFor="appt-month">
                Month
              </label>
              <input
                id="appt-month"
                type="month"
                value={apptMonth}
                onChange={(e) => setApptMonth(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="appt-doc">
                Doctor
              </label>
              <select
                id="appt-doc"
                value={apptDoctorId}
                onChange={(e) => setApptDoctorId(e.target.value)}
                className={inputClass}
              >
                <option value="">Select a doctor</option>
                <option value={ALL_DOCTORS_OPTION}>All Doctors</option>
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.doctorName} — {d.speciality}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {apptError && (
            <div className="rounded-lg bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">
              {apptError}
            </div>
          )}

          {(selectedDoctor || isAllDoctorsSelected) && (
            <div className="flex flex-wrap gap-4 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] px-4 py-3 text-sm">
              <div>
                <span className="text-slate-500">Doctor: </span>
                <span className="font-semibold text-[#0F4C81]">
                  {isAllDoctorsSelected ? 'All Doctors' : selectedDoctor?.doctorName}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Speciality: </span>
                <span className="font-medium text-slate-800">
                  {isAllDoctorsSelected ? 'Multiple' : selectedDoctor?.speciality}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Room: </span>
                <span className="font-medium text-slate-800">
                  {isAllDoctorsSelected ? 'Multiple' : selectedDoctor?.room}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 items-center">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 shadow-sm">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Completed
              </p>
              <p className="text-2xl font-bold text-emerald-700 tabular-nums">{completedTotal}</p>
            </div>
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 shadow-sm">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                Booked (not checked-in)
              </p>
              <p className="text-2xl font-bold text-red-700 tabular-nums">{bookedTotal}</p>
            </div>
            <button
              type="button"
              onClick={handleAppointmentPdf}
              disabled={pdfApptLoading || !apptDoctorId}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-900 hover:shadow-lg transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {pdfApptLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Generate PDF report
            </button>
          </div>

          {apptLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
              <Loader2 className="animate-spin text-[#2A9DF4]" size={36} />
              <p className="text-sm font-medium">Loading appointments…</p>
            </div>
          ) : !apptDoctorId ? (
            <div className="text-center py-14 text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <Calendar className="mx-auto mb-3 text-slate-300" size={44} />
              <p className="font-medium text-slate-700">Select a doctor to view appointments</p>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-14 text-slate-500 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
              <FileText className="mx-auto mb-3 text-slate-300" size={44} />
              <p className="font-medium text-slate-700">No appointments for this month</p>
              <p className="text-sm mt-1">Try another month or doctor.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide text-left">
                      <th className="px-4 py-3 font-semibold">Doctor</th>
                      <th className="px-4 py-3 font-semibold">Speciality</th>
                      <th className="px-4 py-3 font-semibold">Room</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((a) => {
                      const row = getAppointmentRowStatus(a.status);
                      const green = row?.completed;
                      return (
                        <tr key={a._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-medium text-[#0F4C81]">
                            {a.doctorId?.doctorName || selectedDoctor?.doctorName}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {a.doctorId?.specialization || a.doctorId?.speciality || selectedDoctor?.speciality}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {a.doctorId?.room || selectedDoctor?.room}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {new Date(a.appointmentDate).toLocaleDateString('en-LK', {
                              timeZone: 'Asia/Colombo',
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                green
                                  ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200'
                                  : 'bg-red-100 text-red-800 ring-1 ring-red-200'
                              }`}
                            >
                              {row?.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredAppointments.map((a) => {
                  const row = getAppointmentRowStatus(a.status);
                  const green = row?.completed;
                  return (
                    <div
                      key={a._id}
                      className={`rounded-xl border p-4 shadow-sm ${
                        green ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-semibold text-[#0F4C81]">
                          {a.doctorId?.doctorName || selectedDoctor?.doctorName}
                        </p>
                        <span
                          className={`shrink-0 text-xs font-bold px-2 py-1 rounded-full ${
                            green ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                          }`}
                        >
                          {row?.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">
                        {a.doctorId?.specialization || a.doctorId?.speciality} · Room{' '}
                        {a.doctorId?.room || selectedDoctor?.room}
                      </p>
                      <p className="text-sm text-slate-700 mt-2 flex items-center gap-2">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(a.appointmentDate).toLocaleDateString('en-LK', {
                          timeZone: 'Asia/Colombo',
                          weekday: 'long',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
