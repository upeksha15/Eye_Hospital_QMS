import React from 'react';
import { X, Clock, TrendingDown } from 'lucide-react';

// Admin dashboard detail modal: waiting time analysis.
export default function WaitingTimeDetail({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl max-h-96 overflow-y-auto w-full">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Wait Time Analysis</h2>
            <p className="text-sm text-slate-500">
              Overall average: <span className="font-bold">{data.overallAverageWait} mins</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {data.doctors && data.doctors.length > 0 ? (
            data.doctors.map((doctor) => (
              <div key={doctor.doctorId} className="space-y-3">
                <div className="pb-3 border-b-2 border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">{doctor.doctorName}</h3>
                      <p className="text-sm text-slate-500">{doctor.speciality}</p>
                    </div>
                    <div className="text-right bg-orange-50 rounded-lg p-2">
                      <p className="text-xs text-slate-500">Average Wait</p>
                      <p className="text-lg font-bold text-orange-600">
                        {doctor.averageWait}
                        <span className="text-sm ml-1">mins</span>
                      </p>
                    </div>
                  </div>
                </div>

                {doctor.tokens && doctor.tokens.length > 0 ? (
                  <div className="grid gap-2">
                    {doctor.tokens.map((token, idx) => (
                      <div
                        key={token._id}
                        className="bg-gradient-to-r from-slate-50 to-orange-50 rounded-lg p-3 border border-slate-200 hover:border-orange-300 transition flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-700 font-semibold text-sm">
                            #{idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {token.tokenNumber || 'Token ' + (idx + 1)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Checked in:{' '}
                              {new Date(token.checkinTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Wait Time</p>
                          <p className="text-lg font-bold text-orange-600">
                            {token.waitMinutes}
                            <span className="text-xs ml-1">m</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 py-2">No queue data for this doctor</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No queue data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
