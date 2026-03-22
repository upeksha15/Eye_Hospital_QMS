import React from 'react';

export default function HoursStrip({ strings }) {
  return (
    <div className="bg-[#1E3A8A] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-4 md:gap-0 md:divide-x md:divide-white/30 text-sm">
        <div className="px-4 text-center">{strings.hoursWeekday}</div>
        <div className="px-4 text-center">{strings.hoursSat}</div>
        <div className="px-4 text-center">{strings.hoursSun}</div>
      </div>
    </div>
  );
}
