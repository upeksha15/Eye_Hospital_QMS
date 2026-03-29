import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueue } from '../context/QueueContext';
import Navbar from '../components/StaffTopBar';
import { bookingStrings } from '../i18n/bookingStrings';
import SidebarNav from '../components/StaffSidebar';
import axios from 'axios';
import {
  Users,
  CalendarDays,
  Clock3,
  ChevronRight,
  Activity,
  Stethoscope,
} from 'lucide-react';

// will load from backend

const Dashboard = () => {
  const { user } = useQueue();
  const navigate = useNavigate();

  const today = new Date();

  const [doctorRooms, setDoctorRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const API_URL = "http://localhost:5000/api/doctor-rooms";

  const fetchDoctorRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await axios.get(API_URL);
      setDoctorRooms(res.data || []);
    } catch (err) {
      console.error('Failed to load doctor rooms', err);
      setDoctorRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchDoctorRooms();
  }, []);

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'Paused':
        return 'bg-amber-50 text-amber-700 border-amber-300';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Inactive':
        return 'bg-red-50 text-red-600 border-red-300';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 grid grid-rows-[82px_1fr]">
      <Navbar strings={bookingStrings.en} patient={user} />

      <div className="h-full flex overflow-hidden">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <section className="rounded-3xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-emerald-500 p-8">
                <div className="flex items-center justify-between gap-6">
                  <div>
                    <p className="text-sm font-semibold text-white/90 uppercase tracking-wider">Staff Dashboard</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">Welcome back, {user?.name || 'Staff'}</h1>
                    <p className="mt-1 text-sm text-white/90">Overview of today's clinic operations</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                      <CalendarDays className="w-5 h-5 text-white/90" />
                      <div className="text-sm text-white/90">{today.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl">
                      <Clock3 className="w-5 h-5 text-white/90" />
                      <div className="text-sm text-white/90">{today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10"><Users className="w-6 h-6 text-white" /></div>
                    <div>
                      <p className="text-xs text-white/90 font-medium">Doctor Rooms</p>
                      <div className="text-2xl font-extrabold text-white">{doctorRooms.length}</div>
                    </div>
                  </div>

                  <div className="bg-white/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10"><Activity className="w-6 h-6 text-white" /></div>
                    <div>
                      <p className="text-xs text-white/90 font-medium">Active Queues</p>
                      <div className="text-2xl font-extrabold text-white">{doctorRooms.filter((d) => (d.status || 'Active') === 'Active').length}</div>
                    </div>
                  </div>

                  <div className="bg-white/20 rounded-2xl p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-white/10"><Stethoscope className="w-6 h-6 text-white" /></div>
                    <div>
                      <p className="text-xs text-white/90 font-medium">Today</p>
                      <div className="text-2xl font-extrabold text-white">{today.toLocaleDateString('en-GB')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Doctor Rooms & Queues</h2>
                  <p className="text-sm text-slate-500">Monitor and jump into management screens</p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => navigate('/appointments')} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg text-sm font-semibold border">
                    <ChevronRight className="w-4 h-4" /> Browse Appointments
                  </button>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {loadingRooms ? (
                  <div className="p-8 text-center col-span-3 text-slate-500">Loading doctor rooms…</div>
                ) : doctorRooms.length === 0 ? (
                  <div className="p-8 text-center col-span-3 text-slate-500">No doctor rooms found.</div>
                ) : (
                  doctorRooms.map((doctor) => {
                    const status = doctor.status || 'Active';
                    const progress = doctor.slotLimit ? Math.min(100, (doctor.slotLimit / Math.max(1, doctor.slotLimit)) * 70) : (status === 'Active' ? 70 : 10);
                    return (
                      <div key={doctor._id} className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 shadow-sm hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Room {doctor.room}</p>
                            <h3 className="text-lg font-bold text-slate-900 mt-1">{doctor.doctorName}</h3>
                            <p className="text-xs text-slate-500 mt-1">{doctor.specialization || 'General Ophthalmology'}</p>
                            <p className="text-xs text-slate-400 mt-1">Slot limit: {doctor.slotLimit || '—'} · Queue: {doctor.queueLimit || '—'}</p>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyles(status)}`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-2 bg-emerald-400 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => navigate(`/doctors/${doctor._id}`)}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                            >
                              View Queue
                            </button>
                            <button
                              type="button"
                              onClick={() => navigate('/follow-ups', { state: { doctorId: doctor._id } })}
                              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-800 border hover:bg-slate-200 transition"
                            >
                              Schedule Follow-Up
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;