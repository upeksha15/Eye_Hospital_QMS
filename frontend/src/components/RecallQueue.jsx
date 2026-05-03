import React, { useMemo, useState } from 'react';
import { useQueue } from '../context/QueueContext';

const RecallQueue = () => {
  const { recallQueue, cancelToken, activeDoctorId } = useQueue();
  const now = Date.now();
  const [search, setSearch] = useState('');

  // Show only recall entries relevant to the currently-active doctor (if set)
  const filteredByDoctor = useMemo(() => {
    return (activeDoctorId && String(activeDoctorId).length > 0)
      ? recallQueue.filter((p) => String(p.doctorId || '') === String(activeDoctorId))
      : recallQueue;
  }, [recallQueue, activeDoctorId]);

  const filteredRecall = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return filteredByDoctor;
    return filteredByDoctor.filter((p) => {
      const name = String(p.patientName || '').toLowerCase();
      const phone = String(p.patientPhone || '').toLowerCase();
      const token = String(p.token || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || token.includes(q);
    });
  }, [filteredByDoctor, search]);
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-200/60 transition-transform p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Patients who do not appear when called</h3>
            <p className="text-xs text-slate-500 font-medium">Skipped patients</p>
          </div>
        </div>
              <div className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full border border-amber-400/30 shadow-md">
                <span className="text-sm font-bold text-white">{filteredRecall.length}</span>
              </div>
      </div>
      
          <div className="mt-3 mb-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or token"
              className="w-full max-w-full border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm"
            />
          </div>

          {/* Info box removed (no 10-minute expiry) */}

      <ul className="list-none max-h-[60vh] overflow-y-auto p-0 m-0 space-y-3 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {filteredRecall.length === 0 ? (
          <li className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">All patients seen</p>
            <p className="text-sm text-gray-400 mt-1">No skipped patients in this queue</p>
          </li>
        ) : (
          filteredRecall.map((p) => (
            <li key={p.id} className="flex justify-between items-center p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-3 py-1 rounded-lg font-bold text-lg bg-amber-200 text-amber-800">{p.token}</span>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-800 truncate">{p.patientName || 'Walk-in Patient'}</span>
                      <span className="text-xs text-gray-500">{p.patientPhone || '—'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">Skipped at {p.skippedAt ? new Date(p.skippedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '—'}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-md text-sm font-semibold border border-emerald-200 hover:bg-emerald-100"
                    onClick={() => markSkippedDone(p.id)}
                  >
                    Mark as done
                  </button>
                </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default RecallQueue;