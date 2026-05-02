import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PatientFollowUpsPage() {
  const { patient } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/follow-ups/mine');
        if (!mounted) return;
        const items = res.data?.items || [];
        setFollowUps(items);
      } catch (e) {
        setFollowUps([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [patient]);

  function formatDate(d) {
    if (!d) return '--';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito'] text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-['Playfair_Display'] text-3xl text-[#1E3A8A] mb-3">Follow-Ups</h1>
        <p className="text-slate-600 mb-4">
          Follow-up appointments scheduled by your doctors will appear here. This section can be
          used to track recommended review visits after surgeries, treatments, or regular
          check-ups.
        </p>

        <div className="mt-6 rounded-2xl bg-white border border-blue-100 p-6 shadow-sm">
          {loading ? (
            <div className="text-sm text-slate-600">Loading follow-ups…</div>
          ) : followUps.length === 0 ? (
            <p className="text-sm text-slate-600">You currently have no follow-up appointments listed.</p>
          ) : (
            <div className="space-y-4">
              {followUps.map((f) => (
                <div key={f._id || f.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{f.patientName || patient?.fullName || 'You'}</div>
                      <div className="text-xs text-slate-600">Doctor: {f.doctorName || '—'}</div>
                      <div className="text-xs text-slate-600">NIC: {f.patientNIC || patient?.nic || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatDate(f.recommendedDate)}</div>
                      <div className="text-xs text-slate-500">{f.intervalValue} {f.intervalType}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-end gap-3">
                    <button
                      className="px-3 py-1 rounded-md bg-red-500 text-white text-sm"
                      onClick={async () => {
                        if (!window.confirm('Cancel this follow-up?')) return;
                        try {
                          await api.patch(`/api/follow-ups/${f._id || f.id}/cancel`);
                          setFollowUps((s) => s.filter(x => (x._id||x.id) !== (f._id||f.id)));
                        } catch (e) {
                          alert(e.response?.data?.message || e.message || 'Cancel failed');
                        }
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm"
                      onClick={() => {
                        const iso = f.recommendedDate ? new Date(f.recommendedDate).toISOString().slice(0,10) : '';
                        setRescheduleId(f._id || f.id);
                        setRescheduleDate(iso);
                        setRescheduleError('');
                      }}
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {rescheduleId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRescheduleId(null)} />
          <div className="relative w-full max-w-md mx-4">
            <div className="bg-white rounded-lg shadow-lg border p-6">
              <h3 className="text-lg font-semibold mb-2">Reschedule Follow-Up</h3>
              <label className="block text-xs font-semibold text-slate-700">New Recommended Date</label>
              <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} className="w-full px-3 py-2 rounded-md border mt-2 mb-3" />
              {rescheduleError && <div className="text-xs text-red-600 mb-2">{rescheduleError}</div>}
              <div className="flex justify-end gap-2">
                <button className="px-3 py-1 rounded-md border" onClick={() => setRescheduleId(null)}>Cancel</button>
                <button className="px-3 py-1 rounded-md bg-emerald-600 text-white" onClick={async () => {
                  if (!rescheduleDate) { setRescheduleError('Please choose a date'); return; }
                  setRescheduleLoading(true); setRescheduleError('');
                  try {
                    const iso = new Date(rescheduleDate).toISOString();
                    const res = await api.patch(`/api/follow-ups/${rescheduleId}/reschedule`, { recommendedDate: iso });
                    const updated = res.data?.followUp || res.data;
                    setFollowUps((s) => s.map(x => (x._id||x.id) === (updated._id||updated.id) ? { ...x, recommendedDate: updated.recommendedDate } : x));
                    // Try to create a corresponding appointment so it appears in My Appointments
                    // Server will create the appointment and return it (if successful).
                    // Response contains followUp and optional appointment.
                    // (No additional client POST required.)
                    setRescheduleId(null);
                  } catch (e) {
                    setRescheduleError(e.response?.data?.message || e.message || 'Reschedule failed');
                  } finally { setRescheduleLoading(false); }
                }}>{rescheduleLoading ? 'Saving…' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

