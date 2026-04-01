import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAppointments } from '../api/appointmentsApi';
import Navbar from '../components/Navbar';
import TopBar from '../components/TopBar';
import HoursStrip from '../components/HoursStrip';
import NoticeBar from '../components/NoticeBar';
import { bookingStrings } from '../i18n/bookingStrings';
import { useAuth } from '../hooks/useAuth';

export default function MyAppointmentsPage() {
  const { patient } = useAuth();
  const strings = bookingStrings.en;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito']">
      <TopBar lang="en" onLangChange={() => {}} strings={strings} />
      <Navbar strings={strings} patient={patient} />
      <HoursStrip strings={strings} />
      <NoticeBar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/appointments/book" className="text-blue-600 font-semibold text-sm hover:underline">
          ← Back to booking
        </Link>
        <h1 className="mt-4 font-['Playfair_Display'] text-3xl text-[#1E3A8A]">My appointments</h1>
        {loading ? (
          <p className="mt-4 text-slate-600">Loading…</p>
        ) : items.length === 0 ? (
          <p className="mt-4 text-slate-600">No appointments yet.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {items.map((a) => (
              <li
                key={a._id}
                className="rounded-2xl bg-white border border-blue-100 p-4 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{a.bookingRef}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor'} · {new Date(a.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{a.status?.replace('_', ' ')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
