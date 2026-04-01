import React, { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';

const DOCTOR_OPTIONS = [
  { id: 'dr-silva', name: 'Dr Silva' },
  { id: 'dr-nimal', name: 'Dr Nimal' },
  { id: 'dr-kasuni', name: 'Dr Kasuni' },
];

const FollowUps = () => {
  const location = useLocation();

  const initialDoctorId =
    location.state?.doctorId || DOCTOR_OPTIONS[0]?.id || null;

  const [patientQuery, setPatientQuery] = useState('');
  const [intervalValue, setIntervalValue] = useState(3);
  const [intervalType, setIntervalType] = useState('days');
  const [selectedDoctorId, setSelectedDoctorId] = useState(initialDoctorId);
  const [followUps, setFollowUps] = useState([]);
  const recommendedDate = useMemo(() => {
    const value = Number(intervalValue);
    if (!value || Number.isNaN(value)) return null;

    const date = new Date();
    if (intervalType === 'days') {
      date.setDate(date.getDate() + value);
    } else if (intervalType === 'weeks') {
      date.setDate(date.getDate() + value * 7);
    } else {
      date.setMonth(date.getMonth() + value);
    }
    return date;
  }, [intervalValue, intervalType]);

  const firstAvailableSlot = useMemo(() => {
    if (!recommendedDate) return null;
    const slot = new Date(recommendedDate);
    slot.setHours(10, 0, 0, 0);
    return slot;
  }, [recommendedDate]);


  const handleReserve = () => {
    if (!patientQuery || !recommendedDate || !selectedDoctorId) return;

    const doctor =
      DOCTOR_OPTIONS.find((d) => d.id === selectedDoctorId) ||
      DOCTOR_OPTIONS[0];

    const entry = {
      id: Date.now(),
      patientName: patientQuery,
      doctorName: doctor.name,
      recommendedDate,
      status: 'Reserved',
    };

    setFollowUps((prev) => [entry, ...prev]);
  };

  const handleConfirmAll = () => {
    setFollowUps((prev) =>
      prev.map((f) =>
        f.status === 'Reserved' ? { ...f, status: 'Confirmed' } : f
      )
    );
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const formatTime = (date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const today = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-blue-50/30 to-indigo-50/40 grid grid-rows-[70px_1fr] h-screen">
      <Navbar />

      <div className="h-full flex overflow-hidden">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-1">
                    Follow-Up Scheduling
                  </p>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Create Follow-Up Appointments
                  </h1>
                  <p className="text-xs md:text-sm text-slate-600 font-medium mt-1">
                    Based on doctor recommendations and clinic availability
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500 mb-1">
                    Today
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {today.toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </section>

              {/* Form */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6 space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Search patient */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Search Patient (ID or Name)
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      placeholder="e.g. P-10234 or Nimal Perera"
                      value={patientQuery}
                      onChange={(e) => setPatientQuery(e.target.value)}
                    />
                  </div>

                  {/* Doctor */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Doctor
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      value={selectedDoctorId || ''}
                      onChange={(e) => setSelectedDoctorId(e.target.value)}
                    >
                      {DOCTOR_OPTIONS.map((doc) => (
                        <option key={doc.id} value={doc.id}>
                          {doc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {/* Interval number */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Follow-Up Interval
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      value={intervalValue}
                      onChange={(e) => setIntervalValue(e.target.value)}
                    />
                  </div>

                  {/* Interval type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Interval Type
                    </label>
                    <select
                      className="w-full px-4 py-2.5 text-sm border rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      value={intervalType}
                      onChange={(e) => setIntervalType(e.target.value)}
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                    </select>
                  </div>

                  {/* Recommended date */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Recommended Date
                    </label>
                    <div className="px-4 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-800">
                      {recommendedDate ? formatDate(recommendedDate) : '--'}
                    </div>
                  </div>
                </div>

                {/* First available slot */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Available Slot
                    </label>
                    <div className="px-4 py-2.5 text-sm border rounded-xl bg-slate-50 text-slate-800">
                      {firstAvailableSlot
                        ? `${formatDate(firstAvailableSlot)} · ${formatTime(
                            firstAvailableSlot
                          )}`
                        : '--'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleReserve}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white border-2 border-blue-700 hover:bg-blue-700 hover:border-blue-800 hover:shadow-lg transition-all"
                  >
                    Reserve Follow-Up
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAll}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 text-emerald-700 border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-all"
                  >
                    Confirm Follow-Up
                  </button>
                </div>
              </section>

              {/* Follow-up table */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">
              Scheduled Follow-Ups
            </h2>

            {followUps.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 font-medium">
                No follow-up appointments reserved yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">
                        Patient Name
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">
                        Doctor
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">
                        Recommended Date
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {followUps.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2 text-slate-800 font-medium">
                          {f.patientName}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {f.doctorName}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {formatDate(f.recommendedDate)}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                              f.status === 'Confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
              </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default FollowUps;

