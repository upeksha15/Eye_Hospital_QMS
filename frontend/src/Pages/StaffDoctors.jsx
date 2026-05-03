import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';
import QueueControls from '../components/QueueControls';
import WaitingQueue from '../components/WaitingQueue';
// RecallQueue removed from staff layout; replaced by single skipped-patients section
import { useQueue } from '../context/QueueContext';
import api from '../api/client';

const Doctors = () => {
  const { doctorId } = useParams();
  const [doctorRooms, setDoctorRooms] = useState([]);
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const {
    currentToken,
    waitingQueue,
    recallQueue,
    removePatientFromQueue,
    markPatientMissed,
    doctorStatuses,
    setActiveDoctorId,
    cancelToken,
    markSkippedDone,
  } = useQueue();

  

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetchRooms = async () => {
        try {
        const res = await api.get('/api/doctor-rooms');
        if (!mounted) return;
        setDoctorRooms(res.data || []);
      } catch (err) {
        console.error('Failed to load doctor rooms', err);
        setDoctorRooms([]);
      }
    };

    fetchRooms();
    return () => {
      mounted = false;
    };
  }, []);

  // If a doctorId param is present, try to fetch that doctor's record directly
  useEffect(() => {
    let mounted = true;
    const fetchDoctor = async () => {
      if (!doctorId) return;
      try {
        const res = await api.get(`/api/doctor-rooms/${doctorId}`);
        if (!mounted) return;
        setSelectedDoctorObj(res.data || null);
      } catch (err) {
        // not found or API error - clear selectedDoctorObj
        setSelectedDoctorObj(null);
      }
    };

    fetchDoctor();
    return () => {
      mounted = false;
    };
  }, [doctorId]);

  const selectedDoctor =
    // prefer explicit fetched doctor, then backend list match, then first backend record
    selectedDoctorObj ||
    (doctorRooms && doctorRooms.find((d) => String(d._id) === String(doctorId))) ||
    doctorRooms[0] ||
    null;

  useEffect(() => {
    const id = selectedDoctor?._id ? String(selectedDoctor._id) : '';
    if (id) setActiveDoctorId(id);
  }, [selectedDoctor?._id, setActiveDoctorId]);

  // Search and filtered skipped list (must run after selectedDoctor is defined)
  const [searchQuery, setSearchQuery] = useState('');
  const filteredRecall = useMemo(() => {
    // show only skipped entries for the selected doctor
    const doctorIdStr = selectedDoctor?._id ? String(selectedDoctor._id) : '';
    const byDoctor = doctorIdStr
      ? recallQueue.filter((p) => String(p.doctorId || doctorIdStr) === doctorIdStr)
      : recallQueue;

    const q = String(searchQuery || '').trim().toLowerCase();
    if (!q) return byDoctor;
    return byDoctor.filter((p) => {
      const name = String(p.patientName || '').toLowerCase();
      const phone = String(p.patientPhone || '').toLowerCase();
      const token = String(p.token || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || token.includes(q);
    });
  }, [recallQueue, searchQuery, selectedDoctor]);

  // normalize display fields for API vs static entries
  const displayName = selectedDoctor?.doctorName || selectedDoctor?.name || 'Doctor';
  const displayDepartment = selectedDoctor?.specialization || selectedDoctor?.department || '';

  const totalCheckedIn = waitingQueue.length + (currentToken ? 1 : 0);

  // derive per-doctor status (falls back to selectedDoctor.status or global isActive)
  const rawStatus =
    (selectedDoctor && selectedDoctor._id && doctorStatuses && doctorStatuses[selectedDoctor._id]) ||
    selectedDoctor?.status ||
    'Disabled';

  let queueStatus;
  const rs = String(rawStatus || '').toLowerCase();
  if (rs === 'enabled') queueStatus = 'Active';
  else if (rs === 'paused') queueStatus = 'Paused';
  else if (rs === 'disabled') queueStatus = 'Stopped';
  else queueStatus = rawStatus;
  // prefer showing 'Enabled' label rather than 'Active' for clarity
  if (String(rawStatus || '').toLowerCase() === 'enabled') queueStatus = 'Enabled';

  if (!selectedDoctor) {
    return (
      <div className="min-h-screen bg-staff-blue-50 grid grid-rows-[82px_1fr] h-screen">
        <Navbar />
        <div className="h-full flex overflow-hidden">
          <SidebarNav />
          <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
            <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
              No doctor rooms found. Add a doctor room in Queue Management first.
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-staff-blue-50 grid grid-rows-[82px_1fr] h-screen">
      <Navbar />

      <div className="h-full flex overflow-hidden">
        <SidebarNav />

        <main className="flex-1 overflow-y-auto scrollbar-thin p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
              {/* Doctor header and stats */}
              <section className="grid gap-6 lg:grid-cols-[2fr_1fr] md:grid-cols-1">
                <div className="bg-gradient-to-r from-blue-50 to-white rounded-2xl shadow-md border border-slate-200 p-6 flex flex-col justify-between border-l-8 border-blue-500">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.2em] mb-1">
                        Queue Control
                      </p>
                      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                        {displayName}
                      </h1>
                      <p className="text-sm text-slate-600 font-medium">
                        {displayDepartment} {displayDepartment ? '·' : ''} Room {selectedDoctor?.room || '--'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${
                          queueStatus === 'Active'
                            ? 'bg-staff-green-50 border-staff-green-100 text-staff-green-600'
                            : 'bg-amber-50 border-amber-300 text-amber-800'
                        }`}
                      >
                        {queueStatus}
                      </span>
                      <button
                        onClick={() => navigate('/staff-dashboard')}
                        className="text-xs font-semibold text-staff-blue-600 hover:text-staff-blue-700 hover:underline"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </div>
                </div>

                
                <div className="grid grid-cols-3 gap-3 md:grid-cols-3 sm:grid-cols-1">
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Current Token
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {currentToken ? currentToken.token : '--'}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Total Checked-In
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {totalCheckedIn}
                    </p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/60 p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      Recall Queue
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      {recallQueue.length}
                    </p>
                  </div>
                </div>
              </section>

              {/* Queue controls and lists */}
              <section className="grid grid-cols-2 gap-6 lg:gap-8 items-stretch">
                <div className="h-full">
                  <QueueControls doctorId={selectedDoctor?._id || ''} />
                </div>
                <div className="h-full">
                  <WaitingQueue />
                </div>
              </section>

              {/* Patient removal / control table */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">Patients who do not appear when called</h2>
                    <p className="text-xs text-slate-500 font-medium">Manage skipped patients (recall queue)</p>
                  </div>
                </div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={searchQuery}
                    placeholder="Search by name or phone"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full max-w-sm border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm"
                  />
                </div>

                {filteredRecall.length === 0 ? (
                  <div className="py-8 text-center text-sm text-slate-500 font-medium">No skipped patients in the recall queue.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Token</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Patient Name</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Phone</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Skipped at</th>
                          <th className="px-4 py-2 text-left font-semibold text-slate-600">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredRecall.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-2 font-semibold text-slate-800">{p.token}</td>
                            <td className="px-4 py-2 text-slate-700">{p.patientName || 'Walk-in Patient'}</td>
                            <td className="px-4 py-2 text-slate-700">{p.patientPhone || '—'}</td>
                            <td className="px-4 py-2 text-slate-700">{p.skippedAt ? new Date(p.skippedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</td>
                            <td className="px-4 py-2 space-x-2">
                              <button
                                onClick={() => markSkippedDone(p.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
                              >
                                Mark as done
                              </button>
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

export default Doctors;

