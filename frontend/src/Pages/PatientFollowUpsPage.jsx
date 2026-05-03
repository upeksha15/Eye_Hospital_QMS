import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function PatientFollowUpsPage() {
  const { patient } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(false);

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
          ) : followUps.filter(f => !f.patientAppointmentId).length === 0 ? (
            <p className="text-sm text-slate-600">You currently have no follow-up appointments listed.</p>
          ) : (
            <div className="space-y-4">
              {followUps.filter(f => !f.patientAppointmentId).map((f) => (
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
                      className="px-3 py-1 rounded-md border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm font-semibold transition-colors"
                      onClick={async () => {
                        if (!window.confirm('Deny and cancel this follow-up?')) return;
                        try {
                          await api.patch(`/api/follow-ups/${f._id || f.id}/cancel`);
                          setFollowUps((s) => s.filter(x => (x._id||x.id) !== (f._id||f.id)));
                        } catch (e) {
                          alert(e.response?.data?.message || e.message || 'Cancel failed');
                        }
                      }}
                    >
                      Deny
                    </button>

                    <button
                      className="px-3 py-1 rounded-md bg-emerald-600 text-white text-sm font-semibold shadow-sm hover:bg-emerald-700 transition-colors"
                      onClick={async () => {
                        if (!window.confirm('Accept this follow-up appointment?')) return;
                        try {
                          setLoading(true);
                          const iso = f.recommendedDate ? new Date(f.recommendedDate).toISOString() : new Date().toISOString();
                          const res = await api.patch(`/api/follow-ups/${f._id || f.id}/reschedule`, { recommendedDate: iso });
                          setFollowUps((s) => s.filter(x => (x._id||x.id) !== (f._id||f.id)));
                          alert('Follow-up accepted successfully! You can view it in My Appointments.');
                        } catch (e) {
                          alert(e.response?.data?.message || e.message || 'Failed to accept follow-up');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

