import React from 'react';
import { formatLongDate } from '../utils/dateHelpers';

export default function SlotDetailPanel({ dateStr, slot, lang, strings }) {
  if (!dateStr || !slot) {
    return (
      <div className="rounded-[14px] border-2 border-dashed border-blue-200 bg-blue-50/40 p-8 text-center text-slate-500">
        <p className="text-4xl mb-2">📅</p>
        <p className="font-medium">Select a date on the calendar to see slot details.</p>
      </div>
    );
  }

  const hours =
    slot.isSaturday
      ? 'Saturday: 7:00 AM – 10:00 AM'
      : 'Weekdays: 7:00 AM – 4:00 PM';

  return (
    <div className="rounded-[14px] overflow-hidden border border-blue-100 shadow-md">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3">
        <p className="font-['Playfair_Display'] text-lg font-semibold">
          {formatLongDate(new Date(`${dateStr}T12:00:00+05:30`), lang)}
        </p>
        <p className="text-sm text-blue-100 mt-1">{hours}</p>
      </div>
      <div className="grid grid-cols-3 gap-px bg-blue-100">
        <div className="bg-white p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-xl font-bold text-blue-600">{slot.totalSlots}</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Booked</p>
          <p className="text-xl font-bold text-red-500">{slot.bookedCount}</p>
        </div>
        <div className="bg-white p-3 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Available</p>
          <p className="text-xl font-bold text-emerald-600">{slot.available}</p>
        </div>
      </div>
    </div>
  );
}
