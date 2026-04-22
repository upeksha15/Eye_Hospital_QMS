import React from 'react';
import { X, Calendar, User, Phone, Mail } from 'lucide-react';

export default function TodayAppointmentsDetail({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl max-h-96 overflow-y-auto w-full">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Today's Appointments</h2>
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
                  <h3 className="font-semibold text-slate-900">{doctor.doctorName}</h3>
                  <p className="text-sm text-slate-500">{doctor.speciality}</p>
                </div>
                <div className="grid gap-2">
                  {doctor.appointments && doctor.appointments.length > 0 ? (
                    doctor.appointments.map((apt) => (
                      <div
                        key={apt._id}
                        className="bg-slate-50 rounded-lg p-3 border border-slate-200 hover:border-blue-300 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-4 h-4 text-slate-500 shrink-0" />
                              <p className="font-medium text-slate-900 truncate">
                                {apt.patient?.name || 'Unknown'}
                              </p>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                                  apt.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : apt.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : apt.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(apt.appointmentDate).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {apt.patient?.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  {apt.patient.email}
                                </span>
                              )}
                              {apt.patient?.contact && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  {apt.patient.contact}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Visit: {apt.visitReason || 'Consultation'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 py-2">No appointments</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <p>No appointments scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
