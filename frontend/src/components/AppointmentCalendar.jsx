import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  formatYMD,
  getDayOfWeekColombo,
  nowColombo,
  startOfDayColombo,
} from '../utils/dateHelpers';

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function AppointmentCalendar({
  monthKey,
  onMonthChange,
  slots,
  selectedDate,
  onSelectDate,
  loading,
  strings,
  allowedWeekdays, // array of weekday names e.g. ['Monday','Wednesday']
  hideAvailableCount = false,
  compact = false,
}) {
  const [y, m] = monthKey.split('-').map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  const totalDays = daysInMonth(y, m - 1);
  const startWeekday = firstOfMonth.getDay();

  const slotMap = useMemo(() => {
    const map = new Map();
    (slots || []).forEach((s) => map.set(s.date, s));
    return map;
  }, [slots]);

  const todayStr = formatYMD(nowColombo());

  const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const allowedSet = new Set((allowedWeekdays || []).map((s) => String(s || '').toLowerCase()));

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ type: 'empty' });
  }
  for (let d = 1; d <= totalDays; d += 1) {
    const dateObj = startOfDayColombo(new Date(y, m - 1, d, 12, 0, 0));
    const key = formatYMD(dateObj);
    const dow = getDayOfWeekColombo(dateObj);
    const slot = slotMap.get(key);
    cells.push({ type: 'day', d, dateObj, key, dow, slot });
  }

  const monthLabel = new Intl.DateTimeFormat('en-LK', {
    month: 'long',
    year: 'numeric',
  }).format(firstOfMonth);

  const go = (delta) => {
    const base = new Date(y, m - 1 + delta, 1);
    const nk = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
    onMonthChange(nk);
  };

  const handleCell = (c) => {
    if (c.type !== 'day') return;
    const { key, dow, slot } = c;
    if (!slot) return;
    const weekdayName = weekdayNames[dow];
    const allowed = allowedSet.size === 0 ? true : allowedSet.has(String(weekdayName).toLowerCase());
    if (!allowed) return;
    if (key < todayStr) return;
    if (slot.isFull) return;
    if (slot.available <= 0) return;
    onSelectDate(key);
  };

  return (
    <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className={`font-['Playfair_Display'] ${compact ? 'text-xl' : 'text-xl'} text-[#1E3A8A] font-semibold`}>
          {strings.chooseDate}
        </h3>
      </div>

      <div className={`rounded-[14px] overflow-hidden border border-blue-100 shadow-[0_4px_24px_rgba(37,99,235,0.08)] bg-white ${compact ? 'max-w-[480px]' : ''}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <button
            type="button"
            onClick={() => go(-1)}
            className={`${compact ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-white/10 transition`}
            aria-label="Previous month"
          >
            <ChevronLeft className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>
          <p className={`font-['Playfair_Display'] ${compact ? 'text-lg' : 'text-lg'} font-semibold`}>{monthLabel}</p>
          <button
            type="button"
            onClick={() => go(1)}
            className={`${compact ? 'p-1' : 'p-2'} rounded-lg hover:bg-white/10 transition`}
            aria-label="Next month"
          >
            <ChevronRight className={`${compact ? 'w-4 h-4' : 'w-5 h-5'}`} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-blue-100 text-center text-xs font-semibold">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, idx) => (
            <div
              key={label}
              className={`py-2 bg-blue-50 ${
                idx === 0 ? 'text-red-600' : idx === 6 ? 'text-amber-600' : 'text-slate-600'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-blue-100 p-px">
          {cells.map((c, idx) => {
            if (c.type === 'empty') {
              return (
                <div key={`e-${idx}`} className={`${compact ? 'min-h-[72px]' : 'min-h-[88px]'} bg-slate-50/80`} />
              );
            }

            const { d, key, dow, slot } = c;
            const isPast = key < todayStr;
            const isToday = key === todayStr;
            const isSelected = selectedDate === key;
            const full = slot?.isFull || slot?.available === 0;
            const sat = slot?.isSaturday;

            const weekdayName = weekdayNames[dow];
            const allowed = allowedSet.size === 0 ? true : allowedSet.has(String(weekdayName).toLowerCase());

            let badge = null;
            if (!allowed) {
              badge = { text: 'Unavailable', className: 'bg-slate-200 text-slate-600' };
            } else if (dow === 0) {
              badge = { text: 'Closed', className: 'bg-slate-200 text-slate-600' };
            } else if (full) {
              badge = { text: 'Full', className: 'bg-red-100 text-red-700' };
            } else if (sat) {
              badge = {
                text: hideAvailableCount ? 'Available' : `${slot.available} left`,
                className: 'bg-blue-100 text-blue-800 border border-blue-200',
              };
            } else if (slot && slot.available > 5) {
              badge = {
                text: hideAvailableCount ? 'Available' : `${slot.available} left`,
                className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
              };
            } else if (slot) {
              badge = {
                text: hideAvailableCount ? 'Available' : `${slot.available} left`,
                className: 'bg-amber-100 text-amber-900 border border-amber-200',
              };
            }

            const disabled = isPast || !allowed || full || !slot || loading;

            return (
              <button
                key={key}
                type="button"
                disabled={disabled}
                onClick={() => handleCell(c)}
                className={`${compact ? 'min-h-[72px] p-1.5' : 'min-h-[88px] p-2'} text-left flex flex-col gap-1 transition rounded-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white ring-2 ring-blue-300 z-10'
                    : !allowed
                      ? 'bg-slate-50/80 cursor-not-allowed opacity-70'
                      : full || isPast
                        ? 'bg-red-50/50 cursor-not-allowed opacity-70'
                        : 'bg-white hover:bg-blue-50/80 cursor-pointer'
                }`}
              >
                <span
                  className={`font-semibold inline-flex items-center justify-center ${compact ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-sm'} rounded-full ${
                    isSelected
                      ? 'bg-white text-blue-700'
                      : isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-800'
                  }`}
                >
                  {d}
                </span>
                {badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-center leading-tight ${
                      isSelected ? 'bg-white/20 text-white border border-white/30' : badge.className
                    }`}
                  >
                    {badge.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> &gt;5 slots
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> ≤5 slots
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200" /> Saturday
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Full
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-slate-200" /> Closed
        </span>
      </div>
    </div>
  );
}
