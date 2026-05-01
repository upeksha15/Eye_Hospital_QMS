import React, { useState } from 'react';
import { X, Clock, Ticket, ChevronDown, ChevronUp } from 'lucide-react';

// Admin dashboard detail modal: active queues by doctor.
export default function ActiveQueuesDetail({ data, onClose }) {
  const [expandedDoctor, setExpandedDoctor] = useState(null);

  if (!data) return null;

  const toggleDoctor = (doctorId) => {
    setExpandedDoctor(expandedDoctor === doctorId ? null : doctorId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl max-h-96 overflow-y-auto w-full">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Queues</h2>
            <p className="text-sm text-slate-500">Total queues operating: {data.doctors?.length || 0}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {data.doctors && data.doctors.length > 0 ? (
            data.doctors.map((doctor) => (
              <div key={doctor.doctorId} className="space-y-2">
                <button
                  onClick={() => toggleDoctor(doctor.doctorId)}
                  className="w-full bg-gradient-to-r from-violet-50 to-slate-50 rounded-lg p-4 border border-violet-200 hover:border-violet-300 transition text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{doctor.doctorName}</h3>
                      <p className="text-sm text-slate-600">{doctor.speciality}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-lg px-3 py-2 border border-violet-200">
                        <p className="text-xs text-slate-500">Queue Members</p>
                        <p className="text-lg font-bold text-violet-600">
                          {doctor.queues?.length || 0}
                        </p>
                      </div>
                      {expandedDoctor === doctor.doctorId ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </button>

                {expandedDoctor === doctor.doctorId && doctor.queues && doctor.queues.length > 0 && (
                  <div className="ml-2 space-y-2">
                    {doctor.queues.map((queue, idx) => (
                      <div
                        key={queue._id}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-violet-300 transition"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 font-semibold text-sm shrink-0">
                              #{idx + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-slate-900">
                                {queue.tokenNumber || 'Token ' + (idx + 1)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {queue.visitReason || 'Consultation'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-600">
                              {new Date(queue.checkinTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {queue.status === 'waiting' && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                Waiting
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active queues in the system</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
