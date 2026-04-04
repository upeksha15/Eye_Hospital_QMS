import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Hash,
  MessageSquare,
  Stethoscope,
} from 'lucide-react';
import { cancelAppointment, fetchMyAppointments } from '../api/appointmentsApi';

const REASON_LABELS = {
  new_consultation: 'New consultation',
  follow_up: 'Follow-up',
  post_surgery_review: 'Post-surgery review',
  prescription_renewal: 'Prescription renewal',
};

function formatDoctorName(name) {
  if (!name || typeof name !== 'string') return 'Doctor';
  const t = name.trim();
  if (!t) return 'Doctor';
  return t
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function formatStatusLabel(status) {
  return String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'booked') return 'bg-blue-50 text-blue-800 ring-1 ring-blue-200/90';
  if (s === 'checked_in') return 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/90';
  if (s === 'completed') return 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/90';
  if (s === 'cancelled') return 'bg-red-50 text-red-800 ring-1 ring-red-200/90';
  if (s === 'absent') return 'bg-amber-50 text-amber-900 ring-1 ring-amber-200/90';
  return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/90';
}

function DetailTile({ icon: Icon, label, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/80 p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
        {Icon && <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} />}
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900 leading-snug">{children}</div>
    </div>
  );
}

export default function MyAppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const filter = useMemo(() => {
    const f = (searchParams.get('filter') || 'all').toLowerCase();
    if (f === 'upcoming' || f === 'completed' || f === 'all') return f;
    return 'all';
  }, [searchParams]);

  const urlAppointmentId = searchParams.get('id') || '';

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyAppointments();
        setItems(data.appointments || []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (filter === 'completed') {
      return items.filter((a) => String(a.status || '').toLowerCase() === 'completed');
    }
    if (filter === 'upcoming') {
      return items.filter((a) => new Date(a.appointmentDate) >= startOfToday && String(a.status || '').toLowerCase() !== 'cancelled');
    }
    return items;
  }, [items, filter]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId('');
      return;
    }
    if (
      urlAppointmentId &&
      filtered.some((a) => String(a._id) === String(urlAppointmentId))
    ) {
      setSelectedId(String(urlAppointmentId));
      return;
    }
    setSelectedId((prev) => {
      if (prev && filtered.some((a) => String(a._id) === String(prev))) return prev;
      return String(filtered[0]._id);
    });
  }, [filtered, urlAppointmentId]);

  const selected = useMemo(
    () => filtered.find((a) => String(a._id) === String(selectedId)) || null,
    [filtered, selectedId]
  );

  const selectedDate = selected?.appointmentDate ? new Date(selected.appointmentDate) : null;
  const canCancel = useMemo(() => {
    if (!selectedDate) return false;
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return (
      String(selected?.status || '').toLowerCase() === 'booked' &&
      selectedDate.getTime() >= startOfToday.getTime()
    );
  }, [selected?.status, selectedDate]);

  const filterLabel =
    filter === 'upcoming' ? 'Upcoming' : filter === 'completed' ? 'Completed' : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#EEF6FF] via-[#F4F8FF] to-[#EBF4FF] font-['Nunito'] text-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <Link
          to="/appointments/book"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Back to booking
        </Link>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Patient</p>
            <h1 className="mt-1 font-['Playfair_Display'] text-3xl sm:text-4xl font-bold text-[#1E3A8A] tracking-tight">
              My appointments
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">
              {filterLabel
                ? `Showing ${filterLabel.toLowerCase()} visits. Select a row to see full details.`
                : 'Review your bookings and open the full details for any visit.'}
            </p>
          </div>
          {filterLabel && (
            <span className="inline-flex items-center self-start rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200/80">
              Filter: {filterLabel}
            </span>
          )}
        </div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-6 lg:gap-8">
            <div className="h-72 rounded-3xl bg-white/80 shadow-sm ring-1 ring-slate-200/80 animate-pulse" />
            <div className="h-96 rounded-3xl bg-white/80 shadow-sm ring-1 ring-slate-200/80 animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300/80 bg-white/70 px-8 py-16 text-center shadow-sm">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-800">No appointments to show</p>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
              {filterLabel
                ? `Nothing matches “${filterLabel}” right now. Try another filter or book a new visit.`
                : 'You have not booked any visits yet.'}
            </p>
            <Link
              to="/appointments/book"
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:opacity-95 transition-opacity"
            >
              Book an appointment
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-6 lg:gap-8 items-start">
            {/* List */}
            <aside className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(37,99,235,0.08)] ring-1 ring-slate-200/80 overflow-hidden">
              <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-white px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">Your appointments</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {filtered.length} {filtered.length === 1 ? 'visit' : 'visits'} · tap for details
                  </p>
                </div>
              </div>
              <ul className="max-h-[min(70vh,32rem)] overflow-y-auto divide-y divide-slate-100">
                {filtered.map((a) => {
                  const active = String(a._id) === String(selectedId);
                  const rawName = a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor';
                  const doctorName = formatDoctorName(rawName);
                  const dept = a.doctorId?.specialization || a.doctorId?.speciality || '';
                  const initials = doctorName
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase() || 'DR';
                  return (
                    <li key={a._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError('');
                          const id = String(a._id);
                          setSelectedId(id);
                          setSearchParams(
                            (prev) => {
                              const next = new URLSearchParams(prev);
                              next.set('id', id);
                              if (filter !== 'all') next.set('filter', filter);
                              else next.delete('filter');
                              return next;
                            },
                            { replace: true }
                          );
                        }}
                        className={`relative w-full text-left px-4 sm:px-5 py-4 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-inset ${
                          active
                            ? 'bg-gradient-to-r from-blue-50/95 to-indigo-50/50'
                            : 'bg-white hover:bg-slate-50/90'
                        }`}
                      >
                        {active && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r bg-gradient-to-b from-blue-600 to-indigo-600" />
                        )}
                        <div className="flex items-start gap-3 pl-1">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold text-white shadow-sm">
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1 pr-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-bold text-slate-900 truncate">{doctorName}</p>
                              <span
                                className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadgeClass(
                                  a.status
                                )}`}
                              >
                                {formatStatusLabel(a.status)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">
                              {new Date(a.appointmentDate).toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                              {dept ? ` · ${dept}` : ''}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1.5 font-mono tabular-nums">
                              {a.bookingRef || '—'}
                            </p>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Detail */}
            <section className="rounded-3xl bg-white shadow-[0_4px_24px_rgba(37,99,235,0.08)] ring-1 ring-slate-200/80 overflow-hidden">
              {!selected ? (
                <div className="p-10 text-center text-slate-600 text-sm">
                  Select an appointment from the list to view full details.
                </div>
              ) : (
                <>
                  <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-6 sm:px-8 py-8">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                          Consultation
                        </p>
                        <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                          {formatDoctorName(
                            selected.doctorId?.doctorName || selected.doctorId?.fullName || 'Doctor'
                          )}
                        </h2>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1.5">
                            <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
                            {selected.doctorId?.specialization ||
                              selected.doctorId?.speciality ||
                              'General Ophthalmology'}
                          </span>
                          <span className="text-slate-300 hidden sm:inline">|</span>
                          <span>
                            Room <span className="font-semibold text-slate-800">{selected.doctorId?.room || '—'}</span>
                          </span>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center self-start rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${statusBadgeClass(
                          selected.status
                        )}`}
                      >
                        {formatStatusLabel(selected.status)}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 sm:px-8 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <DetailTile icon={Hash} label="Booking reference">
                        {selected.bookingRef || '—'}
                      </DetailTile>
                      <DetailTile icon={CalendarDays} label="Appointment date">
                        {selectedDate
                          ? selectedDate.toLocaleDateString(undefined, {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </DetailTile>
                      <DetailTile icon={ClipboardList} label="Reason for visit">
                        {REASON_LABELS[selected.visitReason] ||
                          (selected.visitReason || '—').replace(/_/g, ' ')}
                      </DetailTile>
                      <DetailTile icon={MessageSquare} label="Notes" className="sm:col-span-2">
                        <span className="font-normal text-slate-700 whitespace-pre-wrap">
                          {selected.notes?.trim() ? selected.notes : 'No notes added.'}
                        </span>
                      </DetailTile>
                    </div>

                    {actionError && (
                      <div className="mt-6 rounded-2xl bg-red-50 border border-red-100 text-red-800 text-sm px-4 py-3">{actionError}</div>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                      <Link
                        to="/queue"
                        className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:opacity-[0.98] transition-all"
                      >
                        View queue status
                      </Link>
                      <button
                        type="button"
                        disabled={!canCancel || actionBusy}
                        onClick={async () => {
                          if (!selected?._id) return;
                          if (!window.confirm('Cancel this appointment?')) return;
                          setActionBusy(true);
                          setActionError('');
                          try {
                            await cancelAppointment(selected._id);
                            const data = await fetchMyAppointments();
                            setItems(data.appointments || []);
                          } catch (e) {
                            setActionError(e?.response?.data?.message || e?.message || 'Cancel failed');
                          } finally {
                            setActionBusy(false);
                          }
                        }}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                      >
                        {actionBusy ? 'Cancelling…' : 'Cancel appointment'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
