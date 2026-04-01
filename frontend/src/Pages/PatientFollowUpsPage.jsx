import React from 'react';

export default function PatientFollowUpsPage() {
  return (
    <div className="min-h-screen bg-[#EBF4FF] font-['Nunito'] text-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-['Playfair_Display'] text-3xl text-[#1E3A8A] mb-3">Follow-Ups</h1>
        <p className="text-slate-600 mb-4">
          Follow-up appointments scheduled by your doctors will appear here. This section can be
          used to track recommended review visits after surgeries, treatments, or regular
          check-ups.
        </p>
        <div className="mt-6 rounded-2xl bg-white border border-blue-100 p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            You currently have no separate follow-up appointments listed. Your upcoming and past
            visits are visible in the appointments sections.
          </p>
        </div>
      </div>
    </div>
  );
}
