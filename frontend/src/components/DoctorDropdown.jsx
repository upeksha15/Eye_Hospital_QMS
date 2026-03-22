import React from 'react';
import { MapPin } from 'lucide-react';
import { initialsFromName } from '../utils/tokenHelpers';

const statusStyles = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  limited: 'bg-amber-100 text-amber-800 border-amber-200',
  full: 'bg-red-100 text-red-800 border-red-200',
};

export default function DoctorDropdown({
  doctors,
  value,
  onChange,
  strings,
}) {
  const selected = doctors.find((d) => d._id === value);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-['Playfair_Display'] text-xl text-[#1E3A8A] font-semibold">
          {strings.selectConsultant}
        </h3>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
          {doctors.length} consultants available
        </span>
      </div>

      <div className="relative">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-[10px] border-2 border-blue-200 bg-white px-4 py-3 pr-12 text-slate-800 font-medium focus:outline-none focus:ring-4 focus:ring-blue-200/80 focus:border-blue-400 transition shadow-sm"
        >
          <option value="">— Select a consultant —</option>
          {doctors.map((d) => (
            <option key={d._id} value={d._id}>
              {d.fullName} — {d.speciality}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 text-lg">
          ▾
        </span>
      </div>

      {selected && (
        <div
          key={selected._id}
          className="rounded-[14px] border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-[0_4px_24px_rgba(37,99,235,0.08)] animate-[fadeIn_0.35s_ease-out]"
          style={{ animation: 'fadeSlide 0.35s ease-out' }}
        >
          <style>{`
            @keyframes fadeSlide {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-md">
              {selected.initials || initialsFromName(selected.fullName)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 text-lg truncate">{selected.fullName}</p>
              <p className="text-sm text-slate-600">{selected.speciality}</p>
              <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                Room {selected.room}
              </p>
              <span
                className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                  statusStyles[selected.status] || statusStyles.available
                }`}
              >
                {selected.status === 'available' && 'Available'}
                {selected.status === 'limited' && 'Limited slots'}
                {selected.status === 'full' && 'Fully booked'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
