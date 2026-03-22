import React from 'react';
import { Ticket } from 'lucide-react';
import { formatLongDate } from '../utils/dateHelpers';

export default function BookingSidebar({
  strings,
  lang,
  doctor,
  selectedDate,
  slot,
  patientName,
  visitReasonLabel,
  queueWaiting,
}) {
  const hours =
    slot?.isSaturday
      ? 'Sat 7:00–10:00'
      : selectedDate
        ? 'Mon–Fri 7:00–16:00'
        : '—';

  return (
    <div className="space-y-5 lg:sticky lg:top-28">
      <div className="rounded-[18px] bg-white border border-blue-100 shadow-[0_4px_24px_rgba(37,99,235,0.10)] p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="font-['Playfair_Display'] text-lg font-semibold text-[#1E3A8A]">
            {strings.summary}
          </h3>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Consultant</span>
            <span className="font-semibold text-slate-900 text-right">{doctor?.fullName || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Speciality</span>
            <span className="text-slate-800 text-right">{doctor?.speciality || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Room</span>
            <span className="text-slate-800">{doctor?.room ? `Room ${doctor.room}` : '—'}</span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-blue-200" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-900 text-right">
              {selectedDate
                ? formatLongDate(new Date(`${selectedDate}T12:00:00+05:30`), lang)
                : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">OPD hours</span>
            <span className="text-slate-800">{hours}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Slots left</span>
            <span className="font-semibold text-emerald-700">
              {slot ? slot.available : '—'}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Time slot</span>
            <span className="text-slate-800">OPD (morning)</span>
          </div>
        </div>

        <div className="my-4 border-t border-dashed border-blue-200" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Patient</span>
            <span className="font-medium text-right">{patientName || '—'}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span className="text-slate-500">Visit type</span>
            <span className="text-slate-800 text-right">{visitReasonLabel}</span>
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-blue-50 border border-blue-100 p-4">
          <p className="text-xs font-semibold text-blue-900">Token not yet assigned</p>
          <div className="flex items-start gap-3 mt-2">
            <Ticket className="w-8 h-8 text-blue-500 shrink-0" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <p>Check in from 7:00 AM on the day of your visit.</p>
              <p className="mt-1 text-slate-500">
                Queue position: {queueWaiting != null ? `${queueWaiting} waiting (est.)` : '—'}
              </p>
              <p className="mt-2 text-amber-800/90">
                Earlier arrival on the day typically means an earlier token number for that doctor.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[18px] bg-white border border-blue-100 shadow-md p-5">
        <h4 className="font-['Playfair_Display'] text-base font-semibold text-[#1E3A8A] mb-4">
          {strings.onTheDay}
        </h4>
        <ol className="space-y-3">
          {[
            'Arrive from 7:00 AM',
            'Complete digital check-in',
            'Receive token instantly (T-001, T-002…)',
            'Track queue live on your phone',
          ].map((text, i) => (
            <li key={text} className="flex gap-3">
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-slate-700 pt-0.5">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-[18px] bg-amber-50 border-l-4 border-amber-400 border border-amber-100 p-4 shadow-sm">
        <p className="text-sm font-semibold text-amber-900 mb-2">Saturday closes at 10:00 AM</p>
        <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc list-inside">
          <li>Bring your NIC and appointment reference.</li>
          <li>Masks recommended in waiting areas.</li>
          <li>One attendant per patient where possible.</li>
          <li>Follow staff instructions for dilated exams.</li>
          <li>Cancel early if you cannot attend — slots go to others.</li>
          <li>
            Emergency eye care: call{' '}
            <a className="font-semibold underline" href="tel:1990">
              1990
            </a>{' '}
            / hospital hotline.
          </li>
        </ul>
      </div>
    </div>
  );
}
