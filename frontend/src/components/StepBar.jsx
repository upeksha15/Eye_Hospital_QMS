import React from 'react';
import { Check } from 'lucide-react';

const steps = (s) => [
  { key: 'r', label: s.stepRegister, state: 'done' },
  { key: 'b', label: s.stepBook, state: 'active' },
  { key: 'a', label: s.stepArrive, state: 'pending' },
  { key: 't', label: s.stepToken, state: 'pending' },
];

export default function StepBar({ strings }) {
  const list = steps(strings);

  return (
    <div className="max-w-5xl mx-auto px-4 -mt-14 relative z-10 mb-10">
      <div className="rounded-2xl bg-white border border-blue-100 shadow-[0_4px_24px_rgba(37,99,235,0.10)] px-4 py-5 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {list.map((step, idx) => (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              <div className="flex items-center gap-3 w-full">
                <div
                  className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition ${
                    step.state === 'done'
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : step.state === 'active'
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-slate-200 text-slate-400 bg-slate-50'
                  }`}
                >
                  {step.state === 'done' ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-sm font-semibold truncate ${
                      step.state === 'pending' ? 'text-slate-400' : 'text-slate-800'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    {step.state === 'done' && 'Completed'}
                    {step.state === 'active' && 'In progress'}
                    {step.state === 'pending' && 'Upcoming'}
                  </p>
                </div>
              </div>
              {idx < list.length - 1 && (
                <div
                  className="hidden sm:block flex-1 h-0.5 mx-3 bg-gradient-to-r from-blue-200 to-blue-100 min-w-[24px]"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
