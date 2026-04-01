import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cancelAppointment, fetchMyAppointments } from '../api/appointmentsApi';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import HoursStrip from '../components/HoursStrip';
import NoticeBar from '../components/NoticeBar';
import { bookingStrings } from '../i18n/bookingStrings';
import { useAuth } from '../hooks/useAuth';

const REASON_LABELS = {
  new_consultation: 'New consultation',
  follow_up: 'Follow-up',
  post_surgery_review: 'Post-surgery review',
  prescription_renewal: 'Prescription renewal',
};

export default function MyAppointmentsPage() {
  const { patient } = useAuth();
  const strings = bookingStrings.en;
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  const filter = useMemo(() => {
    const sp = new URLSearchParams(location.search || '');
    const f = (sp.get('filter') || 'all').toLowerCase();
    if (f === 'upcoming' || f === 'completed' || f === 'all') return f;
    return 'all';
  }, [location.search]);

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
    if (!selectedId || !filtered.some((a) => String(a._id) === String(selectedId))) {
      setSelectedId(String(filtered[0]._id));
    }
  }, [filtered, selectedId]);

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

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <TopBar lang="en" onLangChange={() => {}} strings={strings} />
      <Navbar strings={strings} patient={patient} />
      <HoursStrip strings={strings} />
      <NoticeBar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link to="/appointments/book" className="text-blue-600 font-semibold text-sm hover:underline">
          ← Back to booking
        </Link>
        <h1 className="mt-4 font-['Playfair_Display'] text-3xl text-[#1E3A8A]">
          My appointments{filter !== 'all' ? ` (${filter})` : ''}
        </h1>
        {loading ? (
          <p className="mt-4 text-slate-600">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-slate-600">No appointments yet.</p>
        ) : (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-6 items-start">
            <div className="rounded-2xl bg-white border border-blue-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <p className="text-sm font-extrabold text-slate-900">Appointments</p>
                <p className="text-xs text-slate-600 mt-1">Click an item to view details</p>
              </div>
              <ul className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const active = String(a._id) === String(selectedId);
                  const doctorName = a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor';
                  const dept = a.doctorId?.specialization || a.doctorId?.speciality || '';
                  return (
                    <li key={a._id}>
                      <button
                        type="button"
                        onClick={() => {
                          setActionError('');
                          setSelectedId(String(a._id));
                        }}
                        className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition ${
                          active ? 'bg-blue-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{doctorName}</p>
                            <p className="text-xs text-slate-600 mt-0.5 truncate">
                              {new Date(a.appointmentDate).toLocaleDateString()} {dept ? `· ${dept}` : ''}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Ref: <span className="font-semibold">{a.bookingRef || '—'}</span>
                            </p>
                          </div>
                          <span className="shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border bg-white text-slate-700">
                            {(a.status || '').replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-6">
              {!selected ? (
                <p className="text-slate-600">Select an appointment to view details.</p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Appointment</p>
                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        {selected.doctorId?.doctorName || selected.doctorId?.fullName || 'Doctor'}
                      </h2>
                      <p className="text-sm text-slate-600 mt-1">
                        {(selected.doctorId?.specialization || selected.doctorId?.speciality || 'General')} · Room{' '}
                        {selected.doctorId?.room || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1.5 rounded-full text-xs font-extrabold border bg-slate-50 text-slate-800">
                        {(selected.status || '').replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Booking ref</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">{selected.bookingRef || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {selectedDate ? selectedDate.toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reason</p>
                      <p className="mt-1 text-lg font-extrabold text-slate-900">
                        {REASON_LABELS[selected.visitReason] || (selected.visitReason || '—').replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900 whitespace-pre-wrap">
                        {selected.notes?.trim() ? selected.notes : '—'}
                      </p>
                    </div>
                  </div>

                  {actionError && (
                    <div className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm px-4 py-3">
                      {actionError}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/queue"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md"
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
                      className="px-5 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-800 font-semibold disabled:opacity-50"
                    >
                      Cancel appointment
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
