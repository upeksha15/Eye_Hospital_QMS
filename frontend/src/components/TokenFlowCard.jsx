import React from 'react';
import { ArrowRight } from 'lucide-react';

const steps = ['Book Date', 'Arrive 7AM', 'Check In', 'Token T-001', 'Called in Order'];

export default function TokenFlowCard({ strings }) {
  return (
    <div className="rounded-[14px] border border-blue-100 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-800 mb-3">How your token works</p>
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
        {steps.map((label, i) => (
          <React.Fragment key={label}>
            <span className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-800">
              {label}
            </span>
            {i < steps.length - 1 && <ArrowRight className="w-4 h-4 text-blue-300 hidden sm:inline" />}
          </React.Fragment>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">{strings.tokenFlowNote}</p>
    </div>
  );
}
