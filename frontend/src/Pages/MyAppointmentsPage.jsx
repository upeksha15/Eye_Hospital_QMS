import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMyAppointments } from '../api/appointmentsApi';

export default function MyAppointmentsPage() {
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
    <div className="min-h-full bg-gray-50 font-['Nunito']">
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
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((a) => {
              const statusLabel = a.status?.replace('_', ' ') || 'unknown';
              const status = String(a.status || '').toLowerCase();
              const statusColor =
                status === 'approved'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : status === 'pending'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : status === 'cancelled'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200';

              const cardColor =
                status === 'approved'
                  ? 'bg-emerald-50 border-emerald-100'
                  : status === 'pending'
                  ? 'bg-amber-50 border-amber-100'
                  : status === 'cancelled'
                  ? 'bg-rose-50 border-rose-100'
                  : 'bg-sky-50 border-sky-100';

              return (
                <div
                  key={a._id}
                  className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between ${cardColor}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">{a.bookingRef}</p>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusColor}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">
                      {a.doctorId?.doctorName || a.doctorId?.fullName || 'Doctor'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(a.appointmentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
