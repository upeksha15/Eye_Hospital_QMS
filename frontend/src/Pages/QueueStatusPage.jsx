import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import HoursStrip from '../components/HoursStrip';
import NoticeBar from '../components/NoticeBar';
import { bookingStrings } from '../i18n/bookingStrings';
import { useAuth } from '../hooks/useAuth';
import { fetchMyAppointments, checkIn as checkInApi } from '../api/appointmentsApi';
import { fetchQueueBoardToday, fetchMyQueueStatusToday } from '../api/queueApi';
import { useSocket } from '../hooks/useSocket';
import { formatYMD, nowColombo } from '../utils/dateHelpers';

export default function QueueStatusPage() {
  const { patient } = useAuth();
  const strings = bookingStrings.en;

  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [selectedApptId, setSelectedApptId] = useState('');
  const [board, setBoard] = useState(null);
  const [myStatus, setMyStatus] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [actionError, setActionError] = useState('');

  const todayYmd = useMemo(() => formatYMD(nowColombo()), []);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchMyAppointments();
        const items = data.appointments || [];
        setAppointments(items);
        const todayItems = items.filter((a) => formatYMD(a.appointmentDate) === todayYmd);
        setSelectedApptId(todayItems[0]?._id || '');
      } catch {
        setAppointments([]);
      } finally {
        setLoadingAppts(false);
      }
    })();
  }, [todayYmd]);

  const selectedAppt = useMemo(
    () => appointments.find((a) => String(a._id) === String(selectedApptId)) || null,
    [appointments, selectedApptId]
  );

  const doctorId = selectedAppt?.doctorId?._id || selectedAppt?.doctorId || '';

  const loadQueue = useCallback(async () => {
    if (!doctorId) {
      setBoard(null);
      setMyStatus(null);
      return;
    }
    setLoadingQueue(true);
    setActionError('');
    try {
      const [b, m] = await Promise.all([
        fetchQueueBoardToday(doctorId),
        fetchMyQueueStatusToday(doctorId),
      ]);
      setBoard(b);
      setMyStatus(m);
    } catch (e) {
      setBoard(null);
      setMyStatus(null);
      setActionError(e?.response?.data?.message || e?.message || 'Failed to load queue');
    } finally {
      setLoadingQueue(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useSocket(doctorId, loadQueue, null);

  const canCheckIn =
    Boolean(selectedAppt) &&
    formatYMD(selectedAppt.appointmentDate) === todayYmd &&
    String(selectedAppt.status || '').toLowerCase() === 'booked' &&
    Boolean(myStatus?.checkinOpen);

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <TopBar lang="en" onLangChange={() => {}} strings={strings} />
      <Navbar strings={strings} patient={patient} />
      <HoursStrip strings={strings} />
      <NoticeBar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-start justify-between gap-6 flex-col md:flex-row">
          <div>
            <h1 className="font-['Playfair_Display'] text-3xl text-[#1E3A8A]">Queue status</h1>
            <p className="mt-2 text-slate-600 text-sm">
              Select your appointment for today and check in when the medical staff enables the queue.
            </p>
          </div>
          <Link
            to="/appointments/book"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md"
          >
            Book appointment
          </Link>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-blue-100 shadow-sm p-5">
          {loadingAppts ? (
            <p className="text-slate-600">Loading your appointments…</p>
          ) : (
            <>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Today’s appointment</label>
              <select
                value={selectedApptId}
                onChange={(e) => setSelectedApptId(e.target.value)}
                className="w-full max-w-xl border border-slate-300 rounded-xl px-3 py-2 bg-white"
              >
                <option value="">Select…</option>
                {appointments
                  .filter((a) => formatYMD(a.appointmentDate) === todayYmd)
                  .map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor'} · {formatYMD(a.appointmentDate)} · {a.bookingRef}
                    </option>
                  ))}
              </select>

              {!selectedApptId && (
                <p className="mt-3 text-sm text-slate-600">
                  No appointment selected for today. If you don’t have one, please book an appointment first.
                </p>
              )}
            </>
          )}
        </div>

        {selectedApptId && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
            <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-slate-900">My status</h2>
              {loadingQueue ? (
                <p className="mt-3 text-slate-600">Loading queue…</p>
              ) : actionError ? (
                <p className="mt-3 text-sm text-red-600">{actionError}</p>
              ) : (
                <>
                  {String(myStatus?.queueStatus || '').toLowerCase() === 'disabled' && (
                    <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-900 text-sm font-medium">
                      Still queue is not available.
                    </div>
                  )}

                  {String(myStatus?.queueStatus || '').toLowerCase() === 'enabled' &&
                    myStatus?.checkinOpen === false && (
                      <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-slate-800 text-sm font-medium">
                        Check-in window closed.
                      </div>
                    )}

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">My token</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">
                        {myStatus?.tokenNumber || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Currently serving</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">
                        {myStatus?.currentlyServing || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">My position</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">
                        {myStatus?.position || '—'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Estimated wait</p>
                      <p className="mt-1 text-2xl font-extrabold text-slate-900">
                        {typeof myStatus?.estimatedWaitMinutes === 'number'
                          ? `${myStatus.estimatedWaitMinutes} min`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {typeof myStatus?.remainingMinutes === 'number' && (
                    <p className="mt-3 text-xs text-slate-600 font-semibold">
                      Check-in closes in {myStatus.remainingMinutes} min.
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={!canCheckIn}
                      onClick={async () => {
                        setActionError('');
                        try {
                          await checkInApi(selectedApptId);
                          await loadQueue();
                        } catch (e) {
                          setActionError(e?.response?.data?.message || e?.message || 'Check-in failed');
                        }
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold shadow-md disabled:opacity-50"
                    >
                      Check in
                    </button>
                    <button
                      type="button"
                      onClick={loadQueue}
                      className="px-6 py-3 rounded-xl border border-slate-300 text-slate-800 font-semibold bg-white hover:bg-slate-50"
                    >
                      Refresh
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-blue-100 shadow-sm p-6">
              <h2 className="text-lg font-extrabold text-slate-900">Live queue board</h2>
              {loadingQueue ? (
                <p className="mt-3 text-slate-600">Loading…</p>
              ) : (
                <>
                  <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-indigo-600 to-blue-700 text-white px-5 py-4">
                    <div>
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Currently serving</p>
                      <p className="text-3xl font-extrabold">{board?.currentlyServing || '—'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-white/80 uppercase tracking-wide">Queue status</p>
                      <p className="text-lg font-bold">{board?.status || '—'}</p>
                    </div>
                  </div>

                  <div className="mt-5">
                    {!board?.tokens?.length ? (
                      <p className="text-slate-600 text-sm">No patients are currently in the queue.</p>
                    ) : (
                      <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {board.tokens.map((t, idx) => (
                          <li
                            key={t._id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-extrabold">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 truncate">{t.patientName}</p>
                                <p className="text-xs text-slate-600">
                                  {t.status === 'called' ? 'Serving now' : 'Waiting'}
                                </p>
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-lg bg-white border border-slate-200 font-extrabold text-slate-900">
                              {t.tokenNumber}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
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
