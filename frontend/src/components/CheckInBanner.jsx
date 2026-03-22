import React, { useEffect, useState } from 'react';
import { fetchMyAppointments, checkIn } from '../api/appointmentsApi';
import { formatYMD, nowColombo } from '../utils/dateHelpers';

export default function CheckInBanner() {
  const [todayAppt, setTodayAppt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = async () => {
    try {
      const data = await fetchMyAppointments();
      const today = formatYMD(nowColombo());
      const hit = (data.appointments || []).find((a) => {
        const d = formatYMD(new Date(a.appointmentDate));
        return d === today && a.status === 'booked';
      });
      setTodayAppt(hit || null);
    } catch {
      setTodayAppt(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCheckIn = async () => {
    if (!todayAppt?._id) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await checkIn(todayAppt._id);
      setMsg(`Checked in — token ${res.tokenNumber} (position ${res.position})`);
      await load();
    } catch (e) {
      setMsg(e.response?.data?.message || e.message || 'Check-in failed');
    } finally {
      setBusy(false);
    }
  };

  if (!todayAppt) return null;

  const doc = todayAppt.doctorId;
  const doctorName = doc?.fullName || 'Your consultant';
  const room = doc?.room || '—';
  const refCode = todayAppt.bookingRef || '—';

  return (
    <div className="mb-6 rounded-[18px] bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white p-5 shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">You have an appointment today</p>
        <p className="text-lg font-semibold mt-1">{doctorName}</p>
        <p className="text-sm text-blue-100 mt-1">
          Room {room} · Ref {refCode}
        </p>
        {msg && <p className="text-sm text-blue-50 mt-2 font-medium">{msg}</p>}
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onCheckIn}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm shadow-md hover:-translate-y-0.5 transition transform disabled:opacity-70"
      >
        {busy ? 'Checking in…' : 'Check In Now →'}
      </button>
    </div>
  );
}
