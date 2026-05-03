import React, { useMemo, useState, useEffect } from 'react';
// no router hooks needed here
import Navbar from '../components/StaffTopBar';
import SidebarNav from '../components/StaffSidebar';
import AppointmentCalendar from '../components/AppointmentCalendar';
import {
  monthKeyFromDate,
  nowColombo,
  formatYMD,
  totalSlotsForDate,
  formatLongDate,
} from '../utils/dateHelpers';
import api from '../api/client';


const FollowUps = () => {
  // initial doctor selection may be provided via navigation state (not used here)

  // Calendar / appointments state
  const [monthKey, setMonthKey] = useState(() => monthKeyFromDate(nowColombo()));
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [appointments, setAppointments] = useState([]);
  // search/filter state for appointments
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAppointments = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return appointments;
    return (appointments || []).filter((a) => {
      const name = (a.patientName || '').toLowerCase();
      const nic = (a.patientNIC || '').toLowerCase();
      return name.includes(q) || nic.includes(q);
    });
  }, [appointments, searchQuery]);

  // Scheduling modal state
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [intervalValue, setIntervalValue] = useState(3);
  const [intervalType, setIntervalType] = useState('days');
  const [patientNameInput, setPatientNameInput] = useState('');
  const [doctorNameInput, setDoctorNameInput] = useState('');
  const [patientNICInput, setPatientNICInput] = useState('');
  const [patientPhoneInput, setPatientPhoneInput] = useState('');
  const [overrideRecommendedDate, setOverrideRecommendedDate] = useState(null);

  const formatDate = (date) =>
    date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  // time formatting helper (unused currently)
  // const formatTime = (date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const today = nowColombo();




  // scheduled follow-ups created in this UI (persisted)
  const [scheduledFollowUps, setScheduledFollowUps] = useState([]);
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // load persisted follow-ups from backend
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/api/follow-ups');
        if (!mounted) return;
        const items = res.data?.items || [];
          setScheduledFollowUps(items.map((it) => ({
            id: it._id,
          doctorId: it.doctorId || null,
            appointmentId: it.appointmentId || null,
            patientName: it.patientName,
            patientNIC: it.patientNIC,
            patientPhone: it.patientPhone,
            doctorName: it.doctorName,
            recommendedDate: it.recommendedDate,
            intervalValue: it.intervalValue,
            intervalType: it.intervalType,
          })));
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  // edit/delete state
  const [editingId, setEditingId] = useState(null);
  const [editIntervalValue, setEditIntervalValue] = useState(1);
  const [editIntervalType, setEditIntervalType] = useState('days');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editRecommendedDate, setEditRecommendedDate] = useState(null);
  const [editRecommendedError, setEditRecommendedError] = useState('');

  // generate simple month slots so calendar is selectable for staff
  useEffect(() => {
    const [y, m] = monthKey.split('-').map(Number);
    const total = new Date(y, m, 0).getDate();
    const generated = [];
    for (let d = 1; d <= total; d += 1) {
      const dateObj = new Date(y, m - 1, d, 12, 0, 0);
      const key = formatYMD(dateObj);
      const totalForDay = totalSlotsForDate(dateObj);
      generated.push({
        date: key,
        // do not show an arbitrary '10 left' on this staff calendar — keep availability minimal
        available: totalForDay > 0 ? totalForDay : 0,
        isFull: totalForDay === 0,
        isSaturday: dateObj.getDay() === 6,
      });
    }
    setSlots(generated);
  }, [monthKey]);

  // fetch appointments for selected date (try API, fallback to sample)
  useEffect(() => {
    if (!selectedDate) return;
    let mounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/appointments/by-date?date=${selectedDate}`);
        if (!mounted) return;
        const data = res.data?.appointments || res.data || [];
        const arr = Array.isArray(data) ? data : [];
        // Show all patients who checked into the queues (either currently waiting or completed)
        const validStatuses = ['checked_in', 'completed'];
        const activePatients = arr.filter((a) => validStatuses.includes(String(a.status || '').toLowerCase()));
        setAppointments(activePatients);
      } catch (e) {
        // on error, present an empty list (no local fallback)
        setAppointments([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  const openSchedule = (appointment) => {
    setActiveAppointment(appointment);
    setIntervalValue(1);
    setIntervalType('days');
    setPatientNameInput(appointment.patientName || '');
    setDoctorNameInput(appointment.doctorName || '');
    setPatientNICInput(appointment.patientNIC || '');
    setPatientPhoneInput(appointment.patientContact || '');
    if (appointment?.appointmentDate) {
      setOverrideRecommendedDate(new Date(appointment.appointmentDate));
    } else {
      setOverrideRecommendedDate(null);
    }
  };

  const recommendedDate = useMemo(() => {
    if (overrideRecommendedDate && Number(intervalValue) === 1 && intervalType === 'days') {
      return overrideRecommendedDate;
    }

    const value = Number(intervalValue);
    if (!value || Number.isNaN(value) || !activeAppointment) return null;

    const date = new Date(today);
    if (intervalType === 'days') {
      date.setDate(date.getDate() + value);
    } else if (intervalType === 'weeks') {
      date.setDate(date.getDate() + value * 7);
    } else {
      date.setMonth(date.getMonth() + value);
    }
    return date;
  }, [intervalValue, intervalType, activeAppointment, overrideRecommendedDate, today]);

  useEffect(() => {
    if (!activeAppointment) setOverrideRecommendedDate(null);
  }, [activeAppointment]);

  const [recommendedError, setRecommendedError] = useState('');

  // validate recommended date against doctor's availability + queue via backend endpoint
  useEffect(() => {
    let mounted = true;
    (async () => {
      setRecommendedError('');
      if (!recommendedDate || !activeAppointment) return;
      try {
        const doctorId = activeAppointment.doctorId || activeAppointment.doctorId || null;
        if (!doctorId) {
          // try to find doctor room by name as fallback
          const drRes = await api.get('/api/doctor-rooms');
          const rooms = drRes.data || [];
          const match = rooms.find((r) => (r.doctorName || '').toLowerCase() === (activeAppointment.doctorName || '').toLowerCase());
          if (match) {
            // call check availability
            const q = `/api/appointments/check-availability?doctorId=${match._id}&date=${formatYMD(recommendedDate)}`;
            const resp = await api.get(q);
            if (!mounted) return;
            const body = resp.data || resp;
            if (!body.isAvailable) setRecommendedError('Doctor is not available on this date.');
            else if (body.isQueueFull) setRecommendedError('This date queue is full. Please schedule another date.');
            else setRecommendedError('');
          }
        } else {
          const q = `/api/appointments/check-availability?doctorId=${doctorId}&date=${formatYMD(recommendedDate)}`;
          const resp = await api.get(q);
          if (!mounted) return;
          const body = resp.data || resp;
          if (!body.isAvailable) setRecommendedError('Doctor is not available on this date.');
          else if (body.isQueueFull) setRecommendedError('This date queue is full. Please schedule another date.');
          else setRecommendedError('');
        }
      } catch (e) {
        if (!mounted) return;
        setRecommendedError('');
      }
    })();
    return () => { mounted = false; };
  }, [recommendedDate, activeAppointment]);

  // recompute recommended date and validate while editing
  useEffect(() => {
    let mounted = true;
    if (!editingId) {
      setEditRecommendedDate(null);
      setEditRecommendedError('');
      return;
    }
    // find the follow-up being edited
    const target = scheduledFollowUps.find((x) => x.id === editingId);
    // compute new recommended date from today using editIntervalValue/type
    const value = Number(editIntervalValue);
    if (!value || Number.isNaN(value)) {
      setEditRecommendedDate(null);
      setEditRecommendedError('Invalid interval');
      return;
    }
    const date = new Date(today);
    if (editIntervalType === 'days') date.setDate(date.getDate() + value);
    else if (editIntervalType === 'weeks') date.setDate(date.getDate() + value * 7);
    else date.setMonth(date.getMonth() + value);
    setEditRecommendedDate(date);
    setEditRecommendedError('');

    (async () => {
      try {
        const doctorId = target?.doctorId || null;
        if (!doctorId) {
          setEditRecommendedError('Doctor unknown for validation');
          return;
        }
        const q = `/api/appointments/check-availability?doctorId=${doctorId}&date=${formatYMD(date)}`;
        const resp = await api.get(q);
        if (!mounted) return;
        const body = resp.data || resp;
        if (!body.isAvailable) setEditRecommendedError('Doctor is not available on this date.');
        else if (body.isQueueFull) setEditRecommendedError('This date queue is full. Please schedule another date.');
        else setEditRecommendedError('');
      } catch (e) {
        if (!mounted) return;
        setEditRecommendedError('');
      }
    })();

    return () => { mounted = false; };
  }, [editingId, editIntervalValue, editIntervalType, scheduledFollowUps]);

  const handleSchedule = () => {
    if (!activeAppointment || !recommendedDate) return;
    if (recommendedError) {
      setScheduleError(recommendedError);
      return;
    }
    setScheduleSubmitting(true);
    setScheduleError('');
    (async () => {
      try {
        // prefer doctorId from appointment if available
        const doctorId = activeAppointment.doctorId || null;
        let payload = {
          appointmentId: activeAppointment._id,
          patientName: patientNameInput || activeAppointment.patientName,
          patientNIC: patientNICInput || activeAppointment.patientNIC || '',
          patientPhone: patientPhoneInput || activeAppointment.patientContact || '',
          doctorId,
          doctorName: doctorNameInput || activeAppointment.doctorName,
          intervalValue: Number(intervalValue),
          intervalType,
          recommendedDate: recommendedDate.toISOString(),
        };

        // If doctorId is missing, try to find by name
        if (!doctorId) {
          try {
            const drRes = await api.get('/api/doctor-rooms');
            const rooms = drRes.data || [];
            const match = rooms.find((r) => (r.doctorName || '').toLowerCase() === (activeAppointment.doctorName || '').toLowerCase());
            if (match) payload.doctorId = match._id;
          } catch (e) {
            // ignore
          }
        }

        const res = await api.post('/api/follow-ups', payload);
        const created = res.data?.followUp || res.data;
        const newEntry = {
          id: created._id,
          appointmentId: created.appointmentId || null,
          patientName: created.patientName,
          patientNIC: created.patientNIC,
          patientPhone: created.patientPhone,
          doctorId: created.doctorId || payload.doctorId || null,
          doctorName: created.doctorName,
          recommendedDate: created.recommendedDate,
          intervalValue: created.intervalValue,
          intervalType: created.intervalType,
        };
        setScheduledFollowUps((s) => [newEntry, ...s]);
        setActiveAppointment(null);
        setPatientNameInput('');
        setDoctorNameInput('');
        setPatientNICInput('');
        setPatientPhoneInput('');
      } catch (e) {
        const msg = e.response?.data?.message || e.message || 'Failed to schedule follow-up';
        setScheduleError(msg);
      } finally {
        setScheduleSubmitting(false);
      }
    })();
  };


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

              {/* Calendar + Appointments */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
                <div className="grid lg:grid-cols-[1.6fr_1.4fr] gap-6">
                  <div>
                    <AppointmentCalendar
                      monthKey={monthKey}
                      onMonthChange={setMonthKey}
                      slots={slots}
                      selectedDate={selectedDate}
                      onSelectDate={(d) => setSelectedDate(d)}
                      loading={false}
                      strings={{ chooseDate: 'Choose a date' }}
                      hideAvailableCount={true}
                      compact={true}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {selectedDate ? formatLongDate(new Date(selectedDate)) : 'Select a date'}
                      </h3>
                    </div>

                    {/* Scheduling panel */}
                    {/* Scheduling modal (creative, centered) */}
                    {activeAppointment && (
                      <div className="fixed inset-0 z-40 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveAppointment(null)} />
                        <div className="relative w-full max-w-2xl mx-4">
                          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                            <div className="flex items-center justify-between px-6 py-4 bg-emerald-600/10">
                              <div>
                                <div className="text-sm text-emerald-700 font-semibold">Schedule Follow-Up</div>
                                <div className="text-xs text-slate-600">{activeAppointment.patientName} · {activeAppointment.doctorName}</div>
                              </div>
                              <div className="text-sm text-slate-500">{selectedDate}</div>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-700">Patient Name</label>
                                <input type="text" value={patientNameInput} onChange={(e)=>setPatientNameInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm shadow-sm" />

                                <label className="block text-xs font-semibold text-slate-700">NIC</label>
                                <input type="text" value={patientNICInput} onChange={(e)=>setPatientNICInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm shadow-sm" />

                                <label className="block text-xs font-semibold text-slate-700">Phone</label>
                                <input type="text" value={patientPhoneInput} onChange={(e)=>setPatientPhoneInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm shadow-sm" />
                              </div>

                              <div className="space-y-3">
                                <label className="block text-xs font-semibold text-slate-700">Doctor</label>
                                <input type="text" value={doctorNameInput} onChange={(e)=>setDoctorNameInput(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm shadow-sm" />

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700">Current Date</label>
                                    <div className="mt-1 px-3 py-2 rounded-lg bg-emerald-50 text-sm text-emerald-800 border">{today ? formatDate(today) : '--'}</div>
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700">Gap (Days)</label>
                                    <input type="number" min="1" value={intervalValue} onChange={(e)=>{setIntervalValue(e.target.value); setIntervalType('days');}} className="w-full px-3 py-2 rounded-lg border text-sm shadow-sm" />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-xs font-semibold text-slate-700">Next Visit Day</label>
                                  <div className="mt-1 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-sm text-emerald-800 border">{recommendedDate ? formatDate(recommendedDate) : '--'}</div>
                                  {recommendedError && <div className="text-xs text-red-600 mt-2">{recommendedError}</div>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white">
                              <button onClick={() => setActiveAppointment(null)} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
                              <button onClick={handleSchedule} disabled={scheduleSubmitting || !!recommendedError} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm shadow">
                                {scheduleSubmitting ? 'Scheduling…' : 'Schedule Follow-Up'}
                              </button>
                            </div>
                            {scheduleError && <div className="px-6 py-3 text-sm text-red-600">{scheduleError}</div>}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white border rounded-lg p-3">
                      {selectedDate == null ? (
                        <p className="text-sm text-slate-500">Pick a date on the calendar to view appointments.</p>
                      ) : (
                        <>
                          <div className="mb-3 flex items-center gap-3">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search checked-in patient name or NIC"
                              className="flex-1 px-3 py-2 rounded-lg border text-sm"
                            />
                            <div className="text-sm text-slate-500">{filteredAppointments.length} found</div>
                          </div>

                          <div className="border rounded-lg overflow-hidden">
                            {filteredAppointments.length === 0 ? (
                              <div className="p-8 text-center text-sm text-slate-500">
                                {appointments.length === 0 ? 'No checked-in patients for this date.' : 'No matching appointments.'}
                              </div>
                            ) : (
                              <ul className="divide-y max-h-80 overflow-y-auto">
                                {filteredAppointments.map((a) => (
                                  <li key={a._id} className="py-3 px-4 flex items-center justify-between hover:bg-slate-50">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center text-sm">{(a.patientName||'')[0]||'P'}</div>
                                      <div>
                                        <div className="font-medium text-slate-900">{a.patientName}{a.patientNIC ? <span className="text-slate-500 text-xs ml-2">· {a.patientNIC}</span> : null}</div>
                                        <div className="text-xs text-slate-600">{a.doctorName} · {a.patientContact || 'No contact'}</div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">{a.time || ''}</div>
                                        {scheduledFollowUps.some(f => f.appointmentId === a._id) ? (
                                          <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-sm font-medium">Scheduled</span>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => openSchedule(a)}
                                            className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
                                          >
                                            Schedule
                                          </button>
                                        )}
                                      </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Scheduled follow-ups (frontend-only) */}
              <section className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 p-6">
            <h2 className="text-lg font-extrabold text-slate-900 mb-4">
              Scheduled Follow-Ups
            </h2>

            {scheduledFollowUps.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500 font-medium">
                No follow-up appointments scheduled yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Patient Name</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Doctor</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Next Visit Day</th>
                      <th className="px-4 py-2 text-left font-semibold text-slate-600">Gap</th>
                      <th className="px-4 py-2 text-right font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scheduledFollowUps.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2 text-slate-800 font-medium flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center justify-center">{(f.patientName||'')[0]||'P'}</div>
                          <div>
                            <div className="font-medium">{f.patientName}</div>
                            <div className="text-xs text-slate-500">{f.patientNIC || ''}</div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          <div className="text-sm font-medium">{f.doctorName}</div>
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {editingId === f.id ? (
                            <div>
                              <div className="font-medium">{editRecommendedDate ? formatDate(editRecommendedDate) : '--'}</div>
                              {editRecommendedError && <div className="text-xs text-red-600">{editRecommendedError}</div>}
                            </div>
                          ) : (
                            formatDate(new Date(f.recommendedDate))
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-700">
                          {editingId === f.id ? (
                            <div className="flex items-center gap-2">
                              <input type="number" min="1" value={editIntervalValue} onChange={(e)=>{setEditIntervalValue(e.target.value); setEditIntervalType('days');}} className="w-20 px-2 py-1 rounded border text-sm" />
                              <span className="text-sm">Days</span>
                            </div>
                          ) : (
                            `${f.intervalValue} ${f.intervalType}`
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {editingId === f.id ? (
                            <div className="inline-flex items-center gap-2">
                              <button onClick={async ()=>{
                                setEditLoading(true); setEditError('');
                                try {
                                  // validate recommended date for this edit before saving
                                  const recDate = editRecommendedDate;
                                  if (!recDate) {
                                    setEditError('Invalid recommended date');
                                    setEditLoading(false);
                                    return;
                                  }
                                  if (editRecommendedError) {
                                    setEditError(editRecommendedError);
                                    setEditLoading(false);
                                    return;
                                  }
                                  const payload = { intervalValue: Number(editIntervalValue), intervalType: editIntervalType };
                                  if (editRecommendedDate) payload.recommendedDate = editRecommendedDate.toISOString();
                                  const res = await api.patch(`/api/follow-ups/${f.id}`, payload);
                                  const updated = res.data?.followUp || res.data;
                                  setScheduledFollowUps((s)=>s.map(item=> item.id===f.id ? { ...item, intervalValue: updated.intervalValue, intervalType: updated.intervalType, recommendedDate: updated.recommendedDate || payload.recommendedDate } : item));
                                  setEditingId(null);
                                } catch (e) {
                                  setEditError(e.response?.data?.message || e.message || 'Update failed');
                                } finally { setEditLoading(false); }
                              }} className="px-3 py-1 bg-green-600 text-white rounded text-sm" disabled={editLoading}>{editLoading ? 'Saving…' : 'Save'}</button>
                              <button onClick={()=>{ setEditingId(null); setEditError(''); }} className="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button onClick={()=>{ setEditingId(f.id); setEditIntervalValue(f.intervalValue || 1); setEditIntervalType(f.intervalType || 'days'); setEditError(''); }} className="px-3 py-1 bg-yellow-500 text-white rounded text-sm">Edit</button>
                              <button onClick={async ()=>{
                                if (!window.confirm('Delete this follow-up?')) return;
                                try {
                                  await api.delete(`/api/follow-ups/${f.id}`);
                                  setScheduledFollowUps((s)=>s.filter(item=>item.id!==f.id));
                                } catch (e) {
                                  alert(e.response?.data?.message || e.message || 'Delete failed');
                                }
                              }} className="px-3 py-1 bg-red-500 text-white rounded text-sm">Delete</button>
                            </div>
                          )}
                          {editError && editingId === f.id && <div className="text-xs text-red-600 mt-1">{editError}</div>}
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

