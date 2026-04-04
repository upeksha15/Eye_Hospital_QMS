import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  colomboMondayOfWeek,
  colomboDateFromYmd,
  colomboDaysInMonth,
  colomboWeekRangeLabel,
  colomboStartOfDay,
  colomboYmdFromDate,
  ymdParts,
} from '../utils/colomboDate';

const TZ = 'Asia/Colombo';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export default function PatientDetailsCalendar({ referenceDate, onSelectDate, disabled }) {
  const refParts = ymdParts(referenceDate);
  const [viewY, setViewY] = useState(refParts.y);
  const [viewM, setViewM] = useState(refParts.m);

  React.useEffect(() => {
    const p = ymdParts(referenceDate);
    setViewY(p.y);
    setViewM(p.m);
  }, [referenceDate]);

  const mondayOfRef = useMemo(() => colomboMondayOfWeek(colomboDateFromYmd(referenceDate)), [referenceDate]);

  const weekRows = useMemo(() => {
    const dim = colomboDaysInMonth(viewY, viewM);
    const first = colomboDateFromYmd(`${viewY}-${pad2(viewM)}-01`);
    const weekStart = colomboMondayOfWeek(first);
    const lead = Math.round((first.getTime() - weekStart.getTime()) / 86400000);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let day = 1; day <= dim; day++) {
      cells.push(`${viewY}-${pad2(viewM)}-${pad2(day)}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }
    return rows;
  }, [viewY, viewM]);

  const goPrevMonth = () => {
    if (viewM <= 1) {
      setViewY((y) => y - 1);
      setViewM(12);
    } else setViewM((m) => m - 1);
  };

  const goNextMonth = () => {
    if (viewM >= 12) {
      setViewY((y) => y + 1);
      setViewM(1);
    } else setViewM((m) => m + 1);
  };

  const monthTitle = new Date(`${viewY}-${pad2(viewM)}-15T12:00:00+05:30`).toLocaleDateString('en-GB', {
    timeZone: TZ,
    month: 'long',
    year: 'numeric',
  });

  const isYmdInReportWeek = (ymd) => {
    if (!ymd) return false;
    const mon = mondayOfRef.getTime();
    const sod = colomboStartOfDay(colomboDateFromYmd(ymd)).getTime();
    return sod >= mon && sod < mon + 7 * 86400000;
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm shadow-slate-900/5 ring-1 ring-slate-900/[0.03]">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 truncate text-xs font-medium leading-snug text-slate-700">{colomboWeekRangeLabel(referenceDate)}</p>
          <div className="flex shrink-0 overflow-hidden rounded-lg border border-slate-200/90 bg-white shadow-sm">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={disabled}
              className="border-r border-slate-100 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-35"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              disabled={disabled}
              className="p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-35"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <p className="border-b border-slate-100 bg-white py-2.5 text-center text-sm font-semibold text-[#001f3f]">{monthTitle}</p>

      <div className="flex flex-col gap-px bg-slate-200/60 p-px">
        <div className="grid grid-cols-7 gap-px">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="bg-slate-100 py-2.5 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500"
            >
              {w}
            </div>
          ))}
        </div>
        {weekRows.map((row, ri) => (
          <div
            key={ri}
            className="grid grid-cols-7 gap-px"
            role="row"
            onClick={() => {
              const pick = row.find((c) => c != null);
              if (!pick) return;
              const mon = colomboMondayOfWeek(colomboDateFromYmd(pick));
              onSelectDate(colomboYmdFromDate(mon));
            }}
          >
            {row.map((ymd, ci) => {
              if (!ymd) {
                return <div key={`e-${ri}-${ci}`} className="min-h-[2.75rem] cursor-pointer bg-slate-50/70" />;
              }
              const inWeek = isYmdInReportWeek(ymd);
              const isRef = ymd === referenceDate;
              const dayNum = Number(ymd.split('-')[2]);
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDate(ymd);
                  }}
                  className={[
                    'min-h-[2.75rem] text-sm font-medium transition-colors',
                    inWeek ? 'bg-emerald-50/90' : 'bg-white hover:bg-slate-50',
                    isRef ? 'ring-2 ring-inset ring-[#001f3f]/90' : '',
                    disabled ? 'cursor-not-allowed opacity-45' : 'cursor-pointer',
                  ].join(' ')}
                  title={ymd}
                >
                  <span
                    className={[
                      'mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums transition-shadow',
                      isRef
                        ? 'bg-[#001f3f] font-semibold text-white shadow-md shadow-[#001f3f]/25'
                        : inWeek
                          ? 'font-semibold text-emerald-900'
                          : 'text-slate-800',
                    ].join(' ')}
                  >
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
